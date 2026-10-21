"use server";

import { after } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { paymentProofAlertEmail } from "@/lib/email/templates";
import { formatPrice } from "@/lib/finishes";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod, PaymentStatus } from "@/lib/types";

export type TrackedOrder = {
  status: string;
  finish: string;
  quantity: number;
  courier: string | null;
  tracking_number: string | null;
  created_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  amount_due_php: number | null;
  payment_note: string | null;
};

export type GcashAccount = { name: string; number: string } | null;

export type TrackState = {
  error: string | null;
  order: TrackedOrder | null;
  // Echoed back so the payment-proof form can re-verify the same order.
  reference?: string;
  phone?: string;
  gcash?: GcashAccount;
};

// Where customers send GCash payments. Unset → the page says we'll message
// the details instead (see .env.local.example).
function gcashAccount(): GcashAccount {
  const name = process.env.GCASH_ACCOUNT_NAME?.trim();
  const number = process.env.GCASH_ACCOUNT_NUMBER?.trim();
  return name && number ? { name, number } : null;
}

// Reference + phone must both match (see lookup_order in 0017/0020). A miss
// gets one generic message so the form can't be used to confirm a reference exists.
export async function trackOrder(
  _prevState: TrackState,
  formData: FormData,
): Promise<TrackState> {
  const reference = String(formData.get("reference") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!reference || !phone) {
    return { error: "Enter your order reference and mobile number.", order: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_order", {
    p_reference: reference,
    p_phone: phone,
  });
  if (error) return { error: "Something went wrong. Please try again.", order: null };

  const order = data?.[0];
  if (!order) {
    return {
      error: "We couldn't find an order with that reference and number. Double-check both.",
      order: null,
    };
  }
  return { error: null, order, reference, phone, gcash: gcashAccount() };
}

export type ProofState = { error: string | null; sent: boolean };

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};
// Vercel rejects request bodies over ~4.5 MB, so stay under that.
const MAX_BYTES = 4 * 1024 * 1024;

// Customer's GCash proof: reference number (required) + screenshot
// (optional). The screenshot goes to the private payment-proofs bucket; the
// submit_payment_proof RPC re-checks reference + phone and that the order is
// a confirmed, unpaid GCash order before recording anything.
export async function submitPaymentProof(
  _prev: ProofState,
  formData: FormData,
): Promise<ProofState> {
  const reference = String(formData.get("reference") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const gcashRef = String(formData.get("gcash_ref") ?? "").replace(/\s+/g, "").trim();
  const file = formData.get("screenshot");

  if (!gcashRef || gcashRef.length > 40) {
    return { error: "Enter the reference number from your GCash receipt.", sent: false };
  }

  const supabase = await createClient();

  let path: string | null = null;
  if (file instanceof File && file.size > 0) {
    const ext = IMAGE_EXT[file.type];
    if (!ext) return { error: "The screenshot must be a JPG, PNG, WEBP or HEIC image.", sent: false };
    if (file.size > MAX_BYTES) return { error: "The screenshot is too big (max 4 MB).", sent: false };
    path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      return { error: "We couldn't upload the screenshot. Try again, or send just the reference.", sent: false };
    }
  }

  const { data: orderId, error } = await supabase.rpc("submit_payment_proof", {
    p_reference: reference,
    p_phone: phone,
    p_gcash_ref: gcashRef,
    p_proof_path: path,
  });
  if (error || !orderId) {
    return {
      error: "We couldn't record this payment. Make sure your order is confirmed and not paid yet, or message us.",
      sent: false,
    };
  }

  const alertTo = process.env.ORDER_ALERT_EMAIL;
  if (alertTo) {
    const { data } = await supabase.rpc("lookup_order", { p_reference: reference, p_phone: phone });
    const due = data?.[0]?.amount_due_php;
    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
    const message = paymentProofAlertEmail({
      reference: `KP-${orderId.slice(0, 6).toUpperCase()}`,
      fullName: "A customer",
      amountDue: due != null ? formatPrice(due) : "—",
      gcashReference: gcashRef,
      hasScreenshot: !!path,
      adminUrl: `${siteUrl}/admin/orders?pay=proof_submitted`,
    });
    after(() => sendEmail({ to: alertTo, ...message }));
  }

  return { error: null, sent: true };
}
