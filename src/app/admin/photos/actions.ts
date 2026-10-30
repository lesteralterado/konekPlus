"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { CONSENT_TEXT_VERSION } from "@/lib/photo-consent";
import { PHOTO_FREEBIE } from "@/lib/photo-freebie";
import { createClient } from "@/lib/supabase/server";

// Photos with customers at handover (lifecycle and consent model in
// 0026_customer_photos.sql). Every action is admin-only.

export type PhotoResult = { error: string | null };

// The bucket limit is 1.5 MiB; the app sends ~250 KB.
const MAX_BYTES = 1_500_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function refresh() {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/keychains", "layout");
  revalidatePath("/admin");
}

// A photo taken with the customer at handover, with the consent they gave.
// The client has already downsized it to a JPEG; the type is re-checked here
// by its first bytes, not just its label.
export async function saveHandoverPhoto(formData: FormData): Promise<PhotoResult> {
  await requireAdmin();

  const kind = formData.get("kind");
  const orderId = String(formData.get("order_id") ?? "");
  if ((kind !== "keychain" && kind !== "card") || !UUID.test(orderId)) {
    return { error: "That order wasn't recognised." };
  }

  // The private record and the age line are the minimum for any photo.
  if (formData.get("consent_record") !== "1" || formData.get("consent_age") !== "1") {
    return { error: "The customer has to agree to the photo first." };
  }
  const consentSocial = formData.get("consent_social") === "1";
  const consentWebsite = formData.get("consent_website") === "1";

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Take or choose a photo first." };
  if (file.size > MAX_BYTES) return { error: "That photo is too big — try again." };
  const head = new Uint8Array(await file.slice(0, 3).arrayBuffer());
  if (head[0] !== 0xff || head[1] !== 0xd8 || head[2] !== 0xff) {
    return { error: "The photo must be a JPEG image." };
  }

  const supabase = await createClient();
  const orderColumn = kind === "keychain" ? "keychain_order_id" : "card_order_id";

  const { data: order } =
    kind === "keychain"
      ? await supabase.from("keychain_orders").select("id").eq("id", orderId).maybeSingle()
      : await supabase.from("card_orders").select("id").eq("id", orderId).maybeSingle();
  if (!order) return { error: "That order no longer exists." };

  // One freebie per order: a later photo is saved without another one, and a
  // withdrawn photo's freebie still counts.
  let freebieStatus: "pending" | "none" = "none";
  if (PHOTO_FREEBIE.enabled) {
    const { data: existing } = await supabase
      .from("customer_photos")
      .select("id")
      .eq(orderColumn, orderId)
      .in("freebie_status", ["pending", "given"])
      .limit(1);
    if (!existing?.length) freebieStatus = "pending";
  }

  const path = `${orderId}/${crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("customer-photos")
    .upload(path, file, { contentType: "image/jpeg" });
  if (uploadError) return { error: "We couldn't upload the photo. Please try again." };

  const { error } = await supabase.from("customer_photos").insert({
    source: kind === "keychain" ? "keychain_handover" : "card_handover",
    keychain_order_id: kind === "keychain" ? orderId : null,
    card_order_id: kind === "card" ? orderId : null,
    photo_path: path,
    consent_text_version: CONSENT_TEXT_VERSION,
    consent_social: consentSocial,
    consent_website: consentWebsite,
    consent_recorded_by: "staff",
    freebie_status: freebieStatus,
  });
  if (error) {
    // Don't leave a photo behind that nothing records consent for.
    await supabase.storage.from("customer-photos").remove([path]);
    return { error: "We couldn't save the photo. Please try again." };
  }

  refresh();
  return { error: null };
}

// The thank-you was handed over (note = what it was), or the customer
// didn't want it. Only moves a pending freebie, so it can't be rewritten.
export async function setFreebie(
  photoId: string,
  status: "given" | "declined",
  note: string,
): Promise<PhotoResult> {
  await requireAdmin();
  if (!UUID.test(photoId)) return { error: "That photo wasn't recognised." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("customer_photos")
    .update({
      freebie_status: status,
      freebie_note: note.trim().slice(0, 200) || null,
      ...(status === "given"
        ? { freebie_given_at: new Date().toISOString(), freebie_given_by: user?.id ?? null }
        : {}),
    })
    .eq("id", photoId)
    .eq("freebie_status", "pending")
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "That freebie was already handled." };

  refresh();
  return { error: null };
}

// The customer changed their mind. Whatever is PUBLIC comes down first (the
// website testimonial and its cropped copy), then the private file; the files
// are deleted before the row is marked withdrawn, so a failure never leaves a
// photo that looks withdrawn but still exists, and a retry finishes the job.
// The row stays as the consent and freebie record. A given freebie is not
// taken back.
export async function withdrawPhoto(photoId: string): Promise<PhotoResult> {
  await requireAdmin();
  if (!UUID.test(photoId)) return { error: "That photo wasn't recognised." };

  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("customer_photos")
    .select("photo_path, status, website_photo_path")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo) return { error: "That photo no longer exists." };

  // Off the website at once: unpublish any testimonial built on this photo.
  const { error: unpublishError } = await supabase
    .from("landing_testimonials")
    .update({ published: false, photo_url: null })
    .eq("customer_photo_id", photoId);
  if (unpublishError) return { error: unpublishError.message };

  if (photo.website_photo_path) {
    const { error: publicError } = await supabase.storage
      .from("testimonial-photos")
      .remove([photo.website_photo_path]);
    if (publicError) return { error: "We couldn't delete the website copy. Please try again." };
  }

  if (photo.photo_path) {
    const { error: removeError } = await supabase.storage
      .from("customer-photos")
      .remove([photo.photo_path]);
    if (removeError) return { error: "We couldn't delete the file. Please try again." };
  }

  const { error } = await supabase
    .from("customer_photos")
    .update({
      status: "withdrawn",
      withdrawn_at: new Date().toISOString(),
      photo_path: null,
      website_photo_path: null,
    })
    .eq("id", photoId);
  if (error) return { error: error.message };

  refresh();
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  return { error: null };
}

// Turn a photo whose customer agreed to website use into a DRAFT testimonial:
// the admin's square crop goes to the public testimonial-photos bucket and the
// customer's own words become the quote. It is published separately, from
// /admin/testimonials. The private original stays private.
export async function publishPhotoToWebsite(formData: FormData): Promise<PhotoResult> {
  await requireAdmin();

  const photoId = String(formData.get("photo_id") ?? "");
  const authorName = String(formData.get("author_name") ?? "").trim();
  const authorRole = String(formData.get("author_role") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 5);

  if (!UUID.test(photoId)) return { error: "That photo wasn't recognised." };
  if (!authorName || authorName.length > 80) return { error: "Add the name to show (80 characters max)." };
  if (authorRole.length > 120) return { error: "Keep the role under 120 characters." };
  if (!quote || quote.length > 400) return { error: "Add their words (400 characters max)." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Stars must be 1–5." };

  const crop = formData.get("photo");
  if (!(crop instanceof File) || crop.size === 0) return { error: "The photo is missing." };
  // The bucket limit is 512 KiB; the app sends a ~512px crop (under 100 KB).
  if (crop.size > 500_000) return { error: "That photo is too big — try again." };
  const head = new Uint8Array(await crop.slice(0, 3).arrayBuffer());
  if (head[0] !== 0xff || head[1] !== 0xd8 || head[2] !== 0xff) {
    return { error: "The photo must be a JPEG image." };
  }

  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("customer_photos")
    .select("status, consent_website, website_photo_path")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo) return { error: "That photo no longer exists." };
  if (photo.status !== "active" || !photo.consent_website) {
    return { error: "This customer didn't agree to website use." };
  }
  if (photo.website_photo_path) return { error: "This photo is already on the website." };

  const path = `${photoId}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("testimonial-photos")
    .upload(path, crop, { contentType: "image/jpeg" });
  if (uploadError) return { error: "We couldn't upload the photo. Please try again." };

  const removeCopy = () => supabase.storage.from("testimonial-photos").remove([path]);

  const {
    data: { publicUrl },
  } = supabase.storage.from("testimonial-photos").getPublicUrl(path);

  const { data: testimonial, error: insertError } = await supabase
    .from("landing_testimonials")
    .insert({
      author_name: authorName,
      author_role: authorRole || null,
      quote,
      rating,
      photo_url: publicUrl,
      customer_photo_id: photoId,
    })
    .select("id")
    .single();
  if (insertError) {
    await removeCopy();
    return { error: "We couldn't create the testimonial. Please try again." };
  }

  const { error: linkError } = await supabase
    .from("customer_photos")
    .update({ website_photo_path: path })
    .eq("id", photoId);
  if (linkError) {
    // Without the link a later withdrawal couldn't find the public copy, so
    // don't leave one behind.
    await supabase.from("landing_testimonials").delete().eq("id", testimonial.id);
    await removeCopy();
    return { error: "We couldn't save the photo. Please try again." };
  }

  refresh();
  revalidatePath("/admin/testimonials");
  return { error: null };
}
