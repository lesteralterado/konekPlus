"use server";

import { redirect } from "next/navigation";
import {
  getOrCreateDeviceId,
  isDeviceVerificationEnabled,
  issueLoginPinAndGetVerifyUrl,
  safeNextPath,
} from "@/lib/device-verification";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

// An error CODE, not text: the form turns it into the visitor's language
// (the same pattern as the order form). It also keeps Supabase's own wording
// off the screen, and "invalid" stays the same whether the email has an
// account or not, so this form can't be used to find out who's a customer.
export type LoginError = "required" | "invalid" | "unconfirmed" | "rate" | "unknown";
// `email` comes back with an error so the form can keep it: React clears the
// fields after every submission, and retyping an email because of a typo in
// the password is just annoying. The password is deliberately not kept.
export type LoginState = { error: LoginError | null; email?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  const fail = (code: LoginError): LoginState => ({ error: code, email });

  if (!email || !password) return fail("required");
  if (!(await rateLimit("login"))) return fail("rate");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "invalid_credentials" || error.message === "Invalid login credentials") {
      return fail("invalid");
    }
    if (error.code === "email_not_confirmed") return fail("unconfirmed");
    if (error.status === 429 || error.code === "over_request_rate_limit") return fail("rate");
    // Anything else is ours to look at, not the visitor's to read.
    console.error("[login] unexpected sign-in error:", error.code, error.status);
    return fail("unknown");
  }

  // Password check passed. With new-device verification switched on, that's
  // not enough on its own to reach /dashboard from an unrecognized browser.
  // See supabase/migrations/0009_device_verification.sql and src/proxy.ts.
  const deviceId = await getOrCreateDeviceId();
  if (isDeviceVerificationEnabled()) {
    const { data: trusted } = await supabase.rpc("is_device_trusted", {
      p_device_id: deviceId,
    });
    if (!trusted) redirect(await issueLoginPinAndGetVerifyUrl(supabase, email, next));
  }

  redirect(next);
}
