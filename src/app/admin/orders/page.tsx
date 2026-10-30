import Link from "next/link";
import { siteOrigin } from "@/lib/card-link";
import { finishById, formatPrice } from "@/lib/finishes";
import { amountFor } from "@/lib/order-amount";
import { createClient } from "@/lib/supabase/server";
import type { CardOrderStatus, PaymentStatus } from "@/lib/types";
import { BagIcon, MailIcon, PhoneIcon, SmsIcon } from "../icons";
import { CopyButton } from "../ui/drawers";
import { CARD, EmptyState, FilterChips, IconLink, PANEL, Pager } from "../ui/kit";
import { loadOrderPhotos } from "../photos/data";
import { PhotoPanel } from "../photos/photo-panel";
import { AssignCards } from "./assign-cards";
import { NextStep } from "./next-step";
import { PaymentStep } from "./payment-step";
import { PAYMENT_STATUS, StatusPill, paymentTone } from "../ui/status";
import { ShipOrder } from "./ship-order";
import { OrderStatusSelect } from "./status-select";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const PAY_FILTERS: { value: PaymentStatus | ""; label: string }[] = [
  { value: "", label: "Any payment" },
  { value: "unpaid", label: "Unpaid" },
  { value: "proof_submitted", label: "To verify" },
  { value: "with_courier", label: "With courier" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
];

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
  searchParams: Promise<{ status?: string; pay?: string; page?: string }>;
}) {
  const { status: statusParam, pay: payParam, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const status = STATUS_FILTERS.find((f) => f.value === statusParam)?.value || undefined;
  const pay = PAY_FILTERS.find((f) => f.value === payParam)?.value || undefined;

  const supabase = await createClient();

  let query = supabase
    .from("card_orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  if (pay) query = query.eq("payment_status", pay);

  const [{ data: orders, count }, { count: newCount }] = await Promise.all([
    query,
    supabase.from("card_orders").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: assignedTags } = orderIds.length
    ? await supabase
        .from("tags")
        .select("tag_id, order_id, written_at, claimed")
        .in("order_id", orderIds)
        .order("tag_id")
    : { data: [] };
  const cardsByOrder = new Map<
    string,
    { tagId: string; writtenAt: string | null; claimed: boolean }[]
  >();
  for (const t of assignedTags ?? []) {
    if (!t.order_id) continue;
    cardsByOrder.set(t.order_id, [
      ...(cardsByOrder.get(t.order_id) ?? []),
      { tagId: t.tag_id, writtenAt: t.written_at, claimed: t.claimed },
    ]);
  }
  const { byOrder: photosByOrder, urls: photoUrls } = await loadOrderPhotos(
    supabase,
    "card_order_id",
    orderIds,
  );
  const origin = siteOrigin();

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const baseParams: Record<string, string> = {
    ...(status ? { status } : {}),
    ...(pay ? { pay } : {}),
  };
  // Changing one filter keeps the other (and resets to page 1).
  const filterHref = (next: { status?: string; pay?: string }) => {
    const merged: Record<string, string | undefined> = { status, pay, ...next };
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(merged)) if (v) params[k] = v;
    return `/admin/orders?${new URLSearchParams(params)}`;
  };

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
          hrefFor={(v) => filterHref({ status: v || undefined })}
        />
        <FilterChips
          items={PAY_FILTERS}
          active={pay ?? ""}
          hrefFor={(v) => filterHref({ pay: v || undefined })}
        />

        <div className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-slate-100">
          {(orders ?? []).map((order) => {
            // Recomputed from the live price config — the table deliberately
            // stores no prices (see 0015_card_orders.sql).
            const amount = amountFor(order);
            const reference = `KP-${order.id.slice(0, 6).toUpperCase()}`;
            const cards = cardsByOrder.get(order.id) ?? [];
            const unwritten = cards.filter((c) => !c.writtenAt).length;
            const payTone = paymentTone(order.payment_status, order.status);
            return (
              <article
                key={order.id}
                className={`${CARD} md:flex md:items-start md:justify-between md:gap-6 md:rounded-none md:px-0 md:py-4 md:shadow-none md:ring-0`}
              >
                <div className="min-w-0 flex-1">
                  {/* Ref + status (on phones the pill itself changes status) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-400">{reference}</span>
                    <span className="flex items-center gap-1.5">
                      <StatusPill
                        tone={payTone}
                        label={
                          order.payment_status === "paid"
                            ? `Paid ${formatPrice(order.amount_received_php ?? amount.php)}`
                            : PAYMENT_STATUS[order.payment_status].label
                        }
                      />
                      <span className="md:hidden">
                        <OrderStatusSelect id={order.id} status={order.status} />
                      </span>
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="flex items-center gap-1.5 font-semibold text-brand-900">
                      <BagIcon className="size-4 text-slate-400" />
                      {order.quantity} × {finishById(order.finish).name}
                    </span>
                    <span className="text-lg font-bold text-brand-900 md:text-base md:font-semibold">
                      {formatPrice(amount.php)}
                      {amount.estimate && (
                        <span className="ml-1 text-xs font-medium text-slate-400" title="Estimate — locked when you confirm the order">
                          est.
                        </span>
                      )}
                    </span>
                    {(order.discount_pct ?? 0) > 0 && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        −{order.discount_pct}%
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {order.payment_method === "cod" ? "COD" : order.payment_method === "cash" ? "Cash" : "GCash"}
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

                  <div className="mt-3 flex flex-col gap-2 md:mt-2 md:flex-row md:flex-wrap">
                    <NextStep
                      orderId={order.id}
                      status={order.status}
                      hasEmail={!!order.email}
                      unwrittenCards={unwritten}
                      paymentMethod={order.payment_method}
                      customerName={order.full_name}
                    />
                    <PaymentStep
                      orderId={order.id}
                      reference={reference}
                      method={order.payment_method}
                      status={order.payment_status}
                      orderStatus={order.status}
                      amountDue={amount.php}
                      estimate={amount.estimate}
                      amountReceived={order.amount_received_php}
                      paidAt={order.paid_at}
                      paidVia={order.paid_via}
                      gcashRef={order.gcash_reference}
                      proofPath={order.payment_proof_path}
                      proofAt={order.proof_submitted_at}
                      note={order.payment_note}
                    />
                  </div>

                  {/* Desktop keeps the inline courier form; phones ship via Next step */}
                  {order.payment_method !== "cash" &&
                    !["shipped", "delivered", "fulfilled", "cancelled"].includes(order.status) && (
                    <div className="hidden md:block">
                      <ShipOrder orderId={order.id} hasEmail={!!order.email} />
                    </div>
                  )}
                  <PhotoPanel
                    photos={photosByOrder.get(order.id) ?? []}
                    urls={photoUrls}
                    target={{ kind: "card", orderId: order.id, customerName: order.full_name }}
                    // Only orders met in person (cash meet-up) offer a new photo.
                    canAdd={
                      order.payment_method === "cash" &&
                      ["delivered", "fulfilled"].includes(order.status)
                    }
                  />
                  {order.status !== "cancelled" && (
                    <AssignCards
                      orderId={order.id}
                      reference={reference}
                      quantity={order.quantity}
                      assigned={cards}
                      origin={origin}
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
