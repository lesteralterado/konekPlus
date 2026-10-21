import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/app/dashboard/icons";
import { cleanProfileUrl } from "@/lib/keychain-link";
import { createClient } from "@/lib/supabase/server";
import type { KeychainPlatform } from "@/lib/types";
import { ArrowLeftIcon, MailIcon, PhoneIcon } from "../../icons";
import { IconLink } from "../../ui/kit";
import { NfcGuide } from "../nfc-guide";
import {
  HandoverButton,
  MarkCompletedButton,
  MarkReadyForHandoverButton,
  MarkReadyForProgrammingButton,
  VerifyLinksButton,
} from "../order-actions";
import { ProgramItem } from "../program-item";
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

// Statuses where chips are being written (the old Staff-app stages included,
// in case an order was moved into one of them).
const WRITING = new Set(["ready_for_programming", "programming", "nfc_programmed", "nfc_tested", "qc_passed"]);

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
  const doneCount = allItems.filter((i) => i.nfc_status === "tested" && i.qc_passed).length;
  const allReadyForHandover = allItems.length > 0 && doneCount === allItems.length;
  const writing = WRITING.has(order.status);

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <Link
        href="/admin/keychains"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Keychains
      </Link>

      <section className="rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold text-brand-900 md:text-xl md:font-semibold">
              {order.customer_name}
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Submitted{" "}
              {new Date(order.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {(order.contact_phone || order.contact_email) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {order.contact_phone && (
              <IconLink href={`tel:${order.contact_phone}`} label={`Call ${order.contact_phone}`}>
                <PhoneIcon className="size-4.5" />
              </IconLink>
            )}
            {order.contact_email && (
              <IconLink href={`mailto:${order.contact_email}`} label={`Email ${order.contact_email}`}>
                <MailIcon className="size-4.5" />
              </IconLink>
            )}
            <span className="min-w-0 truncate text-sm text-slate-500">
              {order.contact_phone || order.contact_email}
            </span>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-5 md:flex-row md:flex-wrap md:items-center">
          {order.status === "social_links_submitted" && <VerifyLinksButton orderId={order.id} />}
          {order.status === "links_verified" && <MarkReadyForProgrammingButton orderId={order.id} />}
          {writing && !allReadyForHandover && (
            <p className="text-sm text-slate-500">
              <b className="text-brand-900">
                {doneCount} of {allItems.length}
              </b>{" "}
              written — write each keychain below with NFC Tools.
            </p>
          )}
          {writing && allReadyForHandover && <MarkReadyForHandoverButton orderId={order.id} />}
          {order.status === "ready_for_handover" && (
            <HandoverButton orderId={order.id} customerName={order.customer_name} />
          )}
          {order.status === "handed_over" && <MarkCompletedButton orderId={order.id} />}
        </div>
      </section>

      {writing && <NfcGuide open={!allReadyForHandover} />}

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-500">
          Keychains · {doneCount}/{allItems.length} working
        </h2>
        <ul className="flex flex-col gap-3">
          {allItems.map((item) => {
            const Icon = PLATFORM_ICON[item.platform];
            return (
              <ProgramItem
                key={item.id}
                itemId={item.id}
                orderId={order.id}
                icon={<Icon className="size-4.5" />}
                title={`${PLATFORM_LABEL[item.platform]}${item.account_label ? ` — ${item.account_label}` : ""}`}
                link={cleanProfileUrl(item.profile_url)}
                status={item.nfc_status}
                badge={<NfcStatusBadge status={item.nfc_status} />}
              />
            );
          })}
          {allItems.length === 0 && (
            <li className="py-8 text-center text-sm text-slate-400">No keychains on this order.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
