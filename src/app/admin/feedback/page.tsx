import { createClient } from "@/lib/supabase/server";
import type { FeedbackCategory } from "@/lib/types";
import { BugIcon, BulbIcon, MessageIcon, StarIcon } from "../icons";
import { CARD, EmptyState, FilterChips, PANEL, Pager } from "../ui/kit";
import { FeedbackStatusSelect } from "./status-select";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  bug: "Bug",
  feature: "Feature request",
  general: "General",
};

// Icon tiles so the kind of feedback reads before the text does.
const CATEGORY_ICON: Record<FeedbackCategory, { icon: typeof BugIcon; tile: string }> = {
  bug: { icon: BugIcon, tile: "bg-red-50 text-red-500" },
  feature: { icon: BulbIcon, tile: "bg-amber-50 text-amber-600" },
  general: { icon: MessageIcon, tile: "bg-brand-50 text-brand-700" },
};

const CATEGORY_FILTERS: { value: FeedbackCategory | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "bug", label: "Bugs" },
  { value: "feature", label: "Ideas" },
  { value: "general", label: "General" },
];

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; page?: string }>;
}) {
  const { category: categoryParam, status: statusParam, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const category =
    CATEGORY_FILTERS.find((f) => f.value === categoryParam)?.value || undefined;
  const status = (["new", "reviewed", "resolved"] as const).find(
    (s) => s === statusParam,
  );

  const supabase = await createClient();

  let query = supabase
    .from("feedback")
    .select(
      "id, user_id, category, message, rating, screenshot_url, page_path, status, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);

  const { data: entries, count } = await query;

  const userIds = [
    ...new Set(
      (entries ?? []).map((e) => e.user_id).filter((id): id is string => !!id),
    ),
  ];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds)
      : { data: [] };
  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  // Screenshots live in the private "feedback" bucket (0022). Rows store the
  // object path (older rows a public URL) — turn either into a 10-minute
  // signed link for this page view only.
  const shotPath = (value: string) =>
    value.startsWith("http") ? decodeURIComponent(value.split("/feedback/").pop() ?? "") : value;
  const shotPaths = (entries ?? []).flatMap((e) => (e.screenshot_url ? [shotPath(e.screenshot_url)] : []));
  const { data: signed } = shotPaths.length
    ? await supabase.storage.from("feedback").createSignedUrls(shotPaths, 600)
    : { data: [] };
  const signedByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const baseParams = { ...(category ? { category } : {}), ...(status ? { status } : {}) };

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <h1 className="text-[28px] font-bold tracking-tight text-brand-900 md:text-2xl md:font-semibold">
        Feedback
      </h1>

      <section className={PANEL}>
        <FilterChips
          items={CATEGORY_FILTERS}
          active={category ?? ""}
          hrefFor={(v) =>
            `/admin/feedback?${new URLSearchParams({ ...(status ? { status } : {}), ...(v ? { category: v } : {}) })}`
          }
        />

        <div className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-slate-100">
          {(entries ?? []).map((entry) => {
            const submitter = entry.user_id ? profileByUserId.get(entry.user_id) : null;
            const { icon: CatIcon, tile } = CATEGORY_ICON[entry.category];
            return (
              <article
                key={entry.id}
                className={`${CARD} flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4 md:rounded-none md:px-0 md:py-4 md:shadow-none md:ring-0`}
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${tile}`}
                    title={CATEGORY_LABEL[entry.category]}
                    aria-label={CATEGORY_LABEL[entry.category]}
                  >
                    <CatIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-slate-800">
                        {submitter?.full_name ?? "Anonymous"}
                      </span>
                      {entry.rating && (
                        <span className="flex items-center gap-0.5 text-accent-500" aria-label={`${entry.rating} of 5`}>
                          {Array.from({ length: entry.rating }).map((_, i) => (
                            <StarIcon key={i} filled className="h-3.5 w-3.5" />
                          ))}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(entry.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      {entry.page_path ? ` · ${entry.page_path}` : ""}
                    </p>
                    <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-[15px] text-slate-700 md:line-clamp-none md:text-sm">
                      {entry.message}
                    </p>
                    {entry.screenshot_url && signedByPath.get(shotPath(entry.screenshot_url)) && (
                      <a
                        href={signedByPath.get(shotPath(entry.screenshot_url))!}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block w-fit"
                      >
                        {/* Signed, short-lived URL to a private bucket — plain <img> on purpose. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={signedByPath.get(shotPath(entry.screenshot_url))!}
                          alt="Feedback screenshot"
                          className="h-24 w-36 rounded-xl bg-slate-100 object-cover md:h-20 md:w-32"
                        />
                      </a>
                    )}
                  </div>
                </div>
                <FeedbackStatusSelect id={entry.id} status={entry.status} />
              </article>
            );
          })}
          {(entries ?? []).length === 0 && <EmptyState>No feedback yet.</EmptyState>}
        </div>

        <Pager
          page={page}
          totalPages={totalPages}
          count={count}
          hrefFor={(n) => `/admin/feedback?${new URLSearchParams({ ...baseParams, page: String(n) })}`}
        />
      </section>
    </div>
  );
}
