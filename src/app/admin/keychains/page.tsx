import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { KeychainOrderStatus } from "@/lib/types";
import { ChevronRightIcon, MailIcon, PhoneIcon } from "../icons";
import { CARD, EmptyState, FilterChips, PANEL, Pager, SearchBar } from "../ui/kit";
import { KEYCHAIN_STATUS, StatusPill } from "../ui/status";
import { OrderStatusBadge } from "./status-badge";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: KeychainOrderStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "social_links_submitted", label: "Verify links" },
  { value: "links_verified", label: "Verified" },
  { value: "ready_for_programming", label: "To program" },
  { value: "ready_for_handover", label: "Hand over" },
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
    <div className="flex flex-col gap-5 md:gap-6">
      <h1 className="text-[28px] font-bold tracking-tight text-brand-900 md:text-2xl md:font-semibold">
        Keychains
      </h1>

      <section className={PANEL}>
        <FilterChips
          items={STATUS_FILTERS}
          active={status ?? ""}
          hrefFor={(v) =>
            `/admin/keychains?${new URLSearchParams({ ...(q ? { q } : {}), ...(v ? { status: v } : {}) })}`
          }
        />
        <SearchBar
          action="/admin/keychains"
          q={q}
          placeholder="Search customer"
          hidden={status ? { status } : {}}
        />

        {/* Phones: card per order with a programming progress bar */}
        <ul className="flex flex-col gap-3 md:hidden">
          {(orders ?? []).map((order) => {
            const summary = summaryByOrder.get(order.id) ?? { total: 0, programmed: 0, qcPassed: 0 };
            const pct = summary.total ? Math.round((summary.programmed / summary.total) * 100) : 0;
            return (
              <li key={order.id}>
                <Link href={`/admin/keychains/${order.id}`} className={`${CARD} ios-press block`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[15px] font-semibold text-slate-800">
                      {order.customer_name}
                    </span>
                    <StatusPill {...KEYCHAIN_STATUS[order.status]} />
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    {order.contact_phone ? (
                      <PhoneIcon className="size-3.5 shrink-0" />
                    ) : order.contact_email ? (
                      <MailIcon className="size-3.5 shrink-0" />
                    ) : null}
                    <span className="truncate">{order.contact_phone || order.contact_email || "No contact"}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label="Programmed"
                      aria-valuenow={summary.programmed}
                      aria-valuemin={0}
                      aria-valuemax={summary.total}
                    >
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-slate-500" title="Programmed / total · QC passed">
                      {summary.programmed}/{summary.total} · ✓{summary.qcPassed}
                    </span>
                    <ChevronRightIcon className="size-4 shrink-0 text-slate-300" />
                  </div>
                </Link>
              </li>
            );
          })}
          {(orders ?? []).length === 0 && <EmptyState>No keychain orders found.</EmptyState>}
        </ul>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto md:block">
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
                const summary = summaryByOrder.get(order.id) ?? { total: 0, programmed: 0, qcPassed: 0 };
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
                      {summary.total} ({summary.programmed} programmed, {summary.qcPassed} QC&apos;d)
                    </td>
                    <td className="py-3 pr-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
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

        <Pager
          page={page}
          totalPages={totalPages}
          count={count}
          hrefFor={(n) => `/admin/keychains?${new URLSearchParams({ ...baseParams, page: String(n) })}`}
        />
      </section>
    </div>
  );
}
