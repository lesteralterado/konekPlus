"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import type { CardOrderStatus } from "@/lib/types";

export async function setOrderStatus(id: string, status: CardOrderStatus) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("card_orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
}
