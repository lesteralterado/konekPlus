import Link from "next/link";
import { FINISHES, formatPrice } from "@/lib/finishes";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { CardDeck, type DeckItem } from "./card-deck";
import { ArrowUpRightIcon, StarIcon } from "./icons";
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
    ...t.deck.finishes[finish.id],
  }));

  return (
    <section id={id} className="relative overflow-hidden bg-brand-900">
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

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#how-it-works"
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            {t.hero.ctaHowItWorks}
          </a>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-accent-500 py-2.5 pl-5 pr-2.5 text-sm font-semibold text-brand-900 transition hover:bg-accent-500/90"
          >
            {t.hero.ctaSignIn}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-accent-500">
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>

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

        <p className="mt-6 text-sm text-white/55">
          {t.hero.tapHint}{" "}
          <code className="rounded bg-white/15 px-1.5 py-0.5 text-white/80">
            /t/&lt;code&gt;
          </code>
          .
        </p>
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
          }}
        />
      </div>
    </section>
  );
}
