import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { KeychainOrderStatus } from "@/lib/types";
import { SearchIcon } from "../icons";
import { OrderStatusBadge } from "./status-badge";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: KeychainOrderStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "social_links_submitted", label: "Needs verification" },
  { value: "links_verified", label: "Verified" },
  { value: "ready_for_programming", label: "Ready for programming" },
  { value: "ready_for_handover", label: "Ready for handover" },
  { value: "handed_over", label: "Handed over" },
  { value: "completed", label: "Completed" },
];

export default async function AdminKeychainsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status: statusParam, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const status = STATUS_FILTERS.find((f) => f.value === statusParam)?.value || undefined;

  const supabase = await createClient();

  let ordersQuery = supabase
    .from("keychain_orders")
    .select(
      "id, customer_name, contact_phone, contact_email, status, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (q) ordersQuery = ordersQuery.ilike("customer_name", `%${q}%`);
  if (status) ordersQuery = ordersQuery.eq("status", status);

  const { data: orders, count } = await ordersQuery;

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: items } =
    orderIds.length > 0
      ? await supabase
          .from("keychain_items")
          .select("order_id, nfc_status, qc_passed")
          .in("order_id", orderIds)
      : { data: [] };

  const summaryByOrder = new Map<
    string,
    { total: number; programmed: number; qcPassed: number }
  >();
  for (const item of items ?? []) {
    const summary = summaryByOrder.get(item.order_id) ?? {
      total: 0,
      programmed: 0,
      qcPassed: 0,
    };
    summary.total += 1;
    if (item.nfc_status === "programmed" || item.nfc_status === "tested") {
      summary.programmed += 1;
    }
    if (item.qc_passed) summary.qcPassed += 1;
    summaryByOrder.set(item.order_id, summary);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const baseParams = { ...(q ? { q } : {}), ...(status ? { status } : {}) };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-900">
        Social Media Keychains
      </h1>

      <section className="rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6">
        <div className="mb-4 flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/admin/keychains?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(f.value ? { status: f.value } : {}),
              })}`}
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

        <form className="mb-4 flex items-center gap-2" action="/admin/keychains">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative max-w-xs flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by customer name"
              className="w-full rounded-2xl bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4 font-medium">Customer</th>
                <th className="pb-2 pr-4 font-medium">Contact</th>
                <th className="pb-2 pr-4 font-medium">Keychains</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(orders ?? []).map((order) => {
                const summary = summaryByOrder.get(order.id) ?? {
                  total: 0,
                  programmed: 0,
                  qcPassed: 0,
                };
                return (
                  <tr key={order.id}>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/keychains/${order.id}`}
                        className="font-medium text-slate-700 hover:text-brand-700"
                      >
                        {order.customer_name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {order.contact_phone || order.contact_email || "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {summary.total} ({summary.programmed} programmed,{" "}
                      {summary.qcPassed} QC&apos;d)
                    </td>
                    <td className="py-3 pr-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {(orders ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No keychain orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              Page {page} of {totalPages} ({count} total)
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/keychains?${new URLSearchParams({ ...baseParams, page: String(page - 1) })}`}
                  className="rounded-full bg-slate-100 px-3 py-1.5 hover:bg-slate-200"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/keychains?${new URLSearchParams({ ...baseParams, page: String(page + 1) })}`}
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
