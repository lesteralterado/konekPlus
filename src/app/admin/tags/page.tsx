import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EnabledToggle } from "./enabled-toggle";
import { ProvisionForm } from "./provision-form";
import { ResetButton } from "./reset-button";
import { ExternalIcon } from "../icons";
import { Fab } from "../ui/drawers";
import { CARD, EmptyState, IconLink, PANEL, Pager, SearchBar } from "../ui/kit";
import { StatusPill } from "../ui/status";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  let tagsQuery = supabase
    .from("tags")
    .select("tag_id, claimed, enabled, profile_id, claimed_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (q) tagsQuery = tagsQuery.ilike("tag_id", `%${q}%`);

  const [{ data: tags, count }, { data: batches }] = await Promise.all([
    tagsQuery,
    supabase
      .from("tag_batches")
      .select("id, count, note, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const profileIds = [
    ...new Set((tags ?? []).map((t) => t.profile_id).filter((id): id is string => !!id)),
  ];
  const { data: owners } =
    profileIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, email").in("id", profileIds)
      : { data: [] };
  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

  const recentBatches = batches && batches.length > 0 && (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        Recent batches
      </p>
      <ul className="flex flex-col gap-1 text-sm text-slate-600">
        {batches.map((b) => (
          <li key={b.id} className="flex justify-between gap-3">
            <span>
              {b.count} tags{b.note ? ` — ${b.note}` : ""}
            </span>
            <span className="text-slate-400">{new Date(b.created_at).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <h1 className="text-[28px] font-bold tracking-tight text-brand-900 md:text-2xl md:font-semibold">
        Cards
      </h1>

      {/* Desktop: provisioning inline. Phones: behind the + button. */}
      <section className="hidden rounded-3xl bg-white p-6 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] md:block">
        <h2 className="mb-4 text-sm font-semibold text-brand-900">Provision a new batch</h2>
        <ProvisionForm siteUrl={siteUrl} />
        {recentBatches}
      </section>
      <Fab label="New card batch">
        <ProvisionForm siteUrl={siteUrl} />
        {recentBatches}
      </Fab>

      <section className={PANEL}>
        <SearchBar action="/admin/tags" q={q} placeholder="Search card code" />

        {/* Phones: one card per tag */}
        <ul className="flex flex-col gap-3 md:hidden">
          {(tags ?? []).map((tag) => {
            const owner = tag.profile_id ? ownerById.get(tag.profile_id) : null;
            const ownerName = owner ? owner.full_name || owner.email : null;
            return (
              <li key={tag.tag_id} className={`${CARD} flex items-center gap-3`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[15px] font-semibold text-slate-800">{tag.tag_id}</span>
                    {!tag.claimed ? (
                      <StatusPill tone="grey" label="Unclaimed" />
                    ) : tag.enabled ? (
                      <StatusPill tone="green" label="Live" />
                    ) : (
                      <StatusPill tone="amber" label="Off" />
                    )}
                  </div>
                  {ownerName ? (
                    <Link
                      href={`/admin/customers/${tag.profile_id}`}
                      className="mt-0.5 block truncate text-sm font-medium text-brand-700"
                    >
                      {ownerName}
                    </Link>
                  ) : (
                    <p className="mt-0.5 text-sm text-slate-400">No owner yet</p>
                  )}
                  {tag.claimed_at && (
                    <p className="text-xs text-slate-400">
                      Claimed {new Date(tag.claimed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <IconLink href={`/t/${tag.tag_id}`} label={`Open ${tag.tag_id}`}>
                    <ExternalIcon className="size-4.5" />
                  </IconLink>
                  {tag.claimed && (
                    <>
                      <EnabledToggle tagId={tag.tag_id} enabled={tag.enabled} compact />
                      <ResetButton tagId={tag.tag_id} compact />
                    </>
                  )}
                </div>
              </li>
            );
          })}
          {(tags ?? []).length === 0 && <EmptyState>No cards found.</EmptyState>}
        </ul>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4 font-medium">Code</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Visibility</th>
                <th className="pb-2 pr-4 font-medium">Owner</th>
                <th className="pb-2 pr-4 font-medium">Claimed</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(tags ?? []).map((tag) => {
                const owner = tag.profile_id ? ownerById.get(tag.profile_id) : null;
                return (
                  <tr key={tag.tag_id}>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/t/${tag.tag_id}`}
                        className="font-mono text-slate-700 hover:text-brand-700"
                      >
                        {tag.tag_id}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          tag.claimed ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {tag.claimed ? "Claimed" : "Unclaimed"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {tag.claimed ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            tag.enabled ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {tag.enabled ? "Enabled" : "Disabled"}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {owner ? (
                        <Link href={`/admin/customers/${tag.profile_id}`} className="hover:text-brand-700">
                          {owner.full_name || owner.email || "—"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-500">
                      {tag.claimed_at ? new Date(tag.claimed_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 text-right">
                      {tag.claimed && (
                        <div className="flex items-center justify-end gap-1">
                          <EnabledToggle tagId={tag.tag_id} enabled={tag.enabled} />
                          <ResetButton tagId={tag.tag_id} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(tags ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No tags found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pager
          page={page}
          totalPages={totalPages}
          count={count}
          hrefFor={(p) =>
            `/admin/tags?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`
          }
        />
      </section>
    </div>
  );
}
