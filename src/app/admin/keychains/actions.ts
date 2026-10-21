"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import type { KeychainOrderStatus } from "@/lib/types";

async function setOrderStatus(
  orderId: string,
  status: KeychainOrderStatus,
  extra: Record<string, unknown> = {},
) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("keychain_orders")
    .update({ status, ...extra })
    .eq("id", orderId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/keychains");
  revalidatePath(`/admin/keychains/${orderId}`);
}

// Staff has read the submitted links and confirmed they're real profiles —
// brief §18's "LINKS VERIFIED" step.
export async function verifyLinks(orderId: string) {
  return setOrderStatus(orderId, "links_verified");
}

export async function markReadyForProgramming(orderId: string) {
  return setOrderStatus(orderId, "ready_for_programming");
}

// UI only shows this once every item is tested + QC'd (see the detail page),
// but the check isn't re-enforced here — same trust model as the rest of
// /admin (requireAdmin() is the only gate, matching resetTag/setTagEnabled).
export async function markReadyForHandover(orderId: string) {
  return setOrderStatus(orderId, "ready_for_handover");
}

export async function markHandedOver(orderId: string) {
  await requireAdmin();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("keychain_orders")
    .update({
      status: "handed_over",
      handed_over_at: new Date().toISOString(),
      handed_over_by: user?.id ?? null,
    })
    .eq("id", orderId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/keychains");
  revalidatePath(`/admin/keychains/${orderId}`);
}

export async function markCompleted(orderId: string) {
  return setOrderStatus(orderId, "completed");
}

// Staff write chips with the NFC Tools app (no Konek+ Staff app), then tap
// the keychain on a phone to test it and report back here:
//   works  → programmed + tested + QC passed in one tap
//   failed → flagged so it gets re-written
//   reset  → back to "pending programming" to redo a chip
// Once every item works, the detail page offers "Mark ready for handover"
// (left as a deliberate manual step).
export async function setItemNfcResult(
  itemId: string,
  orderId: string,
  result: "works" | "failed" | "reset",
) {
  await requireAdmin();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const by = user?.id ?? null;

  const update =
    result === "works"
      ? {
          nfc_status: "tested" as const,
          programmed_at: now,
          programmed_by: by,
          tested_at: now,
          qc_passed: true,
          qc_passed_at: now,
          qc_passed_by: by,
        }
      : result === "failed"
        ? {
            nfc_status: "failed" as const,
            tested_at: now,
            qc_passed: false,
            qc_passed_at: null,
            qc_passed_by: null,
          }
        : {
            nfc_status: "pending_programming" as const,
            programmed_at: null,
            programmed_by: null,
            tested_at: null,
            qc_passed: false,
            qc_passed_at: null,
            qc_passed_by: null,
          };

  const { error } = await supabase
    .from("keychain_items")
    .update(update)
    .eq("id", itemId)
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/keychains");
  revalidatePath(`/admin/keychains/${orderId}`);
}

// Manual QC override from the web dashboard — the primary QC flow runs on
// the mobile app right after programming/testing (brief §14), but staff can
// flip this here too (e.g. a physical re-inspection without re-scanning).
export async function setItemQcPassed(
  itemId: string,
  orderId: string,
  passed: boolean,
) {
  await requireAdmin();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("keychain_items")
    .update({
      qc_passed: passed,
      qc_passed_at: passed ? new Date().toISOString() : null,
      qc_passed_by: passed ? (user?.id ?? null) : null,
    })
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/keychains/${orderId}`);
}
