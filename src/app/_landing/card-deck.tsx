"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
} from "react";
import type { FinishId } from "@/lib/finishes";
import { whenPreloaderDone } from "@/lib/preloader-events";
import { announceFinishChoice } from "./choose-finish";
import { TapIcon } from "./icons";

export type DeckItem = {
  id: FinishId;
  name: string;
  price: string;
  tagline: string;
  description: string;
  popular: boolean;
};

type Labels = {
  hint: string;
  flipHint: string;
  flipBack: string;
  perCard: string;
  popular: string;
  chooseFinish: string;
};

type FinishStyle = {
  face: string;
  style?: CSSProperties;
  ink: string;
  muted: string;
  chip: string;
  // Peak opacity of the pointer-following light glare — highest on the
  // reflective finishes (metal, glass), lowest on matte black.
  glare: number;
};

// Also used by the order form's finish picker, so a finish looks the same
// wherever it's shown.
export const FINISH_STYLES: Record<FinishId, FinishStyle> = {
  obsidian: {
    face: "bg-[linear-gradient(135deg,#262a31_0%,#0c0d10_100%)] ring-1 ring-white/10",
    // Embossed: dark drop below, faint highlight above.
    ink: "text-white/90 [text-shadow:0_1px_0_rgba(0,0,0,0.7),0_-1px_0_rgba(255,255,255,0.08)]",
    muted: "text-white/45",
    chip: "bg-white/10 text-white",
    glare: 0.18,
  },
  frost: {
    // No backdrop-filter: Chrome drops it inside preserve-3d parents, so the
    // frosted look comes from layered translucent white instead.
    face: "bg-[linear-gradient(135deg,rgba(214,232,240,0.62)_0%,rgba(150,184,200,0.42)_100%)] ring-1 ring-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
    ink: "text-white",
    muted: "text-white/75",
    chip: "bg-white/25 text-white",
    glare: 0.45,
  },
  titanium: {
    face: "ring-1 ring-black/10",
    style: {
      backgroundImage:
        "repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 1px, rgba(0,0,0,0.04) 1px 2px, transparent 2px 4px), linear-gradient(135deg, #e6e9ec 0%, #a3abb4 35%, #eef0f2 55%, #8a939d 100%)",
    },
    ink: "text-slate-800",
    muted: "text-slate-600",
    chip: "bg-slate-900/10 text-slate-900",
    glare: 0.6,
  },
  linen: {
    face: "ring-1 ring-black/5",
    style: {
      backgroundImage:
        "repeating-linear-gradient(0deg, rgba(120,100,70,0.06) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(120,100,70,0.05) 0 1px, transparent 1px 3px), linear-gradient(135deg, #f8f3ea, #ebe2d2)",
    },
    // Letterpress: pressed into the paper, light catching the lower edge.
    ink: "text-stone-700 [text-shadow:0_1px_0_rgba(255,255,255,0.85)]",
    muted: "text-stone-500",
    chip: "bg-stone-800/10 text-stone-800",
    glare: 0.35,
  },
  aurora: {
    face: "finish-aurora",
    ink: "text-white",
    muted: "text-white/80",
    chip: "bg-white/20 text-white",
    glare: 0.3,
  },
};

const FAN_QUERY = "(min-width: 1024px)";

// The fan needs ~1000px; below that the deck becomes a swipeable row.
// Server snapshot assumes the fan; a phone re-renders to the row under the
// preloader, before anything is visible.
function useFanLayout() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(FAN_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(FAN_QUERY).matches,
    () => true,
  );
}

const SPRING = { type: "spring", stiffness: 190, damping: 22, mass: 0.9 } as const;
const TILT_SPRING = { stiffness: 220, damping: 20, mass: 0.6 };

