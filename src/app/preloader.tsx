"use client";

import { useEffect, useState } from "react";

const HOLD_MS = 1300;
const EXIT_MS = 700;

// Inline, not the remote Cloudinary logo — a preloader has to render
// instantly regardless of network speed, and a splash screen that itself
// waits on an external image fetch defeats the point. Same NFC-wave mark
// used as the navbar's original icon (src/app/page.tsx's TapIcon).
function TapMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.5 12a7.5 7.5 0 0 1 7.5-7.5" />
      <path d="M7.3 12a4.7 4.7 0 0 1 4.7-4.7" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Preloader() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // One tick so the entrance transition (opacity/scale-in) actually
    // animates from its initial state instead of snapping in already-visible.
    const raf = requestAnimationFrame(() => setMounted(true));

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const holdMs = prefersReducedMotion ? 0 : HOLD_MS;
    const exitMs = prefersReducedMotion ? 0 : EXIT_MS;

    document.body.style.overflow = "hidden";
    const exitTimer = setTimeout(() => setExiting(true), holdMs);
    const removeTimer = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, holdMs + exitMs);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-brand-900 transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
        exiting ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 transition-all duration-500 ease-out ${
          mounted ? "scale-100 opacity-100" : "scale-75 opacity-0"
        } ${exiting ? "" : "animate-pulse-soft"}`}
      >
        <TapMark className="h-8 w-8 text-white" />
      </div>

      <span
        className={`text-sm font-semibold tracking-[0.2em] text-white/70 transition-all delay-150 duration-500 ease-out ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
      >
        KONEK+
      </span>

      <div className="h-0.5 w-24 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-accent-500 transition-[width] ease-linear ${
            mounted ? "w-full" : "w-0"
          }`}
          style={{ transitionDuration: `${HOLD_MS}ms` }}
        />
      </div>
    </div>
  );
}
