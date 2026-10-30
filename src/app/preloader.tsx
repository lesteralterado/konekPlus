"use client";

import { useEffect, useRef, useState } from "react";
import { PRELOADER_CARD_BACK_URL, PRELOADER_CARD_FRONT_URL } from "@/lib/constants";
import { markPreloaderDone } from "@/lib/preloader-events";

// The first tap lands ~0.93s in (see .preloader-tap in globals.css); hold
// a little past that so its NFC rings visibly bloom before the lift.
const MIN_HOLD_MS = 1250;
// Never trap someone on a slow connection behind the splash.
const MAX_HOLD_MS = 3200;
const EXIT_MS = 800;
const REDUCED_EXIT_MS = 200;

// One side of the card art. Same-origin and a few KB (see constants.ts), so
// the splash renders without waiting on a third party. The face's own dark
// gradient (.preloader-face) shows until the image decodes, so it's never
// blank.
function CardFace({
  src,
  className,
  children,
}: {
  src: string;
  // Must position the face (relative / absolute): children are placed inside it.
  className: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`preloader-face overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed local art, preloaded in layout.tsx; next/image adds nothing here */}
      <img
        src={src}
        alt=""
        width={720}
        height={411}
        decoding="sync"
        fetchPriority="high"
        draggable={false}
        className="block size-full object-cover"
      />
      {children}
    </div>
  );
}

const WORDMARK = "KONEK+".split("");

export function Preloader() {
  const [phase, setPhase] = useState<"holding" | "exiting" | "done">("holding");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => timers.push(setTimeout(resolve, Math.max(0, ms))));
    let cancelled = false;

    document.body.style.overflow = "hidden";

    const pageLoaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) =>
            window.addEventListener("load", () => resolve(), { once: true }),
          );
    // The minimum hold counts from when the CSS animation actually started
    // (first paint), not navigation start — first paint can land a second
    // in, and holding from t=0 would lift the overlay mid-animation. The
    // maximum stays anchored to navigation start: on a slow load, getting
    // out of the way beats finishing the flourish.
    const now = performance.now();
    const animationStart = Number(
      cardRef.current?.getAnimations()[0]?.startTime ?? now,
    );
    const minHold = wait(
      reduceMotion ? 0 : animationStart + MIN_HOLD_MS - now,
    );
    const maxHold = wait(MAX_HOLD_MS - now);

    Promise.race([Promise.all([pageLoaded, minHold]), maxHold]).then(() => {
      if (cancelled) return;
      setPhase("exiting");
      timers.push(
        setTimeout(
          () => {
            setPhase("done");
            document.body.style.overflow = "";
            markPreloaderDone();
          },
          reduceMotion ? REDUCED_EXIT_MS : EXIT_MS,
        ),
      );
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={`preloader fixed inset-0 z-100 flex items-center justify-center bg-brand-900 ${
        phase === "exiting" ? "preloader-exiting" : ""
      }`}
    >
      <div className="preloader-content flex flex-col items-center gap-10">
        <div className="relative perspective-midrange">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="preloader-ring"
              style={{ animationDelay: `${0.93 + i * 0.14}s` }}
            />
          ))}

          {/* Positioned so it paints above the absolutely-positioned rings
              — they should bloom out from behind the cards. */}
          <div ref={cardRef} className="preloader-card-in relative flex w-64 flex-col sm:w-80">
            {/* QR back on top, its lower edge tucked under the front — the
                overlap stops short of the name printed under the QR. */}
            <CardFace
              src={PRELOADER_CARD_BACK_URL}
              className="relative aspect-7/4 -translate-x-2 -rotate-3"
            />
            {/* NFC front: the one that taps. The tilts and offsets use the
                individual rotate/translate properties so they compose with
                the tap's transform instead of being replaced by it. */}
            <div className="preloader-tap relative -mt-[7%] aspect-7/4 translate-x-2 rotate-2">
              <CardFace src={PRELOADER_CARD_FRONT_URL} className="relative size-full">
                <span className="preloader-sheen" />
              </CardFace>
            </div>
          </div>
        </div>

        <span className="flex text-sm font-semibold tracking-[0.35em] text-white/70">
          {WORDMARK.map((letter, i) => (
            <span
              key={i}
              className="preloader-word"
              style={{ animationDelay: `${0.3 + i * 0.05}s` }}
            >
              {letter}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
