"use server";

import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

// An error CODE, translated by the form (see login/actions.ts).
export type ForgotPasswordError = "required" | "rate";
export type ForgotPasswordState = {
  status: "idle" | "sent" | "error";
  error: ForgotPasswordError | null;
  // Handed back with an error so the form keeps what was typed.
  email?: string;
};

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { status: "error", error: "required", email };
  if (!(await rateLimit("forgotPassword"))) return { status: "error", error: "rate", email };

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Must be in Supabase → Auth → URL Configuration → Redirect URLs.
    redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
  });

  // Rate limiting is the one failure worth surfacing — it says nothing
  // about whether the account exists.
  if (error?.status === 429) return { status: "error", error: "rate", email };

  // Same answer whether or not the email has an account, so this form
  // can't be used to find out who's a customer.
  return { status: "sent", error: null };
}
