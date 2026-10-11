// Placeholder trust strip — Phase 4 replaces this with a feature marquee
// (and later, real client logos) in the same slot.
export function LogoStrip() {
  return (
    <section className="border-b border-slate-100 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-300"
          >
            <span className="h-2 w-2 rounded-full bg-slate-200" />
            Logoipsum
          </span>
        ))}
      </div>
    </section>
  );
}
