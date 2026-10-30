import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CameraIcon } from "@/app/dashboard/icons";
import { ActivationFunnel } from "./activation-funnel";
import { manilaMonth } from "@/lib/finance";
import { formatPrice } from "@/lib/finishes";
import { amountFor } from "@/lib/order-amount";
import {
  BagIcon,
  ChevronRightIcon,
  CreditCardIcon,
  KeyIcon,
  MessageIcon,
  StarIcon,
  UsersIcon,
  WalletIcon,
} from "./icons";

export const dynamic = "force-dynamic";

const DAYS = 30;
const BAR_COLOR = "var(--color-brand-600)";
// Buckets are UTC days; a fixed locale and zone keep server and browser
// labels identical.
const DAY_LABEL: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof BagIcon;
}) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-5">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-semibold text-brand-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

const VIA_LABEL: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  bank: "Bank",
  courier: "Courier",
};

function MoneyTile({
  href,
  label,
  value,
  sub,
  tone = "text-brand-900",
}: {
  href: string;
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <Link
      href={href}
      className="ios-press rounded-3xl bg-white p-4 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-5"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        <WalletIcon className="size-3.5" />
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-bold sm:text-3xl sm:font-semibold ${tone}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Link>
  );
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function dayBuckets(timestamps: string[]): { date: Date; count: number }[] {
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    const key = ts.slice(0, 10); // YYYY-MM-DD (UTC)
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const buckets: { date: Date; count: number }[] = [];
  const today = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    buckets.push({ date: d, count: counts.get(key) ?? 0 });
  }
  return buckets;
}

