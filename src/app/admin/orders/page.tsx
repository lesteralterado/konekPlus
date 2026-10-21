import Link from "next/link";
import { finishById, formatPrice, quote } from "@/lib/finishes";
import { createClient } from "@/lib/supabase/server";
import type { CardOrderStatus } from "@/lib/types";
import { BagIcon, MailIcon, PhoneIcon, SmsIcon } from "../icons";
import { CopyButton } from "../ui/drawers";
import { CARD, EmptyState, FilterChips, IconLink, PANEL, Pager } from "../ui/kit";
import { AssignCards } from "./assign-cards";
import { NextStep } from "./next-step";
import { ShipOrder } from "./ship-order";
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
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
];

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
    <div className="flex flex-col gap-5 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[28px] font-bold tracking-tight text-brand-900 md:text-2xl md:font-semibold">
          Orders
        </h1>
        {(newCount ?? 0) > 0 && (
          <Link
            href="/admin/orders?status=new"
            className="ios-press inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700"
          >
            <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
            {newCount} new
          </Link>
        )}
      </div>

      <section className={PANEL}>
        <FilterChips
          items={STATUS_FILTERS}
          active={status ?? ""}
          hrefFor={(v) => `/admin/orders?${new URLSearchParams(v ? { status: v } : {})}`}
        />

        <div className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-slate-100">
          {(orders ?? []).map((order) => {
            // Recomputed from the live price config — the table deliberately
            // stores no prices (see 0015_card_orders.sql).
            const q = quote(order.finish, order.quantity);
            const reference = `KP-${order.id.slice(0, 6).toUpperCase()}`;
            return (
              <article
                key={order.id}
                className={`${CARD} md:flex md:items-start md:justify-between md:gap-6 md:rounded-none md:px-0 md:py-4 md:shadow-none md:ring-0`}
              >
                <div className="min-w-0 flex-1">
                  {/* Ref + status (on phones the pill itself changes status) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-400">{reference}</span>
                    <span className="md:hidden">
                      <OrderStatusSelect id={order.id} status={order.status} />
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="flex items-center gap-1.5 font-semibold text-brand-900">
                      <BagIcon className="size-4 text-slate-400" />
                      {order.quantity} × {finishById(order.finish).name}
                    </span>
                    <span className="text-lg font-bold text-brand-900 md:text-base md:font-semibold">
                      {formatPrice(q.totalPhp)}
                    </span>
                    {q.discountPct > 0 && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        −{q.discountPct}%
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {order.payment_method === "cod" ? "COD" : "GCash"}
                    </span>
                  </div>

                  <p className="mt-2 text-[15px] font-medium text-slate-800 md:text-sm md:font-normal md:text-slate-700">
                    {order.full_name}
                    <span className="hidden md:inline">
                      {" · "}
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
                    </span>
                  </p>
                  <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-sm text-slate-500 md:line-clamp-none">
                    {order.address}
                  </p>
                  {order.notes && (
                    <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm italic text-slate-500 md:line-clamp-none">
                      “{order.notes}”
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {order.tracking_number && (
                      <>
                        {" · "}
                        {order.courier}: <span className="font-mono">{order.tracking_number}</span>
                      </>
                    )}
                  </p>

                  {/* Phones: one-tap contact icons */}
                  <div className="mt-3 flex items-center gap-2 md:hidden">
                    <IconLink href={`tel:${order.phone}`} label={`Call ${order.full_name}`}>
                      <PhoneIcon className="size-4.5" />
                    </IconLink>
                    <IconLink href={`sms:${order.phone}`} label={`Text ${order.full_name}`}>
                      <SmsIcon className="size-4.5" />
                    </IconLink>
                    {order.email && (
                      <IconLink href={`mailto:${order.email}`} label={`Email ${order.full_name}`}>
                        <MailIcon className="size-4.5" />
                      </IconLink>
                    )}
                    <CopyButton
                      text={`${order.full_name}\n${order.phone}\n${order.address}`}
                      label="Copy name, phone & address"
                    />
                  </div>

                  <div className="mt-3 md:mt-2">
                    <NextStep orderId={order.id} status={order.status} hasEmail={!!order.email} />
                  </div>

                  {/* Desktop keeps the inline courier form; phones ship via Next step */}
                  {!["shipped", "delivered", "fulfilled", "cancelled"].includes(order.status) && (
                    <div className="hidden md:block">
                      <ShipOrder orderId={order.id} hasEmail={!!order.email} />
                    </div>
                  )}
                  {order.status !== "cancelled" && (
                    <AssignCards
                      orderId={order.id}
                      reference={reference}
                      quantity={order.quantity}
                      assignedCodes={codesByOrder.get(order.id) ?? []}
                    />
                  )}
                </div>
                <div className="hidden md:block">
                  <OrderStatusSelect id={order.id} status={order.status} />
                </div>
              </article>
            );
          })}
          {(orders ?? []).length === 0 && <EmptyState>No orders yet.</EmptyState>}
        </div>

        <Pager
          page={page}
          totalPages={totalPages}
          count={count}
          hrefFor={(p) => `/admin/orders?${new URLSearchParams({ ...baseParams, page: String(p) })}`}
        />
      </section>
    </div>
  );
}
