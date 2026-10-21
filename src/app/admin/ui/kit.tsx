import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, SearchIcon } from "../icons";

// Server-safe building blocks for the mobile admin. Below md the white
// "panel" sections dissolve so lists read as separate cards on the grey
// page (no card-in-card); from md up everything looks as before.

export const PANEL =
  "md:rounded-3xl md:bg-white md:p-6 md:shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]";

export const CARD =
  "rounded-[22px] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.04]";

// 44px round icon button — the meaning is in the icon; the label is for
// screen readers and the long-press/hover tooltip.
export const ICON_ACTION =
  "ios-press grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 active:bg-slate-200 disabled:opacity-50";

export function IconLink({
  href,
  label,
  children,
  className = ICON_ACTION,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const external = /^https?:/i.test(href);
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={className}
    >
      {children}
    </a>
  );
}

export function FilterChips({
  items,
  active,
  hrefFor,
}: {
  items: { value: string; label: string; count?: number }[];
  active: string;
  hrefFor: (value: string) => string;
}) {
  return (
    <div className="no-scrollbar -mx-4 mb-4 flex snap-x gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
      {items.map((f) => {
        const on = active === f.value;
        return (
          <Link
            key={f.value}
            href={hrefFor(f.value)}
            aria-current={on ? "page" : undefined}
            className={`ios-press shrink-0 snap-start whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold md:px-3 md:py-1.5 md:text-xs md:font-medium ${
              on
                ? "bg-brand-900 text-white md:bg-brand-600"
                : "bg-white text-slate-600 ring-1 ring-slate-200 md:bg-slate-100 md:text-slate-500 md:ring-0"
            }`}
          >
            {f.label}
          </Link>
        );
      })}
    </div>
  );
}

// GET form: works without JS. 16px text so iOS doesn't zoom on focus.
export function SearchBar({
  action,
  q,
  placeholder,
  hidden = {},
}: {
  action: string;
  q?: string;
  placeholder: string;
  hidden?: Record<string, string>;
}) {
  const clearHref = `${action}?${new URLSearchParams(hidden)}`;
  return (
    <form action={action} role="search" className="mb-4 flex items-center gap-2">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="relative flex-1 md:max-w-xs">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />
        <input
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-11 w-full rounded-full bg-white pl-10 pr-10 text-base text-slate-800 ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 md:h-auto md:rounded-2xl md:bg-slate-50 md:py-2.5 md:text-sm md:ring-0"
        />
        {q && (
          <Link
            href={clearHref}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-slate-200 text-slate-500"
          >
            <CloseIcon className="size-3.5" />
          </Link>
        )}
      </div>
      <button
        type="submit"
        className="hidden rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 md:block"
      >
        Search
      </button>
    </form>
  );
}

export function Pager({
  page,
  totalPages,
  count,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  count: number | null;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const btn =
    "ios-press grid size-11 place-items-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200 md:size-9 md:bg-slate-100 md:ring-0";
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} aria-label="Previous page" className={btn}>
          <ChevronLeftIcon className="size-5" />
        </Link>
      ) : (
        <span className="size-11 md:size-9" />
      )}
      <span className="text-sm font-medium text-slate-500">
        {page} / {totalPages}
        <span className="text-slate-400"> · {count} total</span>
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} aria-label="Next page" className={btn}>
          <ChevronRightIcon className="size-5" />
        </Link>
      ) : (
        <span className="size-11 md:size-9" />
      )}
    </nav>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-slate-400">{children}</p>;
}
