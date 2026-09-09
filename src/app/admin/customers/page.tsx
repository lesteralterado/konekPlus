import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SearchIcon } from "../icons";

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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-900">Customers</h1>

      <section className="rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6">
        <form className="mb-4 flex items-center gap-2" action="/admin/customers">
          <div className="relative max-w-xs flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by name or email"
              className="w-full rounded-2xl bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
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
                  <td className="py-3 pr-4 text-slate-600">
                    {cardCountByProfile.get(p.id) ?? 0}
                  </td>
                  <td className="py-3 text-slate-500">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </td>
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

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              Page {page} of {totalPages} ({count} total)
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`}
                  className="rounded-full bg-slate-100 px-3 py-1.5 hover:bg-slate-200"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`}
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
