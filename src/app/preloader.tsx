"use client";

import { useEffect, useRef, useState } from "react";
import { markPreloaderDone } from "@/lib/preloader-events";

// The first tap lands ~0.93s in (see .preloader-tap in globals.css); hold
// a little past that so its NFC rings visibly bloom before the lift.
const MIN_HOLD_MS = 1250;
// Never trap someone on a slow connection behind the splash.
const MAX_HOLD_MS = 3200;
const EXIT_MS = 800;
const REDUCED_EXIT_MS = 200;

// Inline, not the remote Cloudinary logo — the splash must render
// instantly regardless of network speed.
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
              — they should bloom out from behind the card. */}
          <div ref={cardRef} className="preloader-card-in relative">
            <div className="preloader-tap relative flex h-24 w-42 flex-col justify-between overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#17384f_0%,#0a1c29_100%)] p-4 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
              <TapMark className="h-6 w-6 text-accent-500" />
              <div className="flex items-end justify-between">
                <span className="text-sm font-semibold tracking-tight text-white/85">konek+</span>
                <span className="text-[9px] font-semibold tracking-[0.2em] text-white/30">NFC</span>
              </div>
              <span className="preloader-sheen" />
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
