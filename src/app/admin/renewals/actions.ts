"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email/send";
import { proRenewedEmail } from "@/lib/email/templates";
import { formatPrice } from "@/lib/finishes";
import { formatPlanDate } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";

// Admin side of Pro renewals (0025). Owners only ever submit; Pro is
// extended here, by confirm_plan_payment, after a person checks the GCash.

export type RenewalResult = { error: string | null };

function refresh() {
  revalidatePath("/admin/renewals");
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
}

export async function confirmRenewal(id: string, amountReceived: string): Promise<RenewalResult> {
  await requireAdmin();
  const amount = Math.round(Number(amountReceived.replace(/[₱,\s]/g, "")));
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
    return { error: "Enter the amount received." };
  }

  const supabase = await createClient();
  const { data: proUntil, error } = await supabase.rpc("confirm_plan_payment", {
    p_id: id,
    p_amount_received: amount,
  });
  if (error) return { error: error.message };
  if (!proUntil) return { error: "This renewal was already handled." };

  // Receipt to the email on their profile, when they've added one.
  const { data: payment } = await supabase
    .from("plan_payments")
    .select("profile_id")
    .eq("id", id)
    .single();
  const { data: profile } = payment
    ? await supabase.from("profiles").select("full_name, email").eq("id", payment.profile_id).single()
    : { data: null };
  const to = profile?.email;
  if (to) {
    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
    const message = proRenewedEmail({
      fullName: profile.full_name || "there",
      amount: formatPrice(amount),
      proUntil: formatPlanDate(proUntil),
      dashboardUrl: `${siteUrl}/dashboard`,
    });
    after(() => sendEmail({ to, ...message }));
  }

  refresh();
  return { error: null };
}

// The proof doesn't check out. The owner sees the reason on their dashboard
// and can send a new one.
export async function rejectRenewal(id: string, reason: string): Promise<RenewalResult> {
  await requireAdmin();
  const note = reason.trim().slice(0, 300);
  if (!note) return { error: "Say what's wrong, so they can fix it." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("plan_payments")
    .update({ status: "rejected", admin_note: note })
    .eq("id", id)
    .eq("status", "proof_submitted");
  if (error) return { error: error.message };

  refresh();
  return { error: null };
}
