"use client";

import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  type PanInfo,
} from "motion/react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Dictionary, UseCaseId } from "@/lib/i18n/dictionaries/types";
import { FINISH_STYLES } from "./card-deck";
import { QrIcon, TapIcon } from "./icons";

type Phase = "idle" | "connecting" | "profile" | "saved";
type Mode = "nfc" | "qr";

const USE_CASES: UseCaseId[] = ["realtor", "sales", "creative", "events", "business"];

const BANNER: Record<UseCaseId, string> = {
  realtor: "from-brand-600 to-brand-900",
  sales: "from-slate-600 to-slate-900",
  creative: "from-accent-500 to-rose-500",
  events: "from-violet-500 to-indigo-700",
  business: "from-amber-400 to-orange-600",
};

const SPRING = { type: "spring", stiffness: 170, damping: 22 } as const;
// How long the "reading" moment lasts before the profile opens.
const CONNECT_MS = { nfc: 900, qr: 1500 } as const;
// Roughly how long the card's glide onto the phone takes (SPRING).
const MOVE_MS = 500;

// Drag needs a precise pointer; on touch screens dragging would fight the
// page's own scrolling, so phones tap the card instead.
function useFinePointer() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(pointer: fine)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(pointer: fine)").matches,
    () => false,
  );
}

// Decorative QR for the back of the demo card — deterministic so server
// and client render the same pattern. Not scannable, and not meant to be.
const QR_SIZE = 21;
const QR_CELLS = (() => {
  let seed = 11;
  const random = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x > QR_SIZE - 9 && y < 8) || (x < 8 && y > QR_SIZE - 9);
  const cells: [number, number][] = [];
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      if (!inFinder(x, y) && random() > 0.5) cells.push([x, y]);
    }
  }
  return cells;
})();

