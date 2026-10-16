"use server";

import { redirect } from "next/navigation";
import {
  getOrCreateDeviceId,
  safeNextPath,
  sendLoginPinEmail,
} from "@/lib/device-verification";
import { createClient } from "@/lib/supabase/server";

// sentAt drives the form's visible resend cooldown.
export type VerifyDeviceState = { error: string | null; resent: boolean; sentAt?: number };

export async function verifyDevicePin(
  _prevState: VerifyDeviceState,
  formData: FormData,
): Promise<VerifyDeviceState> {
  const pin = String(formData.get("pin") ?? "").trim();
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!/^\d{6}$/.test(pin)) {
    return { error: "Enter the 6-digit code.", resent: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const deviceId = await getOrCreateDeviceId();
  const { data: ok, error } = await supabase.rpc("verify_login_pin", {
    p_device_id: deviceId,
    p_pin: pin,
  });
  if (error || !ok) {
    return { error: "That code is incorrect or has expired.", resent: false };
  }

  redirect(next);
}

export async function resendLoginPin(
  _prevState: VerifyDeviceState,
  _formData: FormData,
): Promise<VerifyDeviceState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!user.email) {
    return { error: "This account has no email on file.", resent: false };
  }

  // store_login_pin() raises during its 60s cooldown (0009_device_verification.sql).
  const { data: pin, error } = await supabase.rpc("store_login_pin");
  if (error || !pin) {
    return {
      error: "Please wait a minute before requesting another code.",
      resent: false,
    };
  }

  if (!(await sendLoginPinEmail(user.email, pin))) {
    return {
      error: "We couldn't send the code right now. Please try again in a minute.",
      resent: false,
    };
  }
  return { error: null, resent: true, sentAt: Date.now() };
}
