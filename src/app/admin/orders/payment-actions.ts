"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email/send";
import { paymentReceivedEmail } from "@/lib/email/templates";
import { formatPrice } from "@/lib/finishes";
import { lockAmount } from "@/lib/order-amount";
import { createClient } from "@/lib/supabase/server";
import type { PaidVia } from "@/lib/types";

const PAID_VIA = new Set<PaidVia>(["cash", "gcash", "bank", "courier"]);

// Payment side of a card order (lifecycle in 0020_payments.sql). Every
// action is admin-only; customers can only *submit* GCash proof, via the
// submit_payment_proof RPC from /track.

export type PaymentResult = { error: string | null };

function refresh() {
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

function parsePhp(value: unknown): number | null {
  const n = Math.round(Number(String(value ?? "").replace(/[₱,\s]/g, "")));
  return Number.isFinite(n) && n >= 0 && n <= 10_000_000 ? n : null;
}

// Paid in full (GCash verified, GCash without proof, cash, or a COD
// remittance). Emails the customer a receipt when they gave an email.
export async function markPaid(
  id: string,
  amountReceived: string,
  gcashRef: string,
  via: string,
): Promise<PaymentResult> {
  await requireAdmin();
  const amount = parsePhp(amountReceived);
  if (amount === null) return { error: "Enter the amount received." };
  if (!PAID_VIA.has(via as PaidVia)) return { error: "Pick how the money came in." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: current, error: readError } = await supabase
    .from("card_orders")
    .select("finish, quantity, amount_due_php, gcash_reference")
    .eq("id", id)
    .single();
  if (readError) return { error: readError.message };

  const ref = gcashRef.trim().slice(0, 40);
  const { data: order, error } = await supabase
    .from("card_orders")
    .update({
      payment_status: "paid",
      amount_received_php: amount,
      paid_at: new Date().toISOString(),
      paid_confirmed_by: user?.id ?? null,
      paid_via: via as PaidVia,
      gcash_reference: ref || current.gcash_reference,
      payment_note: null,
      ...lockAmount(current),
    })
    .eq("id", id)
    .select("full_name, email")
    .single();
  if (error) return { error: error.message };

  const to = order.email;
  if (to) {
    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
    const message = paymentReceivedEmail({
      fullName: order.full_name,
      reference: `KP-${id.slice(0, 6).toUpperCase()}`,
      amount: formatPrice(amount),
      trackUrl: `${siteUrl}/track`,
    });
    after(() => sendEmail({ to, ...message }));
  }

  refresh();
  return { error: null };
}

// GCash proof doesn't check out — back to unpaid with a reason the customer
// sees on /track, where they can send it again.
export async function rejectProof(id: string, reason: string): Promise<PaymentResult> {
  await requireAdmin();
  const note = reason.trim().slice(0, 300);
  if (!note) return { error: "Say what's wrong, so the customer can fix it." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("card_orders")
    .update({ payment_status: "unpaid", payment_note: note })
    .eq("id", id)
    .eq("payment_status", "proof_submitted");
  if (error) return { error: error.message };

  refresh();
  return { error: null };
}

export async function markRefunded(id: string, note: string): Promise<PaymentResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("card_orders")
    .update({ payment_status: "refunded", payment_note: note.trim().slice(0, 300) || null })
    .eq("id", id);
  if (error) return { error: error.message };

  refresh();
  return { error: null };
}

// Safety net for a mis-tap: clears the paid record. Delivered COD orders go
// back to "with courier", everything else to "unpaid".
export async function undoPayment(id: string): Promise<PaymentResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: order, error: readError } = await supabase
    .from("card_orders")
    .select("payment_method, status")
    .eq("id", id)
    .single();
  if (readError) return { error: readError.message };

  const { error } = await supabase
    .from("card_orders")
    .update({
      payment_status:
        order.payment_method === "cod" && order.status === "delivered" ? "with_courier" : "unpaid",
      amount_received_php: null,
      paid_at: null,
      paid_confirmed_by: null,
      paid_via: null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  refresh();
  return { error: null };
}

// Manual price adjustment (negotiated discount, extra fee…).
export async function setAmountDue(id: string, amount: string): Promise<PaymentResult> {
  await requireAdmin();
  const php = parsePhp(amount);
  if (php === null) return { error: "Enter a valid amount." };

  const supabase = await createClient();
  const { error } = await supabase.from("card_orders").update({ amount_due_php: php }).eq("id", id);
  if (error) return { error: error.message };

  refresh();
  return { error: null };
}

// Short-lived link to a private GCash screenshot (payment-proofs bucket is
// admin-read-only, see 0020).
export async function getProofUrl(path: string): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}
