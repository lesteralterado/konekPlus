import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChevronRightIcon, CreditCardIcon } from "../icons";
import { CARD, EmptyState, PANEL, Pager, SearchBar } from "../ui/kit";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  let profilesQuery = supabase
    .from("profiles")
    .select("id, full_name, email, company, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (q) {
    profilesQuery = profilesQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data: profiles, count } = await profilesQuery;

  const profileIds = (profiles ?? []).map((p) => p.id);
  const { data: allTags } =
    profileIds.length > 0
      ? await supabase.from("tags").select("profile_id").in("profile_id", profileIds)
      : { data: [] };
  const cardCountByProfile = new Map<string, number>();
  for (const t of allTags ?? []) {
    if (!t.profile_id) continue;
    cardCountByProfile.set(t.profile_id, (cardCountByProfile.get(t.profile_id) ?? 0) + 1);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <h1 className="text-[28px] font-bold tracking-tight text-brand-900 md:text-2xl md:font-semibold">
        Customers
      </h1>

      <section className={PANEL}>
        <SearchBar action="/admin/customers" q={q} placeholder="Search name or email" />

        {/* Phones: one card per customer, whole card taps through */}
        <ul className="flex flex-col gap-3 md:hidden">
          {(profiles ?? []).map((p) => (
            <li key={p.id}>
              <Link href={`/admin/customers/${p.id}`} className={`${CARD} ios-press flex items-center gap-3`}>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 text-lg font-bold text-brand-700">
                  {(p.full_name || p.email || "?").slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-slate-800">
                    {p.full_name || "—"}
                  </span>
                  <span className="block truncate text-sm text-slate-500">
                    {[p.email, p.company].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>
                <span
                  className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-600"
                  aria-label={`${cardCountByProfile.get(p.id) ?? 0} cards`}
                >
                  <CreditCardIcon className="size-4" />
                  {cardCountByProfile.get(p.id) ?? 0}
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-slate-300" />
              </Link>
            </li>
          ))}
          {(profiles ?? []).length === 0 && <EmptyState>No customers found.</EmptyState>}
        </ul>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium">Cards</th>
                <th className="pb-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(profiles ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/customers/${p.id}`}
                      className="font-medium text-slate-700 hover:text-brand-700"
                    >
                      {p.full_name || "—"}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{p.email || "—"}</td>
                  <td className="py-3 pr-4 text-slate-600">{p.company || "—"}</td>
                  <td className="py-3 pr-4 text-slate-600">{cardCountByProfile.get(p.id) ?? 0}</td>
                  <td className="py-3 text-slate-500">{new Date(p.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {(profiles ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No customers found.
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
          hrefFor={(n) =>
            `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(n) })}`
          }
        />
      </section>
    </div>
  );
}
