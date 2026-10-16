import Image from "next/image";
import type { PortfolioItem } from "@/lib/types";
import { SectionHeader } from "../ui/ios";

// Snap-scrolling cards with a visible peek of the next one, so it reads as
// "swipe for more" without an arrow. Bleeds to the screen edges (-mx-4).
export function PortfolioGrid({ items, heading }: { items: PortfolioItem[]; heading: string }) {
  if (items.length === 0) return null;

  return (
    <section>
      <SectionHeader>{heading}</SectionHeader>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.project_url ?? undefined}
            target={item.project_url ? "_blank" : undefined}
            rel={item.project_url ? "noreferrer" : undefined}
            className="ios-press w-[78%] max-w-72 shrink-0 snap-start overflow-hidden rounded-[22px] bg-ios-surface"
          >
            {item.image_url && (
              <div className="relative aspect-16/10 w-full bg-ios-fill">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  sizes="288px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="px-4 py-3">
              <p className="truncate text-[15px] font-semibold text-ios-label">{item.title}</p>
              {item.tech && (
                <p className="mt-0.5 truncate text-[13px] font-medium text-ios-tint">{item.tech}</p>
              )}
              {item.description && (
                <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ios-label-2">
                  {item.description}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
