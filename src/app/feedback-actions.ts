"use server";

import { createClient } from "@/lib/supabase/server";

// resetToken only changes on success — the dialog form uses it as a React
// `key` to clear its uncontrolled inputs without wiping what was typed if a
// submission comes back with a validation error. Same pattern as
// src/app/dashboard/portfolio/actions.ts.
export type FeedbackFormState = { error: string | null; resetToken: number };

const CATEGORIES = new Set(["bug", "feature", "general"]);

export async function submitFeedback(
  prevState: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  // Honeypot: a real visitor never sees or fills this field (hidden via
  // CSS in the form). A bot that blindly fills every input will. Report
  // success without writing anything, so the bot doesn't learn to avoid it.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { error: null, resetToken: Date.now() };
  }

  const category = String(formData.get("category") ?? "general");
  const message = String(formData.get("message") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const pagePath = String(formData.get("page_path") ?? "").trim();

  if (!CATEGORIES.has(category)) {
    return { error: "Pick a valid category.", resetToken: prevState.resetToken };
  }
  if (!message) {
    return { error: "Let us know what's on your mind.", resetToken: prevState.resetToken };
  }
  if (message.length > 2000) {
    return { error: "Keep it under 2000 characters.", resetToken: prevState.resetToken };
  }

  let rating: number | null = null;
  if (ratingRaw) {
    rating = Number(ratingRaw);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { error: "Rating must be between 1 and 5.", resetToken: prevState.resetToken };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let screenshotUrl: string | null = null;
  const screenshot = formData.get("screenshot");
  if (screenshot instanceof File && screenshot.size > 0) {
    const ext = screenshot.name.split(".").pop() || "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("feedback")
      .upload(path, screenshot, { contentType: screenshot.type });
    if (uploadError) {
      return { error: uploadError.message, resetToken: prevState.resetToken };
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("feedback").getPublicUrl(path);
    screenshotUrl = publicUrl;
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    category: category as "bug" | "feature" | "general",
    message,
    rating,
    screenshot_url: screenshotUrl,
    page_path: pagePath || null,
  });
  if (error) return { error: error.message, resetToken: prevState.resetToken };

  return { error: null, resetToken: Date.now() };
}
