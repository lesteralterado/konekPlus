"use server";

import { revalidatePath } from "next/cache";
import { courierTrackingUrl } from "@/lib/couriers";
import { lockAmount } from "@/lib/order-amount";
import { sendEmail } from "@/lib/email/send";
import { shippedEmail } from "@/lib/email/templates";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import type { CardOrderStatus } from "@/lib/types";

export type AssignCardsResult =
  | { error: string }
  | { error: null; cards: { tag_id: string; pin: string }[] };

// Binds N unassigned tags to the order and returns each tag's fresh PIN. The
// plaintext PINs exist only in this response (the DB keeps a bcrypt hash), so
// the admin UI shows them once for printing the sleeve slip.
export async function assignCards(orderId: string, count: number): Promise<AssignCardsResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("assign_tags_to_order", {
    p_order_id: orderId,
    p_count: count,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  return { error: null, cards: data ?? [] };
}

export async function setOrderStatus(id: string, status: CardOrderStatus) {
  await requireAdmin();

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: order, error: readError } = await supabase
    .from("card_orders")
    .select("finish, quantity, payment_method, payment_status, amount_due_php")
    .eq("id", id)
    .single();
  if (readError) throw new Error(readError.message);

  // Confirming = the price is agreed with the customer, so lock it here.
  // Before this the UI shows a live estimate; afterwards price-config
  // changes never touch this order (0020_payments.sql).
  const lock = status === "confirmed" ? lockAmount(order) : {};

  // Delivered COD: the courier now holds the cash until they remit it.
  const cod =
    status === "delivered" && order.payment_method === "cod" && order.payment_status === "unpaid"
      ? { payment_status: "with_courier" as const }
      : {};

  const { error } = await supabase
    .from("card_orders")
    .update({
      status,
      ...(status === "shipped" ? { shipped_at: now } : {}),
      ...(status === "delivered" ? { delivered_at: now } : {}),
      ...lock,
      ...cod,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

// What happened to the shipping email: sent to the customer's address on the
// order, failed (Resend refused or isn't configured), or none (no email on the order).
export type ShipResult = { error: string | null; emailed?: "sent" | "failed" | "none"; emailedTo?: string };

// Records the courier + tracking number, flips the order to shipped, stamps
// its cards as shipped, and emails the CUSTOMER (the address on the order;
// nobody else gets a copy) when they gave one.
export async function markShipped(
  id: string,
  courier: string,
  trackingNumber: string,
): Promise<ShipResult> {
  await requireAdmin();

  const tracking = trackingNumber.trim();
  if (!courier || !tracking || tracking.length > 100) {
    return { error: "Pick a courier and enter the tracking number." };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Shipping without ever pressing "confirm" still locks the price.
  const { data: current } = await supabase
    .from("card_orders")
    .select("finish, quantity, amount_due_php")
    .eq("id", id)
    .single();

  const { data: order, error } = await supabase
    .from("card_orders")
    .update({
      status: "shipped",
      courier,
      tracking_number: tracking,
      shipped_at: now,
      ...(current ? lockAmount(current) : {}),
    })
    .eq("id", id)
    .select("full_name, email, quantity")
    .single();
  if (error) return { error: error.message };

  await supabase.from("tags").update({ shipped_at: now }).eq("order_id", id);

  let emailed: "sent" | "failed" | "none" = "none";
  const to = order.email;
  if (to) {
    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
    const message = shippedEmail({
      fullName: order.full_name,
      reference: `KP-${id.slice(0, 6).toUpperCase()}`,
      quantity: order.quantity,
      courier,
      trackingNumber: tracking,
      courierUrl: courierTrackingUrl(courier, tracking),
      trackUrl: `${siteUrl}/track`,
    });
    // Awaited, not fired in the background, so the admin is told whether it
    // really went out. (A background send that failed was invisible, and the
    // toast used to say "customer emailed" either way.)
    const result = await sendEmail({ to, ...message });
    emailed = result.ok ? "sent" : "failed";
  }

  revalidatePath("/admin/orders");
  return { error: null, emailed, emailedTo: to ?? undefined };
}
