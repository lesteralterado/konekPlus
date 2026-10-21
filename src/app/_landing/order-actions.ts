"use server";

import { after } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { orderAlertEmail, orderConfirmationEmail } from "@/lib/email/templates";
import {
  finishById,
  formatPrice,
  isFinishId,
  MAX_QUANTITY,
  quote,
  type FinishId,
} from "@/lib/finishes";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/lib/types";

// Codes, not messages — the form maps them to EN/FIL copy.
export type OrderErrorCode =
  | "finish"
  | "quantity"
  | "name"
  | "phone"
  | "email"
  | "address"
  | "payment"
  | "server";

export type OrderFormState =
  | { status: "idle" }
  | { status: "error"; error: OrderErrorCode }
  // finish/quantity echo what the server actually recorded, so the
  // confirmation screen shows the customer exactly what we'll fulfil.
  | { status: "success"; reference: string; finish: FinishId; quantity: number };

const PAYMENT_METHODS = new Set<PaymentMethod>(["cod", "gcash"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function placeOrder(
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const fail = (error: OrderErrorCode): OrderFormState => ({ status: "error", error });

  // Honeypot — see src/app/feedback-actions.ts. Report success without
  // writing, so a bot doesn't learn the field is a trap.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success", reference: "KP-000000", finish: "obsidian", quantity: 1 };
  }

  const finish = String(formData.get("finish") ?? "");
  const quantity = Number(formData.get("quantity"));
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const payment = String(formData.get("payment_method") ?? "") as PaymentMethod;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!isFinishId(finish)) return fail("finish");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return fail("quantity");
  }
  if (!fullName || fullName.length > 120) return fail("name");
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 7 || phoneDigits.length > 15 || phone.length > 30) {
    return fail("phone");
  }
  // Required: the confirmation, shipping updates and activation guidance all
  // go by email.
  if (email.length > 200 || !EMAIL_PATTERN.test(email)) return fail("email");
  if (address.length < 3 || address.length > 500) return fail("address");
  if (!PAYMENT_METHODS.has(payment)) return fail("payment");

  // Generated here because RLS doesn't let an anonymous visitor read the
  // row back — this is how they get a reference to quote when we contact them.
  const id = crypto.randomUUID();

  const supabase = await createClient();
  const { error } = await supabase.from("card_orders").insert({
    id,
    finish,
    quantity,
    full_name: fullName,
    phone,
    email: email || null,
    address,
    payment_method: payment,
    notes: notes.slice(0, 1000) || null,
  });
  if (error) return fail("server");

  const reference = `KP-${id.slice(0, 6).toUpperCase()}`;

  // Confirmation to the customer — same after() treatment as the owner alert.
  {
    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
    const message = orderConfirmationEmail({
      fullName,
      reference,
      finishName: finishById(finish).name,
      quantity,
      total: formatPrice(quote(finish, quantity).totalPhp),
      payment: payment === "cod" ? "Cash on delivery" : "GCash",
      trackUrl: `${siteUrl}/track`,
    });
    after(() => sendEmail({ to: email, ...message }));
  }

  // Alert the owner — after the response, so the customer never waits on
  // it, and a failed alert never affects their order. Skipped when
  // ORDER_ALERT_EMAIL isn't set.
  const alertTo = process.env.ORDER_ALERT_EMAIL;
  if (alertTo) {
    const q = quote(finish, quantity);
    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
    after(() =>
      sendEmail({
        to: alertTo,
        ...orderAlertEmail({
          reference,
          finishName: finishById(finish).name,
          quantity,
          total: formatPrice(q.totalPhp),
          discountPct: q.discountPct,
          fullName,
          phone,
          email: email || null,
          address,
          payment: payment === "cod" ? "Cash on delivery" : "GCash",
          notes: notes.slice(0, 1000) || null,
          adminUrl: `${siteUrl}/admin/orders`,
        }),
      }),
    );
  }

  return { status: "success", reference, finish, quantity };
}