function DeckCard({
  item,
  index,
  total,
  layout,
  entered,
  reduceMotion,
  labels,
}: {
  item: DeckItem;
  index: number;
  total: number;
  layout: "fan" | "row";
  entered: boolean;
  reduceMotion: boolean;
  labels: Labels;
}) {
  const style = FINISH_STYLES[item.id];
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [settled, setSettled] = useState(false);

  // Pointer position over the card, 0–1 on each axis (0.5 = centre).
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [11, -11]), TILT_SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-13, 13]), TILT_SPRING);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.9), transparent 55%)`;
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });

  const tiltEnabled = !reduceMotion;

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!tiltEnabled || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function handlePointerEnter(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    setHovered(true);
    if (tiltEnabled) glareOpacity.set(style.glare);
  }

  function handlePointerLeave() {
    setHovered(false);
    px.set(0.5);
    py.set(0.5);
    glareOpacity.set(0);
  }

  // Fan geometry: centre card on top, neighbours fanned out and dropped.
  const offset = index - (total - 1) / 2;
  const placement =
    layout === "fan"
      ? entered
        ? {
            x: `${offset * 84}%`,
            y: Math.abs(offset) * 16 + (hovered ? -22 : 0),
            rotate: hovered ? 0 : offset * 7,
            scale: hovered ? 1.08 : 1,
            opacity: 1,
          }
        : { x: "0%", y: 36, rotate: 0, scale: 0.94, opacity: 1 }
      : entered
        ? { x: "0%", y: hovered ? -8 : 0, rotate: 0, scale: 1, opacity: 1 }
        : { x: "0%", y: 24, rotate: 0, scale: 1, opacity: 0 };

  const placementTransition = reduceMotion
    ? { duration: 0 }
    : { ...SPRING, delay: settled ? 0 : index * 0.07 };

  return (
    <motion.div
      initial={false}
      animate={placement}
      transition={placementTransition}
      onAnimationComplete={() => entered && setSettled(true)}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={layout === "fan" ? "absolute left-1/2 top-4 -ml-30" : "relative"}
      style={{
        // Hovered, then flipped, cards come to the front so their face
        // (especially the details on the back) isn't hidden under a neighbour.
        zIndex:
          layout === "fan"
            ? hovered
              ? 50
              : flipped
                ? 40
                : 20 - Math.abs(offset) * 2
            : undefined,
      }}
    >
      <motion.div
        className="relative h-[137px] w-60 transform-3d"
        style={tiltEnabled ? { rotateX, rotateY, transformPerspective: 900 } : undefined}
      >
        <motion.button
          type="button"
          aria-pressed={flipped}
          aria-label={`${item.name}, ${item.price} ${labels.perCard}. ${flipped ? labels.flipBack : labels.flipHint}`}
          onClick={() => setFlipped((f) => !f)}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 18 }}
          className="relative block h-full w-full cursor-pointer rounded-2xl text-left outline-none transform-3d focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900"
        >
          {/* Front */}
          <span
            className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-[0_22px_44px_-14px_rgba(0,0,0,0.6)] backface-hidden ${style.face}`}
            style={style.style}
          >
            <span className="flex items-start justify-between">
              <TapIcon className={`h-5 w-5 ${style.ink}`} />
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.chip}`}>
                {item.price}
              </span>
            </span>
            <span className="flex items-end justify-between">
              <span className={`text-base font-semibold tracking-tight ${style.ink}`}>konek+</span>
              <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${style.muted}`}>
                {item.name}
              </span>
            </span>
          </span>

          {/* Back */}
          <span
            className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-[0_22px_44px_-14px_rgba(0,0,0,0.6)] backface-hidden transform-[rotateY(180deg)] ${style.face}`}
            style={style.style}
          >
            <span>
              <span className={`block text-[10px] font-semibold uppercase tracking-[0.18em] ${style.muted}`}>
                {item.tagline}
              </span>
              <span className={`block text-base font-semibold ${style.ink}`}>{item.name}</span>
            </span>
            <span className={`block text-[11px] leading-snug ${style.muted}`}>{item.description}</span>
            <span className="flex items-end justify-between">
              <span className={style.ink}>
                <span className="text-lg font-bold">{item.price}</span>{" "}
                <span className={`text-[10px] ${style.muted}`}>{labels.perCard}</span>
              </span>
              <span className={`text-[10px] ${style.muted}`}>{labels.flipBack}</span>
            </span>
          </span>
        </motion.button>

        {/* Light glare — sits just above both faces, so it follows the
            pointer whichever side is showing. */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl mix-blend-soft-light transform-[translateZ(1px)]"
          style={{ background: glareBackground, opacity: glareOpacity }}
        />

        {/* Outside the flip button, so it stays readable on both faces. */}
        {item.popular && (
          <span className="pointer-events-none absolute -top-2.5 left-4 rounded-full bg-accent-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-900 shadow-md transform-[translateZ(2px)]">
            {labels.popular}
          </span>
        )}
      </motion.div>

      {/* Sibling of the flip button rather than inside it — a link can't be
          nested in a <button>. Appears once the details are showing. */}
      <motion.a
        href="#order"
        onClick={() => announceFinishChoice(item.id)}
        tabIndex={flipped ? 0 : -1}
        aria-hidden={!flipped}
        initial={false}
        animate={{ opacity: flipped ? 1 : 0, y: flipped ? 0 : -8 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.25 }}
        className={`absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-500 px-4 py-1.5 text-xs font-semibold text-brand-900 shadow-lg transition-colors hover:bg-accent-500/90 ${
          flipped ? "" : "pointer-events-none"
        }`}
      >
        {labels.chooseFinish} · {item.price}
      </motion.a>
    </motion.div>
  );
}

export function CardDeck({ items, labels }: { items: DeckItem[]; labels: Labels }) {
  const reduceMotion = useReducedMotion() ?? false;
  const fan = useFanLayout();
  const [entered, setEntered] = useState(false);

  // Hold the fan-out until the preloader has lifted, so it's actually seen.
  useEffect(() => whenPreloaderDone(() => setEntered(true)), []);

  return (
    <div>
      {fan ? (
        <div className="relative mx-auto h-64 w-full max-w-5xl">
          {items.map((item, i) => (
            <DeckCard
              key={item.id}
              item={item}
              index={i}
              total={items.length}
              layout="fan"
              entered={entered}
              reduceMotion={reduceMotion}
              labels={labels}
            />
          ))}
        </div>
      ) : (
        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-14 pt-5 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {items.map((item, i) => (
            <div key={item.id} className="shrink-0 snap-center">
              <DeckCard
                item={item}
                index={i}
                total={items.length}
                layout="row"
                entered={entered}
                reduceMotion={reduceMotion}
                labels={labels}
              />
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-center text-xs text-white/55">{labels.hint}</p>
    </div>
  );
}
