"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { planProofAlertEmail } from "@/lib/email/templates";
import { formatPrice } from "@/lib/finishes";
import { PRO_TERMS, isProTerm } from "@/lib/plan";
import { rateLimit, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type RenewState = { error: string | null; sent: boolean };

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};
// Vercel rejects request bodies over ~4.5 MB, so stay under that.
const MAX_BYTES = 4 * 1024 * 1024;

// The owner paid for Pro by GCash and sends the reference (required) and a
// screenshot (optional). A person checks it in /admin/renewals; Pro is only
// extended then (confirm_plan_payment, 0025).
export async function submitRenewal(_prev: RenewState, formData: FormData): Promise<RenewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const term = String(formData.get("term") ?? "");
  const gcashRef = String(formData.get("gcash_ref") ?? "").replace(/\s+/g, "").trim();
  const file = formData.get("screenshot");

  if (!isProTerm(term)) return { error: "Choose 1 year or 1 month.", sent: false };
  if (!gcashRef || gcashRef.length > 40) {
    return { error: "Enter the reference number from your GCash receipt.", sent: false };
  }
  if (!(await rateLimit("paymentProof", "plan"))) return { error: RATE_LIMITED_MESSAGE, sent: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) redirect("/dashboard");

  let path: string | null = null;
  if (file instanceof File && file.size > 0) {
    const ext = IMAGE_EXT[file.type];
    if (!ext) return { error: "The screenshot must be a JPG, PNG, WEBP or HEIC image.", sent: false };
    if (file.size > MAX_BYTES) return { error: "The screenshot is too big (max 4 MB).", sent: false };
    path = `plan-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      return { error: "We couldn't upload the screenshot. Try again, or send just the reference.", sent: false };
    }
  }

  const { months, pricePhp, label } = PRO_TERMS[term];
  const { error } = await supabase.from("plan_payments").insert({
    profile_id: profile.id,
    term,
    months,
    amount_due_php: pricePhp,
    gcash_reference: gcashRef,
    proof_path: path,
  });
  if (error) {
    // The unique index allows one pending renewal at a time.
    return {
      error:
        error.code === "23505"
          ? "You already sent a renewal — we're checking it now."
          : "We couldn't record this payment. Please try again, or message us.",
      sent: false,
    };
  }

  const alertTo = process.env.ORDER_ALERT_EMAIL;
  if (alertTo) {
    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
    const message = planProofAlertEmail({
      fullName: profile.full_name || "A cardholder",
      termLabel: label,
      amountDue: formatPrice(pricePhp),
      gcashReference: gcashRef,
      hasScreenshot: !!path,
      adminUrl: `${siteUrl}/admin/renewals`,
    });
    after(() => sendEmail({ to: alertTo, ...message }));
  }

  revalidatePath("/dashboard");
  return { error: null, sent: true };
}
