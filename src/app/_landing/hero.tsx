import { FINISHES, formatPrice, LOWEST_PRICE_PHP, POPULAR_FINISH } from "@/lib/finishes";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { CardDeck, type DeckItem } from "./card-deck";
import { ArrowRightIcon, QrIcon, ShieldCheckIcon, StarIcon, WalletIcon } from "./icons";
import { images } from "./images";

export function Hero({
  id,
  t,
  averageRating,
  ratingCount,
}: {
  id: string;
  t: Dictionary["home"];
  averageRating: number | null;
  ratingCount: number;
}) {
  const deckItems: DeckItem[] = FINISHES.map((finish) => ({
    id: finish.id,
    name: finish.name,
    price: formatPrice(finish.pricePhp),
    popular: finish.id === POPULAR_FINISH,
    ...t.deck.finishes[finish.id],
  }));

  return (
    <section id={id} data-nav-theme="dark" className="relative overflow-hidden bg-brand-900">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${images.heroBackground}')` }}
      />
      <div className="absolute inset-0 bg-linear-to-b from-brand-900/80 via-brand-900/60 to-brand-900/85" />

      {/* Top padding clears the fixed nav at its full (unscrolled) height. */}
      <div
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pb-10 pt-32 text-center sm:pt-46"
        style={{ textShadow: "0 2px 20px rgba(0,0,0,0.45)" }}
      >
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-wide text-white/80 backdrop-blur-sm">
          {t.hero.badge}
        </span>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white text-balance sm:text-5xl">
          {t.hero.titleLine1}
          <br />
          <span className="text-accent-500">{t.hero.titleLine2}</span>
        </h1>

        <p className="mt-5 max-w-md text-balance text-white/75">{t.hero.subtitle}</p>

        {/* Primary action first in reading order; "from ₱899" anchors the
            lowest price before anything else is seen. */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#order"
            className="inline-flex items-center gap-2 rounded-full bg-accent-500 py-2.5 pl-5 pr-2.5 text-sm font-semibold text-brand-900 transition hover:bg-accent-500/90"
          >
            {format(t.hero.ctaOrder, { price: formatPrice(LOWEST_PRICE_PHP) })}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-accent-500">
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </span>
          </a>
          <a
            href="#how-it-works"
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            {t.hero.ctaHowItWorks}
          </a>
        </div>

        {/* Risk reversal right under the CTA — the three things that stop
            a first-time buyer from trusting a new brand. */}
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-white/70">
          <li className="flex items-center gap-1.5">
            <WalletIcon className="h-4 w-4 text-accent-500" />
            {t.hero.trustPayment}
          </li>
          <li className="flex items-center gap-1.5">
            <ShieldCheckIcon className="h-4 w-4 text-accent-500" />
            {t.hero.trustGuarantee}
          </li>
          <li className="flex items-center gap-1.5">
            <QrIcon className="h-4 w-4 text-accent-500" />
            {t.hero.trustCompatibility}
          </li>
        </ul>

        {averageRating !== null && ratingCount > 0 && (
          <div className="mt-7 flex flex-col items-center gap-1.5">
            <div className="flex gap-0.5 text-accent-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} className="h-3.5 w-3.5" />
              ))}
            </div>
            <p className="text-xs text-white/55">
              {format(t.hero.ratingText, {
                rating: averageRating.toFixed(1),
                count: ratingCount,
              })}
            </p>
          </div>
        )}
      </div>

      <div
        id="how-it-works"
        className="relative z-10 mx-auto max-w-5xl scroll-mt-24 px-6 pb-14 md:pb-16"
      >
        <CardDeck
          items={deckItems}
          labels={{
            hint: t.deck.hint,
            flipHint: t.deck.flipHint,
            flipBack: t.deck.flipBack,
            perCard: t.deck.perCard,
            popular: t.deck.popular,
            chooseFinish: t.deck.chooseFinish,
          }}
        />
      </div>
    </section>
  );
}
