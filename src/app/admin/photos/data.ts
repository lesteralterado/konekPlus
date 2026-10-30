import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { CustomerPhoto } from "@/lib/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type OrderPhotos = {
  byOrder: Map<string, CustomerPhoto[]>;
  // Short-lived signed links for the files still stored, keyed by photo_path.
  urls: Map<string, string>;
};

// The photos for a set of orders, newest first. The bucket is private, so
// each file that still exists gets a 10-minute signed link (one batched call,
// like the payment-proof links in admin/orders/payment-actions.ts).
export async function loadOrderPhotos(
  supabase: Supabase,
  column: "keychain_order_id" | "card_order_id",
  orderIds: string[],
): Promise<OrderPhotos> {
  const byOrder = new Map<string, CustomerPhoto[]>();
  const urls = new Map<string, string>();
  if (!orderIds.length) return { byOrder, urls };

  const { data } = await supabase
    .from("customer_photos")
    .select("*")
    .in(column, orderIds)
    .order("created_at", { ascending: false });
  const rows = data ?? [];

  for (const photo of rows) {
    const orderId = photo[column];
    if (orderId) byOrder.set(orderId, [...(byOrder.get(orderId) ?? []), photo]);
  }

  const paths = rows.map((p) => p.photo_path).filter((p): p is string => !!p);
  if (paths.length) {
    const { data: signed } = await supabase.storage.from("customer-photos").createSignedUrls(paths, 600);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    }
  }

  return { byOrder, urls };
}
