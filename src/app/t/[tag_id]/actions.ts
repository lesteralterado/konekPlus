"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";
import {
  getOrCreateDeviceId,
  isDeviceVerificationEnabled,
  issueLoginPinAndGetVerifyUrl,
} from "@/lib/device-verification";
import { createClient } from "@/lib/supabase/server";

export type ClaimState = { error: string | null };

// claim_tag returns false for a wrong PIN, a locked tag and an already-claimed
// tag alike (see 0017_order_cards.sql), so the copy has to cover all three.
const CLAIM_FAILED =
  "We couldn't activate this card. Check the PIN on your card sleeve, or it may already be linked. Too many wrong tries pause it for 15 minutes.";

// Shared by both claim paths below so a card claim never becomes a second,
// inconsistent way for a device to end up trusted — same check /login uses.
// See supabase/migrations/0009_device_verification.sql. Deliberately runs
// *after* claim_tag() succeeds in both callers, not before: gating the
// claim itself behind device verification would mean re-deriving "claim
// intent" through a detour that doesn't own it, for a low-severity action —
// linking a card to an account you just password-authenticated into isn't
// the surface this feature protects; ongoing /dashboard access is.
async function redirectAfterClaim(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  next: string,
): Promise<never> {
  const deviceId = await getOrCreateDeviceId();
  if (isDeviceVerificationEnabled()) {
    const { data: trusted } = await supabase.rpc("is_device_trusted", {
      p_device_id: deviceId,
    });
    if (!trusted) redirect(await issueLoginPinAndGetVerifyUrl(supabase, email, next));
  }

  redirect(next);
}

// Why a PIN attempt failed, so the form can say it plainly (and in FIL).
// Comes from tag_pin_state (0021); absent if that RPC isn't available.
export type PinFailure =
  | { kind: "wrong"; triesLeft: number }
  | { kind: "locked"; minutes: number }
  | { kind: "claimed" };

export type VerifyPinState = {
  error: string | null;
  reason?: PinFailure;
  verified: {
    pin: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

// Step 1 of activation. Checks the sleeve PIN and returns the contact details
// from the order for prefilling; claim_tag() re-checks the PIN at the end, so
// the client carrying it forward grants nothing by itself.
export async function verifyTagPin(
  _prevState: VerifyPinState,
  formData: FormData,
): Promise<VerifyPinState> {
  const tagId = String(formData.get("tag_id") ?? "");
  // Digits only, so a pasted "581 706" or "581-706" still works.
  const pin = String(formData.get("pin") ?? "").replace(/\D/g, "");
  if (!tagId) return { error: "Missing card code.", verified: null };
  if (!/^\d{6}$/.test(pin)) {
    return { error: "Enter the 6-digit PIN from the sleeve.", verified: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_tag_pin", {
    p_tag_id: tagId,
    p_pin: pin,
  });
  if (error) return { error: error.message, verified: null };

  const row = data?.[0];
  if (!row) {
    const { data: pinState } = await supabase.rpc("tag_pin_state", { p_tag_id: tagId });
    const st = pinState?.[0];
    if (st?.state === "claimed") return { error: CLAIM_FAILED, reason: { kind: "claimed" }, verified: null };
    if (st?.state === "locked") {
      return { error: CLAIM_FAILED, reason: { kind: "locked", minutes: Math.max(1, st.locked_minutes) }, verified: null };
    }
    if (st?.state === "ok") {
      return { error: CLAIM_FAILED, reason: { kind: "wrong", triesLeft: st.attempts_left }, verified: null };
    }
    return { error: CLAIM_FAILED, verified: null };
  }

  return { error: null, verified: { pin, ...row } };
}

// New owner: create the Auth user, create their one profiles row, then link
// this tag to it. See supabase/migrations/0001_init.sql for claim_tag().
export async function signUpAndClaim(
  _prevState: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const tagId = String(formData.get("tag_id") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const jobTitle = String(formData.get("job_title") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!tagId) return { error: "Missing card code." };
  if (!fullName) return { error: "Full name is required." };
  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpError) return { error: signUpError.message };
  if (!signUpData.session) {
    // No active session means email confirmation is still required on this
    // project (Authentication -> Sign In / Providers -> Email -> Confirm
    // email) — signUpData.user can be truthy even with no session, and
    // inserting the profile without a session fails RLS since auth.uid()
    // is null for the rest of this request.
    return {
      error:
        "Check your email to confirm your account, then tap this card again and enter your PIN to finish linking it.",
    };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    user_id: signUpData.session.user.id,
    full_name: fullName,
    job_title: jobTitle || null,
    company: company || null,
    phone: phone || null,
    email,
  });
  if (profileError) return { error: profileError.message };

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_tag",
    { p_tag_id: tagId, p_pin: pin || null },
  );
  if (claimError) return { error: claimError.message };
  if (!claimed) return { error: CLAIM_FAILED };

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const welcome = welcomeEmail({
    fullName,
    dashboardUrl: `${siteUrl}/dashboard`,
    profileUrl: `${siteUrl}/t/${encodeURIComponent(tagId)}`,
  });
  after(() => sendEmail({ to: email, ...welcome }));

  return redirectAfterClaim(supabase, email, `/t/${tagId}?activated=1`);
}

// resetToken only changes on success — the dialog form uses it as a React
// `key` to clear its uncontrolled inputs. Same pattern as
// src/app/feedback-actions.ts / src/app/dashboard/portfolio/actions.ts.
export type TestimonialFormState = { error: string | null; resetToken: number };

export async function submitTestimonial(
  prevState: TestimonialFormState,
  formData: FormData,
): Promise<TestimonialFormState> {
  // Honeypot — see src/app/feedback-actions.ts for why this field exists.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { error: null, resetToken: Date.now() };
  }

  const profileId = String(formData.get("profile_id") ?? "");
  const authorName = String(formData.get("author_name") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();

  if (!profileId) {
    return { error: "Missing profile.", resetToken: prevState.resetToken };
  }
  if (!message) {
    return { error: "Say a bit about your experience.", resetToken: prevState.resetToken };
  }
  if (message.length > 500) {
    return { error: "Keep it under 500 characters.", resetToken: prevState.resetToken };
  }
  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Pick a star rating.", resetToken: prevState.resetToken };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profile_testimonials").insert({
    profile_id: profileId,
    author_name: authorName || null,
    rating,
    message,
  });
  if (error) return { error: error.message, resetToken: prevState.resetToken };

  return { error: null, resetToken: Date.now() };
}

// Existing owner: log in, then link this tag to their existing profile — no
// new profile fields needed.
export async function linkExistingAndClaim(
  _prevState: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const tagId = String(formData.get("tag_id") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!tagId) return { error: "Missing card code." };
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) return { error: signInError.message };

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_tag",
    { p_tag_id: tagId, p_pin: pin || null },
  );
  if (claimError) return { error: claimError.message };
  if (!claimed) return { error: CLAIM_FAILED };

  return redirectAfterClaim(supabase, email, `/t/${tagId}?activated=1`);
}
