import { FINISHES, formatPrice, POPULAR_FINISH } from "@/lib/finishes";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { OrderForm, type FinishOption } from "./order-form";

export function OrderSection({ t }: { t: Dictionary["home"] }) {
  const finishes: FinishOption[] = FINISHES.map((f) => ({
    id: f.id,
    name: f.name,
    price: formatPrice(f.pricePhp),
    tagline: t.deck.finishes[f.id].tagline,
  }));

  return (
    <section id="order" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {t.order.kicker}
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-balance text-brand-900 sm:text-4xl">
            {t.order.heading}
          </h2>
          <p className="mt-4 text-balance text-slate-500">{t.order.subtitle}</p>
        </div>

        <OrderForm
          t={t.order}
          finishes={finishes}
          popularId={POPULAR_FINISH}
          popularLabel={t.deck.popular}
          perCardLabel={t.deck.perCard}
        />
      </div>
    </section>
  );
}
