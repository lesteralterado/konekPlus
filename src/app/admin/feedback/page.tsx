import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { FeedbackCategory } from "@/lib/types";
import { StarIcon } from "../icons";
import { FeedbackStatusSelect } from "./status-select";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  bug: "Bug",
  feature: "Feature request",
  general: "General",
};

const CATEGORY_CLASS: Record<FeedbackCategory, string> = {
  bug: "bg-red-50 text-red-600",
  feature: "bg-brand-50 text-brand-700",
  general: "bg-slate-100 text-slate-500",
};

const CATEGORY_FILTERS: { value: FeedbackCategory | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "bug", label: "Bugs" },
  { value: "feature", label: "Feature requests" },
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

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const baseParams = { ...(category ? { category } : {}), ...(status ? { status } : {}) };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-900">Feedback</h1>

      <section className="rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6">
        <div className="mb-4 flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/admin/feedback?${new URLSearchParams({
                ...(status ? { status } : {}),
                ...(f.value ? { category: f.value } : {}),
              })}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                (category ?? "") === f.value
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          {(entries ?? []).map((entry) => {
            const submitter = entry.user_id ? profileByUserId.get(entry.user_id) : null;
            return (
              <div
                key={entry.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${CATEGORY_CLASS[entry.category]}`}
                    >
                      {CATEGORY_LABEL[entry.category]}
                    </span>
                    {entry.rating && (
                      <span className="flex items-center gap-0.5 text-accent-500">
                        {Array.from({ length: entry.rating }).map((_, i) => (
                          <StarIcon key={i} filled className="h-3.5 w-3.5" />
                        ))}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {submitter?.full_name ?? "Anonymous"} ·{" "}
                      {new Date(entry.created_at).toLocaleString()}
                      {entry.page_path ? ` · ${entry.page_path}` : ""}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {entry.message}
                  </p>
                  {entry.screenshot_url && (
                    <a
                      href={entry.screenshot_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block"
                    >
                      <div className="relative h-20 w-32 overflow-hidden rounded-xl bg-slate-100">
                        <Image
                          src={entry.screenshot_url}
                          alt="Feedback screenshot"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </a>
                  )}
                </div>
                <FeedbackStatusSelect id={entry.id} status={entry.status} />
              </div>
            );
          })}
          {(entries ?? []).length === 0 && (
            <p className="py-8 text-center text-slate-400">No feedback yet.</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              Page {page} of {totalPages} ({count} total)
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/feedback?${new URLSearchParams({ ...baseParams, page: String(page - 1) })}`}
                  className="rounded-full bg-slate-100 px-3 py-1.5 hover:bg-slate-200"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/feedback?${new URLSearchParams({ ...baseParams, page: String(page + 1) })}`}
                  className="rounded-full bg-slate-100 px-3 py-1.5 hover:bg-slate-200"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
