import Image from "next/image";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { LinkChainIcon, RefreshIcon, TapIcon } from "./icons";
import { images } from "./images";
import { StackedCards } from "./stacked-cards";

// h-full keeps grid rows even on md+; the min height on phones makes each
// tile read as a proper card while it's pinned in the stack.
const TILE = "flex h-full flex-col justify-between gap-6 rounded-3xl p-6 max-md:min-h-52";

export function About({
  t,
  claimedCount,
  recentViewCount,
}: {
  t: Dictionary["home"]["about"];
  claimedCount: number;
  recentViewCount: number;
}) {
  return (
    <section id="about" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {t.kicker}
          </span>
          <h2 className="mt-4 text-3xl font-semibold leading-snug text-balance text-brand-900 sm:text-4xl">
            {t.headingPrefix}{" "}
            <span className="inline-flex h-7 w-7 -translate-y-0.5 items-center justify-center rounded-full bg-brand-100 align-middle text-brand-700">
              <RefreshIcon className="h-3.5 w-3.5" />
            </span>{" "}
            {t.headingMiddle}{" "}
            <span className="inline-flex h-7 w-7 -translate-y-0.5 items-center justify-center rounded-full bg-accent-500/15 align-middle text-accent-500">
              <LinkChainIcon className="h-3.5 w-3.5" />
            </span>{" "}
            {t.headingSuffix}
          </h2>
          <p className="mt-5 text-slate-500">{t.body}</p>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl">
          <Image
            src={images.aboutCard}
            alt="A Konek+ NFC business card"
            fill
            unoptimized
            className="object-cover object-[35%_45%]"
          />
        </div>
      </div>

      <StackedCards className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-4 px-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          <div key="claimed" className={`${TILE} bg-brand-900`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
              <TapIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{claimedCount}</p>
              <p className="mt-1 text-sm text-white/50">{t.statCardsClaimed}</p>
            </div>
          </div>,

          // Light tile on a white section: the ring keeps its edge visible
          // when it's sitting in the stack.
          <div key="sync" className={`${TILE} bg-slate-50 max-md:ring-1 max-md:ring-slate-200`}>
            <p className="text-3xl font-bold text-brand-900">{t.statSyncValue}</p>
            <p className="text-sm text-slate-500">{t.statSyncLabel}</p>
          </div>,

          <div key="taps" className={`${TILE} bg-accent-500`}>
            <p className="text-3xl font-bold text-brand-900">{recentViewCount}</p>
            <p className="text-sm text-brand-900/70">{t.statTapsServed}</p>
          </div>,

          <div key="sync-promise" className={`${TILE} bg-brand-900`}>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">
              {t.statAlwaysInSync}
            </p>
            <p className="text-2xl font-bold text-white">
              {t.statOneTap}
              <br />
              <span className="text-lg font-medium text-white/60">{t.statEveryCard}</span>
            </p>
          </div>,
        ]}
      </StackedCards>
    </section>
  );
}
