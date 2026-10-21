import { createClient } from "@/lib/supabase/server";

const STALLED_AFTER_DAYS = 3;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function Row({ label, value, of }: { label: string; value: number; of: number }) {
  const pct = of > 0 ? Math.round((value / of) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-brand-900">{value.toLocaleString()}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-brand-600"
          style={{ width: `${Math.max(value > 0 ? 3 : 0, pct)}%` }}
        />
      </div>
    </div>
  );
}

// Where customers drop off between ordering and a live card. Reads through the
// admin's RLS-scoped client (admins can select orders and tags).
export async function ActivationFunnel() {
  const supabase = await createClient();
  const stalledBefore = daysAgoIso(STALLED_AFTER_DAYS);
  const count = { count: "exact", head: true } as const;

  const [placed, shippedOrders, assigned, shippedCards, activated, stalled] = await Promise.all([
    supabase.from("card_orders").select("id", count).neq("status", "cancelled"),
    supabase
      .from("card_orders")
      .select("id", count)
      .in("status", ["shipped", "delivered", "fulfilled"]),
    supabase.from("tags").select("tag_id", count).not("order_id", "is", null),
    supabase.from("tags").select("tag_id", count).not("shipped_at", "is", null),
    supabase
      .from("tags")
      .select("tag_id", count)
      .not("order_id", "is", null)
      .not("activated_at", "is", null),
    supabase
      .from("tags")
      .select("tag_id", count)
      .not("shipped_at", "is", null)
      .eq("claimed", false)
      .lt("shipped_at", stalledBefore),
  ]);

  const orders = placed.count ?? 0;
  const cards = assigned.count ?? 0;
  const shipped = shippedCards.count ?? 0;
  const live = activated.count ?? 0;
  const rate = shipped > 0 ? Math.round((live / shipped) * 100) : 0;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-brand-900">Order to live card</p>
        <p className="text-xs text-slate-500">
          {rate}% of shipped cards activated
          {(stalled.count ?? 0) > 0 && (
            <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
              {stalled.count} not activated after {STALLED_AFTER_DAYS}+ days
            </span>
          )}
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <Row label="Orders placed" value={orders} of={orders} />
        <Row label="Orders shipped" value={shippedOrders.count ?? 0} of={orders} />
        <Row label="Cards assigned to orders" value={cards} of={cards} />
        <Row label="Cards shipped" value={shipped} of={cards} />
        <Row label="Cards activated" value={live} of={cards} />
      </div>
    </div>
  );
}
