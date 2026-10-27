import { gcashAccount } from "@/lib/gcash";
import { RENEW_NUDGE_DAYS, daysLeft, formatPlanDate, isPro } from "@/lib/plan";
import { RenewPanel } from "./renew-panel";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

const DAYS = 30;

// The last DAYS Manila calendar days, oldest first, as YYYY-MM-DD.
function lastDays(): string[] {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" });
  const out: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    out.push(fmt.format(new Date(Date.now() - i * 24 * 60 * 60 * 1000)));
  }
  return out;
}

function TapsChart({ days, counts }: { days: string[]; counts: Map<string, number> }) {
  const max = Math.max(1, ...days.map((d) => counts.get(d) ?? 0));
  const label = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  return (
    <div className="mt-4">
      <div className="flex h-20 items-end gap-0.75" role="img" aria-label={`Taps per day, last ${DAYS} days`}>
        {days.map((d) => {
          const n = counts.get(d) ?? 0;
          return (
            <div
              key={d}
              title={`${label(d)}: ${n} tap${n === 1 ? "" : "s"}`}
              className={`flex-1 rounded-sm ${n ? "bg-brand-600" : "bg-brand-600/15"}`}
              style={{ height: n ? `${Math.max(8, (n / max) * 100)}%` : "4px" }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-400">
        <span>{label(days[0])}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

// Plan status plus how often the owner's cards were tapped. Basic sees the
// 30-day total; Pro also gets the day-by-day chart.
export async function PlanCard({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const [{ data: rows }, { data: lastPayment }] = await Promise.all([
    supabase.rpc("my_card_views", { p_days: DAYS }),
    supabase
      .from("plan_payments")
      .select("status, admin_note")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const left = daysLeft(profile.pro_until);
  const counts = new Map((rows ?? []).map((r) => [r.day, r.views]));
  const total = (rows ?? []).reduce((sum, r) => sum + r.views, 0);
  const pro = isPro(profile);

  return (
    <section className="mt-4 rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
            pro ? "bg-accent-500 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {pro ? "Pro" : "Basic"}
        </span>
        {profile.founding && (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            Founding member
          </span>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {pro && profile.pro_until
            ? `Pro until ${formatPlanDate(profile.pro_until)}`
            : profile.pro_until
              ? `Pro ended ${formatPlanDate(profile.pro_until)}`
              : "Free forever"}
        </span>
      </div>

      <p className="mt-3 text-3xl font-semibold text-brand-900">
        {total.toLocaleString()}{" "}
        <span className="text-base font-medium text-slate-400">
          tap{total === 1 ? "" : "s"} in the last {DAYS} days
        </span>
      </p>

      {pro ? (
        <TapsChart days={lastDays()} counts={counts} />
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          Your card keeps working on Basic. Pro adds every card style, unlimited portfolio
          projects and a day-by-day chart of your taps.
        </p>
      )}

      <RenewPanel
        gcash={gcashAccount()}
        pending={lastPayment?.status === "proof_submitted"}
        rejectedNote={lastPayment?.status === "rejected" ? lastPayment.admin_note : null}
        open={!pro || (left !== null && left <= RENEW_NUDGE_DAYS)}
      />
    </section>
  );
}
