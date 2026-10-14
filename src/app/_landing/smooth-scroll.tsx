"use client";

import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { useEffect, useState } from "react";
import { whenPreloaderDone } from "@/lib/preloader-events";

// Desktop wheel/trackpad only: Lenis leaves touch scrolling native by
// default (syncTouch: false), which is what we want on phones. Mounts only
// once the preloader has lifted, so wheel input during the splash can't
// scroll the hidden page underneath it.
export function SmoothScroll() {
  const reduceMotion = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => whenPreloaderDone(() => setReady(true)), []);

  if (reduceMotion || !ready) return null;

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        // Anchor targets clear the fixed nav via their own scroll-mt-*,
        // which Lenis honours — no extra offset needed here.
        anchors: true,
      }}
    />
  );
}
