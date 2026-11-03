import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { ArrowRightIcon, TapIcon } from "../_landing/icons";

// Konek+ has no sign-up page: an account is created when a card is activated.
// So the sign-in pages say, up front and calmly, who they're for. It's
// information, not an error, and it isn't dismissible: it's a fact about how
// the product works, and it must also read fine to admins and returning owners.
export function SignInNotice({
  t,
  compact = false,
}: {
  t: Dictionary["auth"];
  compact?: boolean;
}) {
  if (compact) {
    return (
      <p
        role="note"
        className="mb-5 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100"
      >
        <TapIcon className="size-4 shrink-0 text-brand-600" />
        {t.noticeCompact}
      </p>
    );
  }

  return (
    <div
      role="note"
      className="mb-5 flex gap-3 rounded-2xl bg-brand-50 p-4 text-brand-900 ring-1 ring-brand-100"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-brand-600">
        <TapIcon className="size-5" />
      </span>
      <div>
        <p className="text-sm font-semibold">{t.noticeTitle}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{t.noticeBody}</p>
      </div>
    </div>
  );
}

// "Don't have a card yet?": somewhere to go instead of a dead end. Below the
// form, so signing in stays the first thing on the page for owners.
export function NoCardLinks({ t }: { t: Dictionary["auth"] }) {
  const links = [
    { href: "/#order", label: t.orderLink },
    { href: "/guide#activate", label: t.activateLink },
    { href: "/track", label: t.trackLink },
  ];

  return (
    <nav aria-label={t.noCardHeading} className="mt-8 border-t border-slate-100 pt-6">
      <h2 className="text-sm font-semibold text-brand-900">{t.noCardHeading}</h2>
      <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl ring-1 ring-slate-200">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex min-h-11 items-center justify-between gap-3 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-brand-700"
            >
              {link.label}
              <ArrowRightIcon className="size-4 shrink-0 text-slate-400" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
