"use server";

import { revalidatePath } from "next/cache";
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
  const { error } = await supabase.from("card_orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
}
