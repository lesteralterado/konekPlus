"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { courierTrackingUrl } from "@/lib/couriers";
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
  const { error } = await supabase
    .from("card_orders")
    .update({
      status,
      ...(status === "shipped" ? { shipped_at: now } : {}),
      ...(status === "delivered" ? { delivered_at: now } : {}),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
}

// Records the courier + tracking number, flips the order to shipped, stamps
// its cards as shipped, and emails the customer (when they gave an email).
export async function markShipped(
  id: string,
  courier: string,
  trackingNumber: string,
): Promise<{ error: string | null }> {
  await requireAdmin();

  const tracking = trackingNumber.trim();
  if (!courier || !tracking || tracking.length > 100) {
    return { error: "Pick a courier and enter the tracking number." };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: order, error } = await supabase
    .from("card_orders")
    .update({
      status: "shipped",
      courier,
      tracking_number: tracking,
      shipped_at: now,
    })
    .eq("id", id)
    .select("full_name, email, quantity")
    .single();
  if (error) return { error: error.message };

  await supabase.from("tags").update({ shipped_at: now }).eq("order_id", id);

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
    after(() => sendEmail({ to, ...message }));
  }

  revalidatePath("/admin/orders");
  return { error: null };
}
