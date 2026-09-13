"use server";

import { createPublicClient } from "@/lib/supabase/public";
import type { KeychainPlatform } from "@/lib/types";

export type KeychainSubmissionItem = {
  platform: KeychainPlatform;
  profileUrl: string;
  accountLabel: string;
};

export type SubmitKeychainOrderInput = {
  customerName: string;
  contactPhone: string;
  contactEmail: string;
  items: KeychainSubmissionItem[];
};

export type SubmitKeychainOrderResult = { error: string | null; orderId: string | null };

// Public, unauthenticated submission (brief §2 — one common QR code, no
// customer account). Goes through submit_keychain_order() rather than a raw
// insert — see supabase/migrations/0010_social_keychain.sql. Uses the
// anon/cookie-free client since this route never needs a session.
export async function submitKeychainOrder(
  input: SubmitKeychainOrderInput,
): Promise<SubmitKeychainOrderResult> {
  const customerName = input.customerName.trim();
  if (!customerName) {
    return { error: "Enter your name.", orderId: null };
  }
  if (input.items.length === 0) {
    return { error: "Add at least one social media account.", orderId: null };
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("submit_keychain_order", {
    p_customer_name: customerName,
    p_contact_phone: input.contactPhone.trim() || null,
    p_contact_email: input.contactEmail.trim() || null,
    p_items: input.items.map((item) => ({
      platform: item.platform,
      profile_url: item.profileUrl,
      account_label: item.accountLabel || undefined,
    })),
  });

  if (error) return { error: error.message, orderId: null };
  return { error: null, orderId: data };
}
