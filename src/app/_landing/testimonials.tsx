import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import Image from "next/image";
import type { PublicLandingTestimonial } from "@/lib/types";
import { StarIcon } from "./icons";

// Social proof only works when there's enough of it: below this many
// published quotes the section renders nothing rather than look thin.
export const MIN_TESTIMONIALS = 3;

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function Testimonials({
  t,
  items,
}: {
  t: Dictionary["home"]["testimonials"];
  items: PublicLandingTestimonial[];
}) {
  if (items.length < MIN_TESTIMONIALS) return null;

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{t.kicker}</span>
          <h2 className="mt-4 text-3xl font-semibold text-balance text-brand-900 sm:text-4xl">{t.heading}</h2>
        </div>

        {/* Swipeable row on phones, grid from md up. */}
        <div className="-mx-6 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {items.map((item) => (
            <figure
              key={item.id}
              className="flex w-[85%] shrink-0 snap-center flex-col justify-between gap-6 rounded-3xl bg-slate-50 p-6 md:w-auto"
            >
              <div>
                <div className="flex gap-0.5 text-accent-500" aria-label={`${item.rating}/5`}>
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4" />
                  ))}
                </div>
                <blockquote className="mt-4 text-brand-900">“{item.quote}”</blockquote>
              </div>
              <figcaption className="flex items-center gap-3">
                {item.photo_url ? (
                  // Only customers who agreed to website use get a photo (0028).
                  <Image
                    src={item.photo_url}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {initials(item.author_name)}
                  </span>
                )}
                <span>
                  <span className="block text-sm font-semibold text-brand-900">{item.author_name}</span>
                  {item.author_role && (
                    <span className="block text-xs text-slate-500">{item.author_role}</span>
                  )}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
