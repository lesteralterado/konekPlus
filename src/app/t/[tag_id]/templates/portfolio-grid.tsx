import Image from "next/image";
import type { PortfolioItem } from "@/lib/types";

export function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-6 w-full text-left">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
        Portfolio
      </h2>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.project_url ?? undefined}
            target={item.project_url ? "_blank" : undefined}
            rel={item.project_url ? "noreferrer" : undefined}
            className="w-48 shrink-0 overflow-hidden rounded-2xl bg-slate-50 transition hover:bg-slate-100 active:scale-[0.98]"
          >
            {item.image_url && (
              <div className="relative h-28 w-full bg-slate-200">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-3">
              <p className="truncate text-sm font-bold text-slate-800">
                {item.title}
              </p>
              {item.tech && (
                <p className="mt-0.5 truncate text-xs font-medium text-brand-600">
                  {item.tech}
                </p>
              )}
              {item.description && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {item.description}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
