import Image from "next/image";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { images } from "./images";
import { StackedCards } from "./stacked-cards";

export function Gallery({ t }: { t: Dictionary["home"]["gallery"] }) {
  return (
    <section id="product" className="scroll-mt-24 bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {t.kicker}
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-balance text-brand-900 sm:text-4xl">
            {t.heading}
          </h2>
        </div>

        <StackedCards className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          {t.items.map((item, i) => {
            const src = images.gallery[i];
            return (
              <div
                key={item.title}
                className="h-full overflow-hidden rounded-3xl bg-white shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                  {src ? (
                    <Image src={src} alt={item.title} fill unoptimized className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-300">
                      {t.imageComingSoon}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-brand-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </div>
              </div>
            );
          })}
        </StackedCards>
      </div>
    </section>
  );
}
