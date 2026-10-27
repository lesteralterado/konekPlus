"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/dashboard/actions";
import { Sheet } from "@/components/sheet";
import {
  ArrowLeftIcon,
  BagIcon,
  ChevronRightIcon,
  CreditCardIcon,
  EllipsisIcon,
  GridIcon,
  KeyIcon,
  LogOutIcon,
  MessageIcon,
  StarIcon,
  UsersIcon,
  WalletIcon,
} from "../icons";

type NavItem = {
  href: string;
  label: string; // sidebar
  short: string; // tab bar — one word
  icon: (p: { className?: string }) => React.ReactElement;
  tile: string; // More-drawer icon tile colour
};

// Phones get the 4 most-used sections as tabs; the rest live under More.
const TABS: NavItem[] = [
  { href: "/admin", label: "Dashboard", short: "Home", icon: GridIcon, tile: "bg-brand-900" },
  { href: "/admin/orders", label: "Orders", short: "Orders", icon: BagIcon, tile: "bg-accent-500" },
  { href: "/admin/tags", label: "Cards", short: "Cards", icon: CreditCardIcon, tile: "bg-brand-600" },
  { href: "/admin/customers", label: "Customers", short: "People", icon: UsersIcon, tile: "bg-sky-500" },
];

const MORE: NavItem[] = [
  { href: "/admin/finance", label: "Finance", short: "Finance", icon: WalletIcon, tile: "bg-emerald-500" },
  { href: "/admin/renewals", label: "Pro renewals", short: "Renewals", icon: StarIcon, tile: "bg-accent-500" },
  { href: "/admin/keychains", label: "Keychains", short: "Keychains", icon: KeyIcon, tile: "bg-violet-500" },
  { href: "/admin/feedback", label: "Feedback", short: "Feedback", icon: MessageIcon, tile: "bg-amber-500" },
  { href: "/admin/testimonials", label: "Testimonials", short: "Reviews", icon: StarIcon, tile: "bg-rose-500" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function Badge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={`grid h-4.5 min-w-4.5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AdminNav({ newOrders, newFeedback }: { newOrders: number; newFeedback: number }) {
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();
  // Start loading a tab the moment a finger/pointer lands on it, ~100ms
  // before the tap completes. Cheap: the router dedupes repeat prefetches.
  const warm = (href: string) => () => router.prefetch(href);
  const [moreOpen, setMoreOpen] = useState(false);
  const badgeFor = (href: string) =>
    href === "/admin/orders" ? newOrders : href === "/admin/feedback" ? newFeedback : 0;
  const moreActive = MORE.some((m) => isActive(pathname, m.href));

  return (
    <>
      {/* Desktop / tablet sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-6 md:flex">
        <div className="mb-4 px-2 text-lg font-semibold text-brand-900">Konek+ Admin</div>
        <nav className="flex flex-1 flex-col gap-1">
          {[...TABS, ...MORE].map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onPointerEnter={warm(href)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{label}</span>
                <PendingSpinner />
                <Badge count={badgeFor(href)} />
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
              <LogOutIcon className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Phone bottom tab bar */}
      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map(({ href, short, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onTouchStart={warm(href)}
                onPointerEnter={warm(href)}
                aria-current={active ? "page" : undefined}
                className={`ios-press flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] font-semibold ${
                  active ? "text-brand-900" : "text-slate-400"
                }`}
              >
                <TabIcon active={active} badge={badgeFor(href)}>
                  <Icon className="size-5.5" />
                  <PendingSpinner overlay />
                </TabIcon>
                {short}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            className={`ios-press flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] font-semibold ${
              moreActive ? "text-brand-900" : "text-slate-400"
            }`}
          >
            <TabIcon active={moreActive} badge={newFeedback}>
              <EllipsisIcon className="size-5.5" />
            </TabIcon>
            More
          </button>
        </div>
      </nav>

      <Sheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="More"
        closeLabel="Close"
        scopeClass="admin-ui"
      >
        <div className="flex flex-col gap-5 pb-2">
          <div className="overflow-hidden rounded-[22px] bg-white">
            {MORE.map(({ href, label, icon: Icon, tile }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className="ios-row group/row flex items-center pl-4"
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-white ${tile}`}>
                  <Icon className="size-4.5" />
                </span>
                <span className="ml-3 flex min-h-13 flex-1 items-center gap-2 border-b border-slate-200/70 pr-4 group-last/row:border-b-0">
                  <span className="flex-1 text-[17px] text-slate-800">{label}</span>
                  <Badge count={badgeFor(href)} />
                  <ChevronRightIcon className="size-4 text-slate-300" />
                </span>
              </Link>
            ))}
          </div>
          <div className="overflow-hidden rounded-[22px] bg-white">
            <Link
              href="/dashboard"
              onClick={() => setMoreOpen(false)}
              className="ios-row group/row flex items-center pl-4"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-400 text-white">
                <ArrowLeftIcon className="size-4.5" />
              </span>
              <span className="ml-3 flex min-h-13 flex-1 items-center border-b border-slate-200/70 pr-4 text-[17px] text-slate-800 group-last/row:border-b-0">
                Back to site
              </span>
            </Link>
            <form action={signOut} className="group/row">
              <button type="submit" className="ios-row flex w-full items-center pl-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-red-500 text-white">
                  <LogOutIcon className="size-4.5" />
                </span>
                <span className="ml-3 flex min-h-13 flex-1 items-center pr-4 text-[17px] text-red-600">
                  Sign out
                </span>
              </button>
            </form>
          </div>
        </div>
      </Sheet>
    </>
  );
}

function TabIcon({
  active,
  badge,
  children,
}: {
  active: boolean;
  badge: number;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`relative grid h-8 w-14 place-items-center rounded-full transition-colors ${
        active ? "bg-brand-900/8" : ""
      }`}
    >
      {children}
      <Badge count={badge} className="absolute -top-0.5 right-1.5 ring-2 ring-white" />
    </span>
  );
}

// Shown on the link that was just tapped until its page arrives (must be
// rendered inside that <Link> — useLinkStatus reads the nearest one).
function PendingSpinner({ overlay = false }: { overlay?: boolean }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden="true"
      className={`size-3.5 shrink-0 rounded-full border-2 border-brand-600 border-t-transparent motion-safe:animate-spin ${
        overlay ? "absolute -bottom-0.5 left-1.5 bg-white" : ""
      }`}
    />
  );
}
