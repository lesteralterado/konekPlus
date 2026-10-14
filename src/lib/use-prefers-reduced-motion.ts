"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

// Hydration-safe replacement for Motion's useReducedMotion(), which returns
// null on the server but true on the client's *first* render — so any
// component that renders differently under reduced motion hydrates against
// mismatched HTML. This reports false during hydration (matching the
// server render), then the real preference straight after.
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
