import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DAYS = 30;
const BAR_COLOR = "var(--color-brand-600)";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-semibold text-brand-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
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
          const label = b.date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
              <title>
                {label}: {b.count} claimed
              </title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-slate-400">
        <span>{buckets[0].date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <span>{buckets[buckets.length - 1].date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: totalTags }, { count: claimedTags }, { count: totalCustomers }, { data: recentClaims }] =
    await Promise.all([
      supabase.from("tags").select("*", { count: "exact", head: true }),
      supabase.from("tags").select("*", { count: "exact", head: true }).eq("claimed", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("tags")
        .select("claimed_at")
        .eq("claimed", true)
        .gte("claimed_at", daysAgoIso(DAYS)),
    ]);

  const total = totalTags ?? 0;
  const claimed = claimedTags ?? 0;
  const unclaimed = total - claimed;
  const customers = totalCustomers ?? 0;
  const claimRate = total > 0 ? Math.round((claimed / total) * 100) : 0;
  const avgCardsPerCustomer = customers > 0 ? (claimed / customers).toFixed(1) : "0";

  const buckets = dayBuckets((recentClaims ?? []).map((r) => r.claimed_at!).filter(Boolean));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total cards" value={total.toLocaleString()} />
        <StatTile label="Claimed" value={claimed.toLocaleString()} sub={`${claimRate}% of total`} />
        <StatTile label="Unclaimed" value={unclaimed.toLocaleString()} />
        <StatTile label="Customers" value={customers.toLocaleString()} sub={`${avgCardsPerCustomer} cards/customer avg`} />
      </div>

      <DailyClaimsChart buckets={buckets} />
    </div>
  );
}
