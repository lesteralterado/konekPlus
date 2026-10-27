import { formatPrice } from "@/lib/finishes";
import { PRO_TERMS, formatPlanDate } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { CARD, EmptyState, PANEL } from "../ui/kit";
import { StatusPill } from "../ui/status";
import { ReviewRenewal } from "./review";

export const dynamic = "force-dynamic";

const H2 = "mb-1.5 px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-500";

const STATUS = {
  proof_submitted: { label: "To verify", tone: "amber" },
  paid: { label: "Paid", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
} as const;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });

export default async function AdminRenewalsPage() {
  const supabase = await createClient();
  const [{ data: pending }, { data: recent }] = await Promise.all([
    supabase
      .from("plan_payments")
      .select("*")
      .eq("status", "proof_submitted")
      .order("created_at", { ascending: true }),
    supabase
      .from("plan_payments")
      .select("*")
      .neq("status", "proof_submitted")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const rows = [...(pending ?? []), ...(recent ?? [])];
  const profileIds = [...new Set(rows.map((r) => r.profile_id))];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name, pro_until").in("id", profileIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Short-lived links to the private screenshots of renewals still to check.
  const proofUrls = new Map<string, string>();
  await Promise.all(
    (pending ?? [])
      .filter((r) => r.proof_path)
      .map(async (r) => {
        const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(r.proof_path!, 600);
        if (data?.signedUrl) proofUrls.set(r.id, data.signedUrl);
      }),
  );

  const renderRow = (r: (typeof rows)[number]) => {
    const profile = profileById.get(r.profile_id);
    const status = STATUS[r.status];
    const priceNow = PRO_TERMS[r.term].pricePhp;
    return (
      <article key={r.id} className={`${CARD} md:rounded-none md:px-0 md:py-4 md:shadow-none md:ring-0`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-brand-900">{profile?.full_name || "Unnamed profile"}</span>
          <StatusPill tone={status.tone} label={status.label} />
          <span className="ml-auto text-xs text-slate-400">{when(r.created_at)}</span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {PRO_TERMS[r.term].label} · due {formatPrice(r.amount_due_php)}
          {r.amount_due_php !== priceNow && (
            <span className="text-amber-700"> (price now {formatPrice(priceNow)})</span>
          )}
          {r.amount_received_php !== null && ` · received ${formatPrice(r.amount_received_php)}`}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">
          GCash ref <span className="font-mono text-slate-700">{r.gcash_reference}</span>
          {profile?.pro_until && ` · Pro until ${formatPlanDate(profile.pro_until)}`}
        </p>
        {r.admin_note && <p className="mt-1 text-sm text-red-600">{r.admin_note}</p>}
        {proofUrls.has(r.id) && (
          <a
            href={proofUrls.get(r.id)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            View screenshot ↗
          </a>
        )}
        {r.status === "proof_submitted" && <ReviewRenewal id={r.id} amountDue={r.amount_due_php} />}
      </article>
    );
  };

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <h1 className="text-[28px] font-bold tracking-tight text-brand-900 md:text-2xl md:font-semibold">
        Pro renewals
      </h1>

      <section aria-label="To verify">
        <h2 className={H2}>To verify · {(pending ?? []).length}</h2>
        <div className={PANEL}>
          <div className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-slate-100">
            {(pending ?? []).map(renderRow)}
            {(pending ?? []).length === 0 && <EmptyState>Nothing to verify.</EmptyState>}
          </div>
        </div>
      </section>

      <section aria-label="Recent">
        <h2 className={H2}>Recent</h2>
        <div className={PANEL}>
          <div className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-slate-100">
            {(recent ?? []).map(renderRow)}
            {(recent ?? []).length === 0 && <EmptyState>No renewals yet.</EmptyState>}
          </div>
        </div>
      </section>
    </div>
  );
}
