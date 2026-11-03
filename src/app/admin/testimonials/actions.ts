"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { approvePhoto } from "../photos/actions";

export type AddTestimonialState = { error: string | null; resetToken: number };
export type ReviewResult = { error: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function revalidate() {
  revalidatePath("/admin/testimonials");
  // The homepage is ISR'd (revalidate = 300) — refresh it now so a
  // publish shows up immediately rather than within 5 minutes.
  revalidatePath("/");
}

export async function addTestimonial(
  prevState: AddTestimonialState,
  formData: FormData,
): Promise<AddTestimonialState> {
  await requireAdmin();

  const authorName = String(formData.get("author_name") ?? "").trim();
  const authorRole = String(formData.get("author_role") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 5);
  const fail = (error: string) => ({ error, resetToken: prevState.resetToken });

  if (!authorName || authorName.length > 80) return fail("Add the customer's name (80 characters max).");
  if (authorRole.length > 120) return fail("Keep the role under 120 characters.");
  if (!quote || quote.length > 400) return fail("Add the quote (400 characters max).");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail("Rating must be 1–5.");

  const supabase = await createClient();
  const { error } = await supabase.from("landing_testimonials").insert({
    author_name: authorName,
    author_role: authorRole || null,
    quote,
    rating,
  });
  if (error) return fail(error.message);

  revalidate();
  return { error: null, resetToken: Date.now() };
}

export async function setTestimonialPublished(id: string, published: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("landing_testimonials").update({ published }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidate();
}

export async function deleteTestimonial(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("landing_testimonials")
    .select("customer_photo_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("landing_testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);

  // A photo testimonial's public copy goes with it (best effort — the private
  // photo and its consent record are untouched).
  if (row?.customer_photo_id) {
    const { data: photo } = await supabase
      .from("customer_photos")
      .select("website_photo_path")
      .eq("id", row.customer_photo_id)
      .maybeSingle();
    if (photo?.website_photo_path) {
      await supabase.storage.from("testimonial-photos").remove([photo.website_photo_path]);
      await supabase
        .from("customer_photos")
        .update({ website_photo_path: null })
        .eq("id", row.customer_photo_id);
    }
    revalidatePath("/admin/photos");
  }
  revalidate();
}

// A customer's review (0030) goes live: their stars, name and message become a
// published testimonial. With a cropped photo (only when the customer ticked
// website use for it) the photo goes up with it, and is approved on the way.
// Each step is undone if a later one fails, so a failure never leaves a public
// photo or a testimonial that nothing refers to.
export async function publishReview(formData: FormData): Promise<ReviewResult> {
  await requireAdmin();

  const reviewId = String(formData.get("review_id") ?? "");
  if (!UUID.test(reviewId)) return { error: "That review wasn't recognised." };

  const crop = formData.get("photo");
  const withPhoto = crop instanceof File && crop.size > 0;

  const supabase = await createClient();
  const { data: review } = await supabase
    .from("customer_reviews")
    .select("*")
    .eq("id", reviewId)
    .maybeSingle();
  if (!review) return { error: "That review no longer exists." };
  if (review.status !== "new") return { error: "This review was already handled." };

  let photoStatus: string | null = null;
  let cropPath: string | null = null;
  let photoUrl: string | null = null;

  if (withPhoto) {
    if (!review.photo_id) return { error: "This review has no photo." };
    // The bucket limit is 512 KiB; the app sends a ~512px crop (under 100 KB).
    if (crop.size > 500_000) return { error: "That photo is too big — try again." };
    const head = new Uint8Array(await crop.slice(0, 3).arrayBuffer());
    if (head[0] !== 0xff || head[1] !== 0xd8 || head[2] !== 0xff) {
      return { error: "The photo must be a JPEG image." };
    }

    const { data: photo } = await supabase
      .from("customer_photos")
      .select("status, consent_website, website_photo_path")
      .eq("id", review.photo_id)
      .maybeSingle();
    if (!photo || photo.status === "withdrawn" || !photo.consent_website) {
      return { error: "This customer didn't agree to website use of the photo." };
    }
    if (photo.website_photo_path) return { error: "This photo is already on the website." };
    photoStatus = photo.status;

    cropPath = `${review.photo_id}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("testimonial-photos")
      .upload(cropPath, crop, { contentType: "image/jpeg" });
    if (uploadError) return { error: "We couldn't upload the photo. Please try again." };
    photoUrl = supabase.storage.from("testimonial-photos").getPublicUrl(cropPath).data.publicUrl;
  }

  const undoCrop = async () => {
    if (cropPath) await supabase.storage.from("testimonial-photos").remove([cropPath]);
  };

  const { data: testimonial, error: insertError } = await supabase
    .from("landing_testimonials")
    .insert({
      author_name: review.display_name,
      quote: review.message,
      rating: review.rating,
      published: true,
      ...(photoUrl ? { photo_url: photoUrl, customer_photo_id: review.photo_id } : {}),
    })
    .select("id")
    .single();
  if (insertError) {
    await undoCrop();
    return { error: "We couldn't publish the review. Please try again." };
  }

  if (cropPath && review.photo_id) {
    const { error: linkError } = await supabase
      .from("customer_photos")
      .update({ website_photo_path: cropPath })
      .eq("id", review.photo_id);
    if (linkError) {
      await supabase.from("landing_testimonials").delete().eq("id", testimonial.id);
      await undoCrop();
      return { error: "We couldn't save the photo. Please try again." };
    }
  }

  const { data: updated, error: reviewError } = await supabase
    .from("customer_reviews")
    .update({
      status: "approved",
      testimonial_id: testimonial.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("status", "new")
    .select("id");
  if (reviewError || !updated?.length) {
    await supabase.from("landing_testimonials").delete().eq("id", testimonial.id);
    if (cropPath && review.photo_id) {
      await supabase.from("customer_photos").update({ website_photo_path: null }).eq("id", review.photo_id);
    }
    await undoCrop();
    return { error: "We couldn't publish the review. Please try again." };
  }

  // Putting their photo on the site is the review of the photo too.
  if (cropPath && review.photo_id && photoStatus === "pending_review") {
    await approvePhoto(review.photo_id);
  }

  revalidate();
  revalidatePath("/admin");
  revalidatePath("/admin/photos");
  return { error: null };
}

// A review that won't be shown. It's deleted (their words aren't kept once
// they won't be used), so the customer can write another. An attached photo
// keeps its own entry in /admin/photos.
export async function rejectReview(reviewId: string): Promise<ReviewResult> {
  await requireAdmin();
  if (!UUID.test(reviewId)) return { error: "That review wasn't recognised." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("status", "new")
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "This review was already handled." };

  revalidatePath("/admin/testimonials");
  revalidatePath("/admin");
  return { error: null };
}
