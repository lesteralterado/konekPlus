import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { formatPrice } from "@/lib/finishes";
import { format } from "@/lib/i18n/format";
import { PRO_PRICE_PHP } from "@/lib/plan";
import { ChevronDownIcon } from "./icons";

// Answers can quote the Pro renewal price; it comes from one place.
const PRICES = {
  proYearly: formatPrice(PRO_PRICE_PHP.yearly),
  proMonthly: formatPrice(PRO_PRICE_PHP.monthly),
};

export function Faq({ t }: { t: Dictionary["home"]["faq"] }) {
  return (
    <section id="faq" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {t.kicker}
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-balance text-brand-900 sm:text-4xl">
            {t.heading}
          </h2>
        </div>

        <div className="mt-10 flex flex-col divide-y divide-slate-100 rounded-3xl bg-slate-50 px-6">
          {t.items.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-brand-900 marker:content-none">
                {faq.q}
                <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{format(faq.a, PRICES)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
