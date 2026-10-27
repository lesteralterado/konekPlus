import Link from "next/link";
import {
  BILL_CATEGORY,
  EXPENSE_CATEGORY,
  breakEvenCards,
  currentManilaMonthKey,
  manilaMonth,
  monthlyPhp,
} from "@/lib/finance";
import { EST_UNIT_COST_PHP, LOWEST_PRICE_PHP, formatPrice } from "@/lib/finishes";
import { amountFor } from "@/lib/order-amount";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, EyeOffIcon, TrashIcon, WalletIcon } from "../icons";
import { ConfirmButton, Fab } from "../ui/drawers";
import { CARD, EmptyState, PANEL } from "../ui/kit";
import { StatusPill } from "../ui/status";
import { deleteBill, deleteExpense, setBillActive } from "./actions";
import { AddBillForm, LogExpenseForm, SettingsForm } from "./forms";

export const dynamic = "force-dynamic";

const TRASH =
  "ios-press grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 md:size-8";

const H2 = "mb-1.5 px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-500";

function Tile({ label, value, sub, tone = "text-brand-900" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-5">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        <WalletIcon className="size-3.5" />
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-bold sm:text-3xl sm:font-semibold ${tone}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function Meter({ value, max, tone }: { value: number; max: number; tone: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100" role="presentation">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function manilaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const month = manilaMonth(m);
  const isCurrent = month.key === currentManilaMonthKey();

  const supabase = await createClient();
  const [
    { data: settings },
    { data: bills },
    { data: expenses },
    { data: paidOrders },
    { data: paidRenewals },
  ] = await Promise.all([
    supabase.from("finance_settings").select("*").eq("id", true).maybeSingle(),
    supabase
      .from("finance_bills")
      .select("*")
      .order("active", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("finance_expenses")
      .select("*")
      .gte("paid_on", month.startDate)
      .lt("paid_on", month.endDate)
      .order("paid_on", { ascending: false }),
    supabase
      .from("card_orders")
      .select("finish, quantity, amount_due_php, amount_received_php")
      .eq("payment_status", "paid")
      .gte("paid_at", month.startIso)
      .lt("paid_at", month.endIso),
    supabase
      .from("plan_payments")
      .select("amount_received_php")
      .eq("status", "paid")
      .gte("paid_at", month.startIso)
      .lt("paid_at", month.endIso),
  ]);

  if (!settings) {
    return (
      <EmptyState>
        Finance tables aren’t set up yet — apply migration 0023_finance.sql.
      </EmptyState>
    );
  }

  const rate = Number(settings.usd_php_rate);
  const activeBills = (bills ?? []).filter((b) => b.active);

  // Cash in: card orders and Pro renewals marked paid this month.
  let cardSales = 0;
  let cards = 0;
  for (const o of paidOrders ?? []) {
    cardSales += o.amount_received_php ?? amountFor(o).php;
    cards += o.quantity;
  }
  const renewals = (paidRenewals ?? []).reduce((sum, r) => sum + (r.amount_received_php ?? 0), 0);
  const cashIn = cardSales + renewals;
  const cashOut = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount_php), 0);
  const net = cashIn - cashOut;

  // Fixed costs: what the bills add up to per month, whether or not
  // they've been paid yet.
  const fixed = activeBills.reduce((sum, b) => sum + monthlyPhp(b, rate), 0);
  const servers = activeBills
    .filter((b) => b.category === "ktlo")
    .reduce((sum, b) => sum + monthlyPhp(b, rate), 0);

  // What one card leaves after paying for itself: this month's real average
  // price when there are sales, else the cheapest finish (worst case).
  const avgPrice = cards > 0 ? cardSales / cards : LOWEST_PRICE_PHP;
  const margin = avgPrice - EST_UNIT_COST_PHP;
  const needAll = breakEvenCards(fixed, margin);
  const needServers = breakEvenCards(servers, margin);
  const profit = cashIn - cards * EST_UNIT_COST_PHP - fixed;

  const reserve = Number(settings.reserve_balance_php);
  const reserveTarget = servers * settings.reserve_target_months;
  const runway = servers > 0 ? reserve / servers : null;
  const setAside = cards * settings.reserve_per_card_php;

  const paidBillIds = new Set((expenses ?? []).map((e) => e.bill_id).filter(Boolean));
  const unpaidMonthly = activeBills.filter(
    (b) => b.billing_interval === "monthly" && !paidBillIds.has(b.id),
  );

  const logForm = <LogExpenseForm bills={activeBills} today={isCurrent ? manilaToday() : month.startDate} />;

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[28px] font-bold tracking-tight text-brand-900 md:text-2xl md:font-semibold">
          Finance
        </h1>
        <nav aria-label="Month" className="flex items-center gap-1">
          <Link
            href={`/admin/finance?m=${month.prevKey}`}
            aria-label="Previous month"
            className="ios-press grid size-10 place-items-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200"
          >
            <ChevronLeftIcon className="size-4" />
          </Link>
          <span className="min-w-36 text-center text-sm font-semibold text-brand-900">{month.label}</span>
          {isCurrent ? (
            <span className="size-10" />
          ) : (
            <Link
              href={`/admin/finance?m=${month.nextKey}`}
              aria-label="Next month"
              className="ios-press grid size-10 place-items-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200"
            >
              <ChevronRightIcon className="size-4" />
            </Link>
          )}
        </nav>
      </div>

      <section aria-label="This month">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Tile
            label="Cash in"
            value={formatPrice(cashIn)}
            sub={
              renewals > 0
                ? `${plural(cards, "card")} · ${formatPrice(renewals)} Pro renewals`
                : `${plural(cards, "card")} paid`
            }
            tone="text-emerald-600"
          />
          <Tile label="Cash out" value={formatPrice(cashOut)} sub={`${plural((expenses ?? []).length, "expense")} logged`} />
          <Tile
            label="Net cash"
            value={formatPrice(net)}
            sub="Cash in − cash out"
            tone={net >= 0 ? "text-emerald-600" : "text-red-600"}
          />
          <Tile
            label="Profit (est.)"
            value={formatPrice(profit)}
            sub={`After card costs and ${formatPrice(fixed)} of bills`}
            tone={profit >= 0 ? "text-emerald-600" : "text-red-600"}
          />
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        <section aria-label="Break-even" className={CARD}>
          <h2 className="text-sm font-semibold text-brand-900">Break-even</h2>
          {needAll === null ? (
            <p className="mt-2 text-sm text-red-600">
              Each card costs more to make than it sells for — raise prices or cut the cost per card.
            </p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-semibold text-brand-900">
                {cards} <span className="text-lg font-medium text-slate-400">of {needAll} cards</span>
              </p>
              <Meter value={cards} max={needAll} tone={cards >= needAll ? "bg-emerald-500" : "bg-amber-500"} />
              <p className="mt-2 text-sm text-slate-600">
                {cards >= needAll
                  ? "Every bill this month is covered."
                  : `${plural(needAll - cards, "more card")} to cover every bill this month.`}{" "}
                Servers alone need {needServers}.
              </p>
            </>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Each card leaves about {formatPrice(margin)}: {cards > 0 ? "this month’s average price" : "the cheapest finish"}{" "}
            ({formatPrice(avgPrice)}) minus an estimated {formatPrice(EST_UNIT_COST_PHP)} to make and send it.
          </p>
        </section>

        <section aria-label="Server reserve" className={CARD}>
          <h2 className="text-sm font-semibold text-brand-900">Server reserve</h2>
          <p className="mt-2 text-3xl font-semibold text-brand-900">
            {formatPrice(reserve)}{" "}
            <span className="text-lg font-medium text-slate-400">of {formatPrice(reserveTarget)}</span>
          </p>
          <Meter value={reserve} max={reserveTarget} tone={reserve >= reserveTarget ? "bg-emerald-500" : "bg-brand-600"} />
          <p className="mt-2 text-sm text-slate-600">
            {runway === null
              ? "No server bills yet."
              : `Pays the servers for ${runway.toFixed(1)} months with no sales.`}{" "}
            {setAside > 0 && `Move ${formatPrice(setAside)} in for this month’s ${plural(cards, "card")}.`}
            {renewals > 0 && ` Pro renewals (${formatPrice(renewals)}) go in too.`}
          </p>
          {servers > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Renewals cover {Math.round((renewals / servers) * 100)}% of this month’s server bills — the goal
              is 100%, so servers never depend on new card sales.
            </p>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-brand-700">Update reserve & rate</summary>
            <div className="mt-3">
              <SettingsForm settings={settings} />
            </div>
          </details>
        </section>
      </div>

      <section aria-label="Bills">
        <h2 className={H2}>
          Bills · {formatPrice(fixed)}/mo at ₱{rate}/$1
        </h2>
        <div className={PANEL}>
          {unpaidMonthly.length > 0 && isCurrent && (
            <p className="mb-3 rounded-2xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              Not logged yet this month: {unpaidMonthly.map((b) => b.vendor).join(", ")}
            </p>
          )}
          <div className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-slate-100">
            {(bills ?? []).map((b) => (
              <article
                key={b.id}
                className={`${CARD} flex items-center gap-3 md:rounded-none md:px-0 md:py-3 md:shadow-none md:ring-0 ${b.active ? "" : "opacity-60"}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-brand-900">{b.vendor}</span>
                    <StatusPill tone={b.category === "ktlo" ? "teal" : "grey"} label={BILL_CATEGORY[b.category]} />
                    {!b.active && <StatusPill tone="grey" label="Paused" />}
                    {b.active && paidBillIds.has(b.id) && <StatusPill tone="green" label="Paid" />}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {b.currency === "USD" ? `$${Number(b.amount).toFixed(2)}` : formatPrice(Number(b.amount))}
                    {b.billing_interval === "yearly" ? " a year" : " a month"}
                    {(b.currency === "USD" || b.billing_interval === "yearly") &&
                      ` ≈ ${formatPrice(monthlyPhp(b, rate))}/mo`}
                    {b.note && ` · ${b.note}`}
                  </p>
                </div>
                <form action={setBillActive.bind(null, b.id, !b.active)}>
                  <button
                    type="submit"
                    aria-label={b.active ? `Pause ${b.vendor}` : `Resume ${b.vendor}`}
                    title={b.active ? "Pause (stop counting it)" : "Resume"}
                    className="ios-press grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-brand-50 hover:text-brand-700 md:size-8"
                  >
                    {b.active ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </button>
                </form>
                <ConfirmButton
                  title="Delete bill?"
                  message={`${b.vendor} stops counting toward your monthly costs. Expenses you already logged for it stay.`}
                  confirmLabel="Delete"
                  triggerLabel={`Delete ${b.vendor}`}
                  triggerClassName={TRASH}
                  onConfirm={deleteBill.bind(null, b.id)}
                >
                  <TrashIcon className="size-4" />
                </ConfirmButton>
              </article>
            ))}
            {(bills ?? []).length === 0 && <EmptyState>No bills yet.</EmptyState>}
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-brand-700">Add a bill</summary>
            <div className="mt-3">
              <AddBillForm />
            </div>
          </details>
        </div>
      </section>

      <section aria-label="Log an expense" className="hidden rounded-3xl bg-white p-6 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] md:block">
        <h2 className="text-sm font-semibold text-brand-900">Log an expense</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Enter the pesos that actually left the account — for a dollar bill, what your card was charged.
        </p>
        {logForm}
      </section>
      <Fab label="Log an expense">{logForm}</Fab>

      <section aria-label="Expenses">
        <h2 className={H2}>Expenses · {month.label}</h2>
        <div className={PANEL}>
          <div className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-slate-100">
            {(expenses ?? []).map((e) => (
              <article
                key={e.id}
                className={`${CARD} flex items-center gap-3 md:rounded-none md:px-0 md:py-3 md:shadow-none md:ring-0`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-brand-900">{e.description}</span>
                    <StatusPill tone="grey" label={EXPENSE_CATEGORY[e.category]} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {new Date(`${e.paid_on}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <span className="font-semibold text-brand-900">{formatPrice(Number(e.amount_php))}</span>
                <ConfirmButton
                  title="Delete expense?"
                  message={`${e.description} — ${formatPrice(Number(e.amount_php))}. This can’t be undone.`}
                  confirmLabel="Delete"
                  triggerLabel={`Delete ${e.description}`}
                  triggerClassName={TRASH}
                  onConfirm={deleteExpense.bind(null, e.id)}
                >
                  <TrashIcon className="size-4" />
                </ConfirmButton>
              </article>
            ))}
            {(expenses ?? []).length === 0 && <EmptyState>Nothing logged for {month.label}.</EmptyState>}
          </div>
        </div>
      </section>
    </div>
  );
}
