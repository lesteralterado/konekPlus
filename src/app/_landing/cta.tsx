import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { ArrowRightIcon } from "./icons";

function OrderButton({ label, className = "" }: { label: string; className?: string }) {
  return (
    <a
      href="#order"
      className={`inline-flex items-center gap-2 rounded-full bg-accent-500 py-2.5 pl-5 pr-2.5 text-sm font-semibold text-brand-900 transition hover:bg-accent-500/90 ${className}`}
    >
      {label}
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-accent-500">
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}

export function CtaBand({ t }: { t: Dictionary["home"]["cta"] }) {
  return (
    <section data-nav-theme="dark" className="bg-brand-900 py-20 sm:py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
        <h2 className="text-3xl font-semibold text-balance text-white sm:text-4xl">
          {t.headingPrefix} <span className="text-accent-500">{t.headingSuffix}</span>
        </h2>
        <p className="mt-4 max-w-md text-balance text-white/60">{t.body}</p>
        <OrderButton label={t.button} className="mt-8" />
      </div>
    </section>
  );
}

export function FinalCta({ t }: { t: Dictionary["home"]["finalCta"] }) {
  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center gap-6 rounded-[2.5rem] bg-brand-900 px-6 py-14 text-center sm:px-16">
          <h2 className="max-w-lg text-3xl font-semibold text-balance text-white sm:text-4xl">
            {t.headingPrefix} <span className="text-accent-500">{t.headingSuffix}</span>
          </h2>
          <p className="max-w-md text-balance text-white/60">{t.body}</p>
          <OrderButton label={t.button} className="mt-2" />
        </div>
      </div>
    </section>
  );
}
