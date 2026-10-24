"use server";

import { rateLimit, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = { status: "idle" | "sent" | "error"; error: string | null };

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { status: "error", error: "Enter your email address." };
  if (!(await rateLimit("forgotPassword"))) return { status: "error", error: RATE_LIMITED_MESSAGE };

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Must be in Supabase → Auth → URL Configuration → Redirect URLs.
    redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
  });

  // Rate limiting is the one failure worth surfacing — it says nothing
  // about whether the account exists.
  if (error?.status === 429) {
    return { status: "error", error: "Too many requests. Please wait a few minutes and try again." };
  }

  // Same answer whether or not the email has an account, so this form
  // can't be used to find out who's a customer.
  return { status: "sent", error: null };
}
