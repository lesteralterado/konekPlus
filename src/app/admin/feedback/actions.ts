"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import type { FeedbackStatus } from "@/lib/types";

export async function setFeedbackStatus(id: string, status: FeedbackStatus) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("feedback").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/feedback");
}
