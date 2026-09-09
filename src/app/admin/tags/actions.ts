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
