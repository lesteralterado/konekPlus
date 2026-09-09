"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ClaimState = { error: string | null };

// New owner: create the Auth user, create their one profiles row, then link
// this tag to it. See supabase/migrations/0001_init.sql for claim_tag().
export async function signUpAndClaim(
  _prevState: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const tagId = String(formData.get("tag_id") ?? "");
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
        "Check your email to confirm your account, then tap this card again to finish linking it.",
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
    { p_tag_id: tagId },
  );
  if (claimError) return { error: claimError.message };
  if (!claimed) {
    return {
      error: "This card was just claimed by someone else. Refresh and try again.",
    };
  }

  redirect(`/t/${tagId}`);
}

// Existing owner: log in, then link this tag to their existing profile — no
// new profile fields needed.
export async function linkExistingAndClaim(
  _prevState: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const tagId = String(formData.get("tag_id") ?? "");
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
    { p_tag_id: tagId },
  );
  if (claimError) return { error: claimError.message };
  if (!claimed) {
    return {
      error:
        "This card couldn't be linked — it may already belong to another profile. Refresh and try again.",
    };
  }

  redirect(`/t/${tagId}`);
}
