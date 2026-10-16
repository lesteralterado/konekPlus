"use server";

import { redirect } from "next/navigation";
import {
  getOrCreateDeviceId,
  isDeviceVerificationEnabled,
  issueLoginPinAndGetVerifyUrl,
  safeNextPath,
} from "@/lib/device-verification";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

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
