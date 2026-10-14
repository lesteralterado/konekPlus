// Benefit strip in the slot that'll later hold real client logos. Pure CSS:
// the list is rendered twice and the track slides by exactly one copy, so
// the loop is seamless. Pauses on hover so a phrase can actually be read.
export function FeatureMarquee({ items }: { items: string[] }) {
  const row = (ariaHidden: boolean) => (
    <ul
      aria-hidden={ariaHidden || undefined}
      className={`flex shrink-0 items-center ${ariaHidden ? "motion-reduce:hidden" : "motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-2"}`}
    >
      {items.map((item) => (
        <li
          key={item}
          className="flex items-center gap-3 whitespace-nowrap px-6 text-sm font-medium text-slate-500"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    <section className="group relative overflow-hidden border-y border-slate-100 bg-white py-6 mask-[linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <div className="marquee-track flex w-max group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