function DailyClaimsChart({ buckets }: { buckets: { date: Date; count: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const width = 720;
  const height = 160;
  const gap = 3;
  const barWidth = Math.min(24, width / buckets.length - gap);
  const chartHeight = height - 24; // leave room for baseline labels

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6">
      <p className="text-sm font-semibold text-brand-900">
        Cards claimed — last {DAYS} days
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 h-40 w-full"
        role="img"
        aria-label={`Cards claimed per day over the last ${DAYS} days`}
      >
        <line x1={0} y1={chartHeight} x2={width} y2={chartHeight} stroke="#e2e8f0" strokeWidth={1} />
        {buckets.map((b, i) => {
          const barHeight = b.count === 0 ? 0 : Math.max(3, (b.count / max) * (chartHeight - 8));
          const x = i * (barWidth + gap);
          const y = chartHeight - barHeight;
          const label = b.date.toLocaleDateString("en-PH", DAY_LABEL);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={BAR_COLOR}
              opacity={b.count === 0 ? 0.15 : 1}
            >
              {/* One string child: React 19 treats <title> specially and
                  mismatches on hydration when it gets several text nodes. */}
              <title>{`${label}: ${b.count} claimed`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-slate-400">
        <span>{buckets[0].date.toLocaleDateString("en-PH", DAY_LABEL)}</span>
        <span>{buckets[buckets.length - 1].date.toLocaleDateString("en-PH", DAY_LABEL)}</span>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalTags },
    { count: claimedTags },
    { count: totalCustomers },
    { data: recentClaims },
    { count: newOrders },
    { count: toVerify },
    { count: toHandOver },
    { count: newFeedback },
    { count: renewalsToVerify },
    { count: freebiesToGive },
    { count: photosToReview },
  ] = await Promise.all([
      supabase.from("tags").select("*", { count: "exact", head: true }),
      supabase.from("tags").select("*", { count: "exact", head: true }).eq("claimed", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("tags")
        .select("claimed_at")
        .eq("claimed", true)
        .gte("claimed_at", daysAgoIso(DAYS)),
      supabase.from("card_orders").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase
        .from("keychain_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "social_links_submitted"),
      supabase
        .from("keychain_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "ready_for_handover"),
      supabase.from("feedback").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase
        .from("plan_payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "proof_submitted"),
      supabase
        .from("customer_photos")
        .select("id", { count: "exact", head: true })
        .eq("freebie_status", "pending"),
      supabase
        .from("customer_photos")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review"),
    ]);

  // Money: everything that isn't cancelled or refunded. Small table, so one
  // read and sum here rather than several aggregate queries.
  const { data: moneyRows } = await supabase
    .from("card_orders")
    .select("status, payment_method, payment_status, paid_via, amount_due_php, amount_received_php, paid_at, finish, quantity")
    .neq("status", "cancelled")
    .neq("payment_status", "refunded");
  const monthStart = manilaMonth().startIso;
  const money = {
    paidMonth: 0,
    byVia: {} as Record<string, number>,
    verify: { n: 0, php: 0 },
    awaiting: { n: 0, php: 0, gcash: 0, cash: 0 },
    courier: { n: 0, php: 0 },
  };
  for (const o of moneyRows ?? []) {
    const due = amountFor(o).php;
    if (o.payment_status === "paid" && o.paid_at && o.paid_at >= monthStart) {
      const got = o.amount_received_php ?? due;
      money.paidMonth += got;
      const via = o.paid_via ?? "other";
      money.byVia[via] = (money.byVia[via] ?? 0) + got;
    } else if (o.payment_status === "proof_submitted") {
      money.verify.n += 1;
      money.verify.php += due;
    } else if (o.payment_status === "with_courier") {
      money.courier.n += 1;
      money.courier.php += due;
    } else if (
      o.payment_status === "unpaid" &&
      (o.payment_method === "gcash" || o.payment_method === "cash") &&
      !["new", "contacted"].includes(o.status)
    ) {
      money.awaiting.n += 1;
      money.awaiting.php += due;
      money.awaiting[o.payment_method] += 1;
    }
  }

  // "Needs you": only what's waiting on a person, each a deep link to the
  // filtered list. Hidden entirely when everything's handled.
  const todo = [
    { count: money.verify.n, label: "GCash proofs to verify", href: "/admin/orders?pay=proof_submitted", icon: WalletIcon, tile: "bg-emerald-500" },
    { count: renewalsToVerify ?? 0, label: "Pro renewals to verify", href: "/admin/renewals", icon: StarIcon, tile: "bg-accent-500" },
    { count: photosToReview ?? 0, label: "customer photos to review", href: "/admin/photos?show=review", icon: CameraIcon, tile: "bg-pink-500" },
    { count: freebiesToGive ?? 0, label: "photo freebies to give", href: "/admin/photos?show=freebie", icon: CameraIcon, tile: "bg-pink-500" },
    { count: newOrders ?? 0, label: "new orders", href: "/admin/orders?status=new", icon: BagIcon, tile: "bg-accent-500" },
    { count: toVerify ?? 0, label: "keychains to verify", href: "/admin/keychains?status=social_links_submitted", icon: KeyIcon, tile: "bg-violet-500" },
    { count: toHandOver ?? 0, label: "keychains to hand over", href: "/admin/keychains?status=ready_for_handover", icon: KeyIcon, tile: "bg-brand-600" },
    { count: newFeedback ?? 0, label: "new feedback", href: "/admin/feedback", icon: MessageIcon, tile: "bg-amber-500" },
  ].filter((t) => t.count > 0);

  const total = totalTags ?? 0;
  const claimed = claimedTags ?? 0;
  const unclaimed = total - claimed;
  const customers = totalCustomers ?? 0;
  const claimRate = total > 0 ? Math.round((claimed / total) * 100) : 0;
  const avgCardsPerCustomer = customers > 0 ? (claimed / customers).toFixed(1) : "0";

  const buckets = dayBuckets((recentClaims ?? []).map((r) => r.claimed_at!).filter(Boolean));

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <h1 className="text-[28px] font-bold tracking-tight text-brand-900 md:text-2xl md:font-semibold">
        Dashboard
      </h1>

      {todo.length > 0 && (
        <section aria-label="Needs you">
          <h2 className="mb-1.5 px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-500">
            Needs you
          </h2>
          <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] md:max-w-md">
            {todo.map(({ count, label, href, icon: Icon, tile }) => (
              <Link key={href} href={href} className="ios-row group/row flex items-center pl-4">
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-white ${tile}`}>
                  <Icon className="size-4.5" />
                </span>
                <span className="ml-3 flex min-h-13 flex-1 items-center gap-2 border-b border-slate-200/70 pr-4 group-last/row:border-b-0">
                  <span className="text-xl font-bold text-brand-900">{count}</span>
                  <span className="flex-1 text-[15px] text-slate-600">{label}</span>
                  <ChevronRightIcon className="size-4 text-slate-300" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-label="Money">
        <h2 className="mb-1.5 px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-500">
          Money
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <MoneyTile
            href="/admin/orders?pay=paid"
            label="Paid this month"
            value={formatPrice(money.paidMonth)}
            sub={
              Object.entries(money.byVia)
                .filter(([, php]) => php > 0)
                .map(([via, php]) => `${VIA_LABEL[via] ?? "Other"} ${formatPrice(php)}`)
                .join(" · ") || undefined
            }
            tone="text-emerald-600"
          />
          <MoneyTile
            href="/admin/orders?pay=proof_submitted"
            label="To verify"
            value={formatPrice(money.verify.php)}
            sub={`${money.verify.n} GCash proof${money.verify.n === 1 ? "" : "s"}`}
            tone={money.verify.n ? "text-amber-600" : "text-brand-900"}
          />
          <MoneyTile
            href="/admin/orders?pay=unpaid"
            label="Awaiting payment"
            value={formatPrice(money.awaiting.php)}
            sub={
              [
                money.awaiting.gcash && `${money.awaiting.gcash} GCash`,
                money.awaiting.cash && `${money.awaiting.cash} cash`,
              ]
                .filter(Boolean)
                .join(" · ") || "None waiting"
            }
          />
          <MoneyTile
            href="/admin/orders?pay=with_courier"
            label="COD with courier"
            value={formatPrice(money.courier.php)}
            sub={`${money.courier.n} to remit`}
            tone="text-sky-600"
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatTile icon={CreditCardIcon} label="Total cards" value={total.toLocaleString()} />
        <StatTile icon={CreditCardIcon} label="Claimed" value={claimed.toLocaleString()} sub={`${claimRate}% of total`} />
        <StatTile icon={CreditCardIcon} label="Unclaimed" value={unclaimed.toLocaleString()} />
        <StatTile icon={UsersIcon} label="Customers" value={customers.toLocaleString()} sub={`${avgCardsPerCustomer} cards each`} />
      </div>

      <ActivationFunnel />

      <DailyClaimsChart buckets={buckets} />
    </div>
  );
}
