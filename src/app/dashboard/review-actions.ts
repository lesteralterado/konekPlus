"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { storeMyPhoto } from "@/lib/customer-photo";
import { CONSENT_TEXT_VERSION } from "@/lib/photo-consent";
import { rateLimit, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { withdrawMyPhoto } from "./photo-actions";

// A card owner's review of Konek+ (lifecycle and consent model in
// 0030_customer_reviews.sql). It goes to an admin inbox; it only reaches the
// website when an admin publishes it.

export type ReviewResult = { error: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/testimonials");
  revalidatePath("/admin/photos");
}

export async function submitReview(formData: FormData): Promise<ReviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rating = Number(formData.get("rating"));
  const message = String(formData.get("message") ?? "").trim();
  const name = String(formData.get("display_name") ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Choose your stars first." };
  if (!message || message.length > 400) return { error: "Write your message (400 characters max)." };
  if (!name || name.length > 80) return { error: "Add the name to show (80 characters max)." };
  if (formData.get("consent_review") !== "1" || formData.get("consent_age") !== "1") {
    return { error: "Please tick the two required boxes first." };
  }

  // An optional photo, with its own consent: the private record is the minimum.
  const photo = formData.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0;
  if (hasPhoto && formData.get("photo_consent_record") !== "1") {
    return { error: "Tick the box to keep your photo privately, or remove the photo." };
  }

  if (!(await rateLimit("customerReview"))) return { error: RATE_LIMITED_MESSAGE };

  let photoId: string | null = null;
  if (hasPhoto) {
    if (!(await rateLimit("customerPhoto"))) return { error: RATE_LIMITED_MESSAGE };
    const stored = await storeMyPhoto(supabase, user.id, photo, {
      social: formData.get("photo_consent_social") === "1",
      website: formData.get("photo_consent_website") === "1",
    });
    if ("error" in stored) return { error: stored.error };
    photoId = stored.id;
  }

  const { data: id, error } = await supabase.rpc("submit_customer_review", {
    p_rating: rating,
    p_message: message,
    p_display_name: name,
    p_text_version: CONSENT_TEXT_VERSION,
    p_photo_id: photoId,
  });
  if (error || !id) {
    // Don't leave a photo behind that nothing refers to.
    if (photoId) await withdrawMyPhoto(photoId);
    return { error: "We couldn't save your review. You may have already sent one." };
  }

  refresh();
  return { error: null };
}

// The owner takes their review back: their words come off the website and
// the review is deleted, and so is the photo they attached (if any).
export async function removeMyReview(reviewId: string): Promise<ReviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!UUID.test(reviewId)) return { error: "That review wasn't recognised." };

  const { data, error } = await supabase.rpc("withdraw_customer_review", { p_id: reviewId });
  if (error) return { error: "We couldn't remove your review. Please try again." };
  const row = data?.[0];
  if (!row) return { error: "We couldn't find that review." };

  if (row.photo_id) {
    const result = await withdrawMyPhoto(row.photo_id);
    if (result.error) {
      refresh();
      revalidatePath("/");
      return result;
    }
  }

  refresh();
  revalidatePath("/");
  return { error: null };
}

// The pop-up opens once: remember it was shown so it doesn't come back every
// visit (a card on the dashboard stays for anyone who still wants to review).
export async function markReviewPromptSeen(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ review_prompt_seen_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("review_prompt_seen_at", null);
  // Also clears the browser's cached copy of the page, so it can't reopen.
  revalidatePath("/dashboard");
}
