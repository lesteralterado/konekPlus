"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { isBillCategory, isExpenseCategory } from "@/lib/finance";
import { createClient } from "@/lib/supabase/server";

export type FinanceFormState = { error: string | null; resetToken: number };

const MAX_PHP = 10_000_000;

function amountFrom(formData: FormData, name: string): number | null {
  const raw = String(formData.get(name) ?? "").replace(/[,₱$\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= MAX_PHP ? Math.round(n * 100) / 100 : null;
}

export async function addBill(
  prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  await requireAdmin();
  const fail = (error: string) => ({ error, resetToken: prevState.resetToken });

  const vendor = String(formData.get("vendor") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const currency = formData.get("currency") === "PHP" ? "PHP" : "USD";
  const interval = formData.get("billing_interval") === "yearly" ? "yearly" : "monthly";
  const note = String(formData.get("note") ?? "").trim();
  const amount = amountFrom(formData, "amount");

  if (!vendor || vendor.length > 60) return fail("Add who you pay (60 characters max).");
  if (!isBillCategory(category)) return fail("Pick a category.");
  if (amount === null) return fail("Enter the amount, e.g. 25 or 7167.");
  if (note.length > 200) return fail("Keep the note under 200 characters.");

  const supabase = await createClient();
  const { error } = await supabase.from("finance_bills").insert({
    vendor,
    category,
    currency,
    amount,
    billing_interval: interval,
    note: note || null,
  });
  if (error) return fail(error.message);

  revalidatePath("/admin/finance");
  return { error: null, resetToken: Date.now() };
}

export async function setBillActive(id: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("finance_bills").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/finance");
}

export async function deleteBill(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  // Past expenses keep their amount; only the link to the bill is cleared.
  const { error } = await supabase.from("finance_bills").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/finance");
}

export async function logExpense(
  prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  await requireAdmin();
  const fail = (error: string) => ({ error, resetToken: prevState.resetToken });

  const billId = String(formData.get("bill_id") ?? "") || null;
  let category = String(formData.get("category") ?? "");
  let description = String(formData.get("description") ?? "").trim();
  const paidOn = String(formData.get("paid_on") ?? "");
  const amount = amountFrom(formData, "amount_php");

  const supabase = await createClient();

  // Paying a known bill: take its category and name unless overridden.
  if (billId) {
    const { data: bill } = await supabase
      .from("finance_bills")
      .select("vendor, category")
      .eq("id", billId)
      .maybeSingle();
    if (!bill) return fail("That bill no longer exists.");
    category = bill.category;
    description ||= bill.vendor;
  }

  if (!isExpenseCategory(category)) return fail("Pick a category.");
  if (!description || description.length > 120) return fail("Describe it (120 characters max).");
  if (amount === null || amount === 0) return fail("Enter the pesos that left the account.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) return fail("Pick the date you paid.");

  const { error } = await supabase.from("finance_expenses").insert({
    bill_id: billId,
    category,
    description,
    amount_php: amount,
    paid_on: paidOn,
  });
  if (error) return fail(error.message);

  revalidatePath("/admin/finance");
  return { error: null, resetToken: Date.now() };
}

export async function deleteExpense(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("finance_expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/finance");
}

export async function updateSettings(
  prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  await requireAdmin();
  const fail = (error: string) => ({ error, resetToken: prevState.resetToken });

  const rate = amountFrom(formData, "usd_php_rate");
  const balance = amountFrom(formData, "reserve_balance_php");
  const perCard = amountFrom(formData, "reserve_per_card_php");
  const months = Number(formData.get("reserve_target_months"));

  if (rate === null || rate <= 0 || rate > 200) return fail("Enter a USD→PHP rate, e.g. 66.");
  if (balance === null) return fail("Enter the reserve balance (0 if empty).");
  if (perCard === null) return fail("Enter how much to set aside per card.");
  if (!Number.isInteger(months) || months < 1 || months > 24) return fail("Target is 1–24 months.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("finance_settings")
    .update({
      usd_php_rate: rate,
      reserve_balance_php: balance,
      reserve_per_card_php: Math.round(perCard),
      reserve_target_months: months,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) return fail(error.message);

  revalidatePath("/admin/finance");
  return { error: null, resetToken: prevState.resetToken };
}
