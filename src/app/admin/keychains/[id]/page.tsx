import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/app/dashboard/icons";
import { createClient } from "@/lib/supabase/server";
import type { KeychainPlatform } from "@/lib/types";
import { ArrowLeftIcon } from "../../icons";
import {
  HandoverButton,
  MarkCompletedButton,
  MarkReadyForHandoverButton,
  MarkReadyForProgrammingButton,
  VerifyLinksButton,
} from "../order-actions";
import { QcToggle } from "../qc-toggle";
import { NfcStatusBadge, OrderStatusBadge } from "../status-badge";

export const dynamic = "force-dynamic";

const PLATFORM_ICON: Record<KeychainPlatform, (props: { className?: string }) => React.ReactNode> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
};

const PLATFORM_LABEL: Record<KeychainPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

export default async function AdminKeychainOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("keychain_orders").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("keychain_items")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!order) notFound();

  const allItems = items ?? [];
  const allReadyForHandover =
    allItems.length > 0 && allItems.every((i) => i.nfc_status === "tested" && i.qc_passed);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/keychains"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to keychains
      </Link>

      <section className="rounded-3xl bg-white p-6 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-brand-900">
              {order.customer_name}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {[order.contact_phone, order.contact_email].filter(Boolean).join(" · ") || "No contact info"}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Submitted {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
          {order.status === "social_links_submitted" && (
            <VerifyLinksButton orderId={order.id} />
          )}
          {order.status === "links_verified" && (
            <MarkReadyForProgrammingButton orderId={order.id} />
          )}
          {order.status === "ready_for_programming" && (
            <p className="text-sm text-slate-400">
              Waiting on NFC programming — handled in the Konek+ Staff mobile
              app.
            </p>
          )}
          {order.status === "ready_for_programming" && allReadyForHandover && (
            <MarkReadyForHandoverButton orderId={order.id} />
          )}
          {order.status === "ready_for_handover" && (
            <HandoverButton orderId={order.id} customerName={order.customer_name} />
          )}
          {order.status === "handed_over" && (
            <MarkCompletedButton orderId={order.id} />
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]">
        <h2 className="mb-4 text-sm font-semibold text-brand-900">
          Keychains ({allItems.length})
        </h2>
        <ul className="flex flex-col divide-y divide-slate-100">
          {allItems.map((item) => {
            const Icon = PLATFORM_ICON[item.platform];
            return (
              <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {PLATFORM_LABEL[item.platform]}
                      {item.account_label ? ` — ${item.account_label}` : ""}
                    </p>
                    <a
                      href={item.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block max-w-[280px] truncate text-xs text-brand-700 hover:underline"
                    >
                      {item.profile_url}
                    </a>
                    {item.tag_uid && (
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                        Tag UID: {item.tag_uid}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <NfcStatusBadge status={item.nfc_status} />
                  <QcToggle itemId={item.id} orderId={order.id} passed={item.qc_passed} />
                </div>
              </li>
            );
          })}
          {allItems.length === 0 && (
            <li className="py-8 text-center text-sm text-slate-400">
              No keychains on this order.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