function QrPattern({ className }: { className?: string }) {
  const finders: [number, number][] = [
    [0, 0],
    [QR_SIZE - 7, 0],
    [0, QR_SIZE - 7],
  ];
  return (
    <svg viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} shapeRendering="crispEdges" className={className} aria-hidden="true">
      {QR_CELLS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
      {finders.map(([x, y]) => (
        <g key={`f-${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} fill="currentColor" />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="white" />
          <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function TryIt({ t }: { t: Dictionary["home"]["tryIt"] }) {
  const reduceMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const [useCase, setUseCase] = useState<UseCaseId>("realtor");
  const [mode, setMode] = useState<Mode>("nfc");
  const [phase, setPhase] = useState<Phase>("idle");

  const cardRef = useRef<HTMLButtonElement>(null);
  const nfcSpotRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Card offset from its resting place, plus its flip (0 = front, 180 = QR side).
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateY = useMotionValue(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const profile = t.useCases[useCase];
  const canDrag = finePointer && !reduceMotion && mode === "nfc" && phase === "idle";

  function returnCard() {
    const transition = reduceMotion ? { duration: 0 } : SPRING;
    animate(x, 0, transition);
    animate(y, 0, transition);
    animate(rotateY, 0, transition);
  }

  function connect() {
    if (phase !== "idle") return;
    setPhase("connecting");

    if (!reduceMotion) {
      const card = cardRef.current?.getBoundingClientRect();
      const target = (mode === "nfc" ? nfcSpotRef : screenRef).current?.getBoundingClientRect();
      if (card && target) {
        // Measure from the card's resting place, wherever a drag left it.
        const restX = card.left + card.width / 2 - x.get();
        const restY = card.top + card.height / 2 - y.get();
        const targetY = mode === "nfc" ? target.top + target.height / 2 : target.top + target.height * 0.42;
        animate(x, target.left + target.width / 2 - restX, SPRING);
        animate(y, targetY - restY, SPRING);
        animate(rotateY, mode === "qr" ? 180 : 0, SPRING);
      }
    }

    // Timed, not chained to the card animation's promise: an animation that
    // gets interrupted never resolves, which would leave the demo stuck.
    timers.current.push(
      setTimeout(
        () => {
          setPhase("profile");
          // Lift the card away as the profile opens, like taking it off the phone.
          returnCard();
        },
        reduceMotion ? 0 : MOVE_MS + CONNECT_MS[mode],
      ),
    );
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const spot = nfcSpotRef.current?.getBoundingClientRect();
    const hit =
      spot &&
      info.point.x >= spot.left - 40 &&
      info.point.x <= spot.right + 40 &&
      info.point.y - window.scrollY >= spot.top - 40 &&
      info.point.y - window.scrollY <= spot.bottom + 40;
    // Next frame: Motion finishes its own drag-end handling first, which
    // would otherwise cancel the glide we start here.
    requestAnimationFrame(() => (hit ? connect() : returnCard()));
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("idle");
    returnCard();
  }

  function switchMode(next: Mode) {
    reset();
    setMode(next);
  }

  const titanium = FINISH_STYLES.titanium;

  return (
    <section id="try-it" className="scroll-mt-24 overflow-hidden bg-white py-20 sm:py-28">
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        {/* ---- Copy + controls ---- */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{t.kicker}</span>
          <h2 className="mt-4 text-3xl font-semibold text-balance text-brand-900 sm:text-4xl">{t.heading}</h2>
          <p className="mt-4 text-slate-500">{t.body}</p>

          <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-slate-400">{t.madeFor}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {USE_CASES.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={useCase === id}
                onClick={() => setUseCase(id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  useCase === id
                    ? "bg-brand-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.useCases[id].label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => switchMode(mode === "nfc" ? "qr" : "nfc")}
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900"
          >
            {mode === "nfc" ? <QrIcon className="h-4 w-4" /> : <TapIcon className="h-4 w-4" />}
            {mode === "nfc" ? t.qrToggle : t.nfcToggle}
          </button>
          <p className="mt-3 text-sm text-slate-400">{t.whereToTap}</p>
        </div>

        {/* ---- Stage: card + phone ---- */}
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-end lg:gap-12">
          <div className="flex flex-col items-center gap-3">
            <motion.button
              ref={cardRef}
              type="button"
              aria-label={t.tapHint}
              drag={canDrag}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              onTap={() => phase === "idle" && connect()}
              whileDrag={{ scale: 1.06, rotate: -4 }}
              // Scale, not y: y is driven by the glide onto the phone, and a
              // hover gesture on y resets it back to 0 mid-glide.
              whileHover={phase === "idle" ? { scale: 1.04 } : undefined}
              style={{ x, y, rotateY, transformPerspective: 800 }}
              className={`relative z-20 h-25 w-44 touch-none transform-3d ${
                canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
              }`}
            >
              {/* Front: the real Titanium finish */}
              <span
                className={`absolute inset-0 flex flex-col justify-between rounded-xl p-3 shadow-[0_18px_36px_-12px_rgba(0,0,0,0.45)] backface-hidden ${titanium.face}`}
                style={titanium.style}
              >
                <TapIcon className={`h-4 w-4 ${titanium.ink}`} />
                <span className={`text-left text-sm font-semibold ${titanium.ink}`}>konek+</span>
              </span>
              {/* Back: the QR fallback every card carries */}
              <span className="absolute inset-0 flex items-center justify-center gap-3 rounded-xl bg-white p-3 shadow-[0_18px_36px_-12px_rgba(0,0,0,0.45)] ring-1 ring-slate-200 backface-hidden transform-[rotateY(180deg)]">
                <QrPattern className="h-16 w-16 text-brand-900" />
                <span className="text-[10px] font-semibold leading-tight text-slate-500">
                  konek+
                  <br />
                  QR
                </span>
              </span>
            </motion.button>
            {/* Fixed height so swapping hint ↔ button doesn't shift layout. */}
            <div className="flex h-8 items-center">
              {phase === "profile" || phase === "saved" ? (
                <button
                  type="button"
                  onClick={reset}
                  className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  {t.tryAgain}
                </button>
              ) : (
                <span className="text-xs font-medium text-slate-400">
                  {phase === "idle" ? (canDrag ? t.dragHint : t.tapHint) : ""}
                </span>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="relative h-120 w-59 shrink-0 rounded-[2.6rem] bg-slate-900 p-2.5 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.5)] sm:h-127.5 sm:w-62.5">
            <div
              ref={screenRef}
              className="relative h-full w-full overflow-hidden rounded-4xl bg-linear-to-b from-slate-800 to-slate-950"
            >
              <div className="absolute left-1/2 top-2.5 z-30 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

              {mode === "nfc" ? (
                <>
                  {/* The NFC spot, near the top — where the antenna actually is. */}
                  <div
                    ref={nfcSpotRef}
                    className="absolute left-1/2 top-12 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full border-2 border-dashed border-white/30"
                  >
                    <TapIcon className="h-8 w-8 text-white/60" />
                    {phase === "connecting" &&
                      !reduceMotion &&
                      [0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="absolute inset-0 rounded-full border-2 border-accent-500"
                          initial={{ scale: 0.6, opacity: 0.8 }}
                          animate={{ scale: 2.2, opacity: 0 }}
                          transition={{ duration: 0.9, delay: i * 0.15, ease: "easeOut" }}
                        />
                      ))}
                  </div>
                  <p className="absolute inset-x-0 top-40 text-center text-xs font-medium text-white/50">
                    {t.holdNear}
                  </p>
                  <p className="absolute inset-x-0 top-56 text-center text-5xl font-light tracking-tight text-white/90">
                    9:41
                  </p>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                  {/* Camera viewfinder */}
                  <div className="relative h-40 w-40">
                    {["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map(
                      (pos) => (
                        <span key={pos} className={`absolute h-7 w-7 rounded-sm border-white ${pos}`} />
                      ),
                    )}
                    {phase === "connecting" && !reduceMotion && (
                      <motion.span
                        className="absolute inset-x-2 h-0.5 rounded-full bg-accent-500 shadow-[0_0_12px_2px_rgba(242,153,74,0.7)]"
                        initial={{ top: "8%" }}
                        animate={{ top: "92%" }}
                        transition={{ duration: 0.7, repeat: 1, repeatType: "reverse", ease: "easeInOut" }}
                      />
                    )}
                  </div>
                  <p className="mt-6 h-4 text-xs font-medium text-white/60">
                    {phase === "connecting" ? t.scanning : ""}
                  </p>
                </div>
              )}

              {/* The profile the other person sees — in a browser, no app. */}
              <AnimatePresence>
                {(phase === "profile" || phase === "saved") && (
                  <motion.div
                    key="profile"
                    initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
                    animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
                    transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 220, damping: 28 }}
                    className="absolute inset-0 z-20 flex flex-col bg-white"
                  >
                    <div className="flex h-12 shrink-0 items-end justify-center bg-slate-100 pb-1.5">
                      <span className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1">
                        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-slate-400" fill="currentColor" aria-hidden="true">
                          <path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z" />
                        </svg>
                        <span className="h-1.5 w-20 rounded-full bg-slate-200" />
                      </span>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={useCase}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="flex flex-1 flex-col"
                      >
                        <div className={`h-20 shrink-0 bg-linear-to-br ${BANNER[useCase]}`} />
                        <div className="-mt-9 flex flex-col items-center px-4 text-center">
                          <span className="flex h-18 w-18 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700 ring-4 ring-white">
                            {initials(profile.name)}
                          </span>
                          <p aria-live="polite" className="mt-2 text-base font-semibold text-brand-900">
                            {profile.name}
                          </p>
                          <p className="text-xs text-slate-500">{profile.role}</p>
                        </div>

                        <div className="mt-5 flex flex-col gap-2 px-4">
                          <button
                            type="button"
                            onClick={() => setPhase("saved")}
                            className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                              phase === "saved" ? "bg-emerald-500 text-white" : "bg-brand-900 text-white hover:bg-brand-700"
                            }`}
                          >
                            {phase === "saved" && (
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                <path d="m5 12 5 5L20 7" />
                              </svg>
                            )}
                            {phase === "saved" ? t.saved : t.saveContact}
                          </button>
                          <span className="rounded-full border border-slate-200 py-2.5 text-center text-sm font-semibold text-brand-900">
                            {profile.action}
                          </span>
                        </div>

                        <div className="mt-5 flex justify-center gap-2.5">
                          {["bg-sky-100", "bg-pink-100", "bg-blue-100", "bg-emerald-100"].map((c) => (
                            <span key={c} className={`h-8 w-8 rounded-full ${c}`} />
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
