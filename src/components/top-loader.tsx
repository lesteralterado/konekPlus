"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

// Thin progress bar at the top of the screen the instant a link is tapped,
// so a navigation never feels frozen. It creeps toward ~80% while the next
// page is on its way, then fills and fades once the URL actually changes.
// (The Next router has no navigation events, so we start on link clicks /
// back-forward and finish on the pathname/search change.) Driven straight
// on the DOM via a ref — it's purely visual, so no re-renders.
export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const running = useRef(false);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function paint(pct: number, visible: boolean) {
    const bar = barRef.current;
    if (!bar) return;
    bar.style.width = `${pct}%`;
    bar.style.opacity = visible ? "1" : "0";
  }

  // Finish whenever the route actually changed.
  useEffect(() => {
    if (!running.current) return;
    running.current = false;
    clearTimers();
    paint(100, true);
    timers.current.push(setTimeout(() => paint(100, false), 200));
    timers.current.push(setTimeout(() => paint(0, false), 500));
  }, [pathname, searchParams]);

  useEffect(() => {
    function start() {
      clearTimers();
      running.current = true;
      paint(12, true);
      // Ease toward 80% so a slow response still looks alive.
      for (const [ms, pct] of [[150, 35], [450, 55], [900, 70], [1800, 80]]) {
        timers.current.push(setTimeout(() => running.current && paint(pct, true), ms));
      }
      // Safety net (e.g. the navigation was cancelled or failed).
      timers.current.push(
        setTimeout(() => {
          running.current = false;
          paint(0, false);
        }, 10_000),
      );
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page / hash
      start();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      clearTimers();
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.75">
      <div
        ref={barRef}
        style={{ width: "0%", opacity: 0 }}
        className="h-full rounded-r-full bg-brand-600 shadow-[0_0_8px_rgba(13,125,115,0.6)] transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none"
      />
    </div>
  );
}
