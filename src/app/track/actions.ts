"use server";

import { createClient } from "@/lib/supabase/server";

export type TrackedOrder = {
  status: string;
  finish: string;
  quantity: number;
  courier: string | null;
  tracking_number: string | null;
  created_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
};

export type TrackState = { error: string | null; order: TrackedOrder | null };

// Reference + phone must both match (see lookup_order in 0017). A miss gets
// one generic message so the form can't be used to confirm a reference exists.
export async function trackOrder(
  _prevState: TrackState,
  formData: FormData,
): Promise<TrackState> {
  const reference = String(formData.get("reference") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!reference || !phone) {
    return { error: "Enter your order reference and mobile number.", order: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_order", {
    p_reference: reference,
    p_phone: phone,
  });
  if (error) return { error: "Something went wrong. Please try again.", order: null };

  const order = data?.[0];
  if (!order) {
    return {
      error: "We couldn't find an order with that reference and number. Double-check both.",
      order: null,
    };
  }
  return { error: null, order };
}
