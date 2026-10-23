"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { provisionTags } from "@/lib/provision-tags";

// Unclaims a tag — for lost/defective cards or ownership disputes. Detaches
// it from its current profile so it can be claimed again from scratch.
// Shared by the tags list and the customer detail page's "unlink" action.
export async function resetTag(tagId: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("tags")
    .update({ claimed: false, profile_id: null, claimed_at: null })
    .eq("tag_id", tagId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/tags");
  revalidatePath("/admin/customers");
  revalidatePath(`/t/${tagId}`);
}

// Records that a card's chip has been written (with NFC Tools) and tested —
// or clears it to redo. Same admin UPDATE policy as setTagEnabled below.
export async function setTagWritten(tagId: string, written: boolean) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("tags")
    .update({ written_at: written ? new Date().toISOString() : null })
    .eq("tag_id", tagId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/tags");
  revalidatePath("/admin/orders");
}

// New sleeve PIN for an unclaimed card whose slip was lost (reset_tag_pin,
// 0021). The old PIN stops working; the new one is returned once.
export async function resetCardPin(
  tagId: string,
): Promise<{ pin: string | null; error: string | null }> {
  await requireAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reset_tag_pin", { p_tag_id: tagId });
  if (error) return { pin: null, error: error.message };

  revalidatePath("/admin/orders");
  return { pin: data, error: null };
}

// Lets an admin flip a claimed tag's visibility on the owner's behalf —
// support cases where a customer wants their card hidden but can't do it
// themselves. Uses the regular RLS-scoped client: the "Admins can reset any
// tag" UPDATE policy from 0005_admin_rls.sql already permits admins to
// update any column on `tags`, not just claimed/profile_id/claimed_at, so
// no new RLS policy or RPC is needed for this.
export async function setTagEnabled(tagId: string, enabled: boolean) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("tags")
    .update({ enabled })
    .eq("tag_id", tagId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/tags");
  revalidatePath("/admin/customers");
  revalidatePath(`/t/${tagId}`);
}

export type ProvisionState = { error: string | null; codes: string[] };

export async function provisionBatch(
  _prevState: ProvisionState,
  formData: FormData,
): Promise<ProvisionState> {
  await requireAdmin();

  const count = Number(formData.get("count"));
  if (!Number.isInteger(count) || count <= 0 || count > 500) {
    return { error: "Enter a whole number between 1 and 500.", codes: [] };
  }
  const note = String(formData.get("note") ?? "").trim() || undefined;

  const supabase = await createClient();
  try {
    const codes = await provisionTags(supabase, count, note);
    revalidatePath("/admin/tags");
    return { error: null, codes };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to provision tags.",
      codes: [],
    };
  }
}
