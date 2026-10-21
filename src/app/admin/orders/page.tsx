import Link from "next/link";
import { finishById, formatPrice, quote } from "@/lib/finishes";
import { createClient } from "@/lib/supabase/server";
import type { CardOrderStatus } from "@/lib/types";
import { AssignCards } from "./assign-cards";
import { OrderStatusSelect } from "./status-select";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: CardOrderStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "fulfilled", label: "Fulfilled (legacy)" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_LABEL = { cod: "Cash on delivery", gcash: "GCash" } as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status: statusParam, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const status = STATUS_FILTERS.find((f) => f.value === statusParam)?.value || undefined;

  const supabase = await createClient();

  let query = supabase
    .from("card_orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);

  const [{ data: orders, count }, { count: newCount }] = await Promise.all([
    query,
    supabase.from("card_orders").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: assignedTags } = orderIds.length
    ? await supabase.from("tags").select("tag_id, order_id").in("order_id", orderIds)
    : { data: [] };
  const codesByOrder = new Map<string, string[]>();
  for (const t of assignedTags ?? []) {
    if (!t.order_id) continue;
    codesByOrder.set(t.order_id, [...(codesByOrder.get(t.order_id) ?? []), t.tag_id]);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const baseParams: Record<string, string> = status ? { status } : {};

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold text-brand-900">Orders</h1>
        {(newCount ?? 0) > 0 && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
            {newCount} new — waiting to be contacted
          </span>
        )}
      </div>

      <section className="rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6">
        <div className="mb-4 flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/admin/orders?${new URLSearchParams(f.value ? { status: f.value } : {})}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                (status ?? "") === f.value
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          {(orders ?? []).map((order) => {
            // Recomputed from the live price config — the table deliberately
            // stores no prices (see 0015_card_orders.sql).
            const q = quote(order.finish, order.quantity);
            return (
              <div
                key={order.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      KP-{order.id.slice(0, 6).toUpperCase()}
                    </span>
                    <span className="font-semibold text-brand-900">
                      {order.quantity} × {finishById(order.finish).name}
                    </span>
                    <span className="font-semibold text-brand-900">{formatPrice(q.totalPhp)}</span>
                    {q.discountPct > 0 && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        −{q.discountPct}% bulk
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      {PAYMENT_LABEL[order.payment_method]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    {order.full_name} ·{" "}
                    <a href={`tel:${order.phone}`} className="text-brand-700 hover:underline">
                      {order.phone}
                    </a>
                    {order.email && (
                      <>
                        {" · "}
                        <a href={`mailto:${order.email}`} className="text-brand-700 hover:underline">
                          {order.email}
                        </a>
                      </>
                    )}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{order.address}</p>
                  {order.notes && (
                    <p className="mt-1 whitespace-pre-wrap text-sm italic text-slate-500">
                      “{order.notes}”
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                  {order.status !== "cancelled" && (
                    <AssignCards
                      orderId={order.id}
                      reference={`KP-${order.id.slice(0, 6).toUpperCase()}`}
                      quantity={order.quantity}
                      assignedCodes={codesByOrder.get(order.id) ?? []}
                    />
                  )}
                </div>
                <OrderStatusSelect id={order.id} status={order.status} />
              </div>
            );
          })}
          {(orders ?? []).length === 0 && (
            <p className="py-8 text-center text-slate-400">No orders yet.</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              Page {page} of {totalPages} ({count} total)
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/orders?${new URLSearchParams({ ...baseParams, page: String(page - 1) })}`}
                  className="rounded-full bg-slate-100 px-3 py-1.5 hover:bg-slate-200"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/orders?${new URLSearchParams({ ...baseParams, page: String(page + 1) })}`}
                  className="rounded-full bg-slate-100 px-3 py-1.5 hover:bg-slate-200"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
