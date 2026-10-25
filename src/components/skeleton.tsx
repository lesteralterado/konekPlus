// Grey placeholder shapes shown by loading.tsx files while a page's data is
// on its way — shaped like the real page so nothing jumps when it arrives.
// Server-safe (no hooks). Pulse is skipped for reduced-motion users.

export function Bone({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl bg-slate-200/80 motion-safe:animate-pulse ${className}`} />;
}

// Screen-reader announcement + container for a loading view.
export function LoadingShell({ children, label = "Loading…" }: { children: React.ReactNode; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-5 md:gap-6">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

// A list page: title, chip/search row, then cards (phones) / rows (desktop).
export function ListSkeleton({ rows = 4, chips = true }: { rows?: number; chips?: boolean }) {
  return (
    <LoadingShell>
      <Bone className="h-8 w-40" />
      {chips && (
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>
      )}
      <Bone className="h-11 w-full rounded-full md:max-w-xs" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-[22px] bg-white p-4 ring-1 ring-slate-900/[0.04]">
            <div className="flex items-center gap-3">
              <Bone className="size-11 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Bone className="h-4 w-2/3" />
                <Bone className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </LoadingShell>
  );
}

// A detail page: back link, header card, then item cards.
export function DetailSkeleton() {
  return (
    <LoadingShell>
      <Bone className="h-4 w-28" />
      <div className="rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]">
        <Bone className="h-6 w-1/2" />
        <Bone className="mt-2 h-3 w-1/3" />
        <Bone className="mt-5 h-11 w-full rounded-full" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-[22px] bg-white p-4">
          <Bone className="h-4 w-1/2" />
          <Bone className="mt-3 h-12 w-full" />
          <Bone className="mt-3 h-12 w-full rounded-full" />
        </div>
      ))}
    </LoadingShell>
  );
}
