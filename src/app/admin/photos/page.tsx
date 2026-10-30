import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CARD, EmptyState, FilterChips, PANEL, Pager } from "../ui/kit";
import { PhotoRow } from "./photo-panel";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const FILTERS = [
  { value: "", label: "All" },
  { value: "freebie", label: "Freebie to give" },
  { value: "social", label: "Social OK" },
  { value: "website", label: "Website OK" },
  { value: "withdrawn", label: "Withdrawn" },
];

export default async function AdminPhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; page?: string }>;
}) {
  const { show: showParam, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const show = FILTERS.find((f) => f.value === showParam)?.value || "";

  const supabase = await createClient();

  let query = supabase
    .from("customer_photos")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (show === "freebie") query = query.eq("freebie_status", "pending");
  if (show === "social") query = query.eq("consent_social", true).neq("status", "withdrawn");
  if (show === "website") query = query.eq("consent_website", true).neq("status", "withdrawn");
  if (show === "withdrawn") query = query.eq("status", "withdrawn");

  const [{ data: photos, count }, { count: freebiesToGive }] = await Promise.all([
    query,
    supabase
      .from("customer_photos")
      .select("id", { count: "exact", head: true })
      .eq("freebie_status", "pending"),
  ]);
  const rows = photos ?? [];

  // Who each photo is of, and a short-lived link to each file still stored.
  const keychainIds = rows.map((p) => p.keychain_order_id).filter((id): id is string => !!id);
  const cardIds = rows.map((p) => p.card_order_id).filter((id): id is string => !!id);
  const paths = rows.map((p) => p.photo_path).filter((p): p is string => !!p);
  const [{ data: keychains }, { data: cards }, { data: signed }] = await Promise.all([
    keychainIds.length
      ? supabase.from("keychain_orders").select("id, customer_name").in("id", keychainIds)
      : { data: [] },
    cardIds.length
      ? supabase.from("card_orders").select("id, full_name").in("id", cardIds)
      : { data: [] },
    paths.length
      ? supabase.storage.from("customer-photos").createSignedUrls(paths, 600)
      : { data: [] },
  ]);
  const names = new Map<string, string>([
    ...(keychains ?? []).map((k) => [k.id, k.customer_name] as const),
    ...(cards ?? []).map((c) => [c.id, c.full_name] as const),
  ]);
  const urls = new Map<string, string>();
  for (const item of signed ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const hrefFor = (next: { show?: string; page?: number }) => {
    const params: Record<string, string> = {};
    const s = next.show ?? show;
    if (s) params.show = s;
    if (next.page && next.page > 1) params.page = String(next.page);
    const qs = new URLSearchParams(params).toString();
    return qs ? `/admin/photos?${qs}` : "/admin/photos";
  };

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[28px] font-bold tracking-tight text-brand-900 md:text-2xl md:font-semibold">
          Photos
        </h1>
        {(freebiesToGive ?? 0) > 0 && (
          <Link
            href="/admin/photos?show=freebie"
            className="ios-press inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700"
          >
            <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
            {freebiesToGive} freebie{freebiesToGive === 1 ? "" : "s"} to give
          </Link>
        )}
      </div>

      <section className={PANEL}>
        <FilterChips items={FILTERS} active={show} hrefFor={(v) => hrefFor({ show: v })} />

        <div className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-slate-100">
          {rows.map((photo) => {
            const orderId = photo.keychain_order_id ?? photo.card_order_id ?? "";
            const name = names.get(orderId) ?? "Unknown customer";
            return (
              <article
                key={photo.id}
                className={`${CARD} md:rounded-none md:px-0 md:py-4 md:shadow-none md:ring-0`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-semibold text-brand-900">{name}</span>
                  <Link
                    href={photo.keychain_order_id ? `/admin/keychains/${orderId}` : "/admin/orders"}
                    className="shrink-0 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    {photo.keychain_order_id
                      ? "Keychain order →"
                      : `Order KP-${orderId.slice(0, 6).toUpperCase()} →`}
                  </Link>
                </div>
                <PhotoRow
                  photo={photo}
                  url={photo.photo_path ? urls.get(photo.photo_path) : undefined}
                  customerName={name}
                />
              </article>
            );
          })}
          {rows.length === 0 && (
            <EmptyState>
              {show ? "No photos match this filter." : "No photos yet — they appear after a handover."}
            </EmptyState>
          )}
        </div>

        <Pager
          page={page}
          totalPages={totalPages}
          count={count}
          hrefFor={(p) => hrefFor({ page: p })}
        />
      </section>
    </div>
  );
}
