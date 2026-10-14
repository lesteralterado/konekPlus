"use client";

import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  Fragment,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

// Stacking only applies below Tailwind's md breakpoint; md+ keeps the
// caller's grid. Keep in sync with the max-md: classes below.
const STACK_QUERY = "(max-width: 767px)";

function useIsStackLayout() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(STACK_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(STACK_QUERY).matches,
    () => false,
  );
}

// Where the first card pins (clears the 64px compact nav), and how far
// each later card pins below the previous so the edges of the cards
// underneath stay visible, like a physical stack.
const PIN_TOP = 88;
const PIN_STEP = 14;

function StackItem({
  index,
  total,
  progress,
  animate,
  children,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  animate: boolean;
  children: ReactNode;
}) {
  // Each card shrinks and dims once per card that lands on top of it.
  const depth = total - 1 - index;
  const range = [index / total, 1];
  const scale = useTransform(progress, range, [1, 1 - depth * 0.05]);
  const brightness = useTransform(progress, range, [1, 1 - depth * 0.12]);
  const filter = useMotionTemplate`brightness(${brightness})`;

  return (
    <div
      // Layout is pure CSS (sticky), so it's right before hydration;
      // only the depth effect needs JS.
      className="max-md:sticky max-md:top-(--stack-top) max-md:mb-[18vh] max-md:last:mb-0 motion-reduce:static motion-reduce:mb-0"
      style={{ "--stack-top": `${PIN_TOP + index * PIN_STEP}px` } as CSSProperties}
    >
      <motion.div
        style={animate ? { scale, filter } : undefined}
        className="h-full origin-top rounded-3xl max-md:shadow-[0_-10px_40px_-18px_rgba(15,23,42,0.45)]"
      >
        {children}
      </motion.div>
    </div>
  );
}

// On phones, cards pin one after another and pile up as you scroll, each
// sliding over the last while the ones beneath recede. On md+ it's just
// the grid given in className.
export function StackedCards({
  children,
  className,
}: {
  children: ReactNode[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastSlotRef = useRef<HTMLDivElement>(null);
  const isStack = useIsStackLayout();
  const reduceMotion = useReducedMotion();
  const total = children.length;

  // Progress runs from "first card pins" to "last card pins" — i.e. while
  // the stack is being built. Read live each scroll frame so it never goes
  // stale when images above load and shift the layout. The end point uses
  // a non-sticky sentinel because a stuck element's own rect no longer
  // reports where it sits in the flow.
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, () => {
    const list = ref.current;
    const lastSlot = lastSlotRef.current;
    if (!list || !lastSlot) return 0;
    const listTop = list.getBoundingClientRect().top;
    const lastSlotOffset = lastSlot.getBoundingClientRect().top - listTop;
    const lastPinOffset = (total - 1) * PIN_STEP;
    const distance = Math.max(1, lastSlotOffset - lastPinOffset);
    return Math.min(1, Math.max(0, (PIN_TOP - listTop) / distance));
  });

  return (
    <div ref={ref} className={className}>
      {children.map((child, i) => (
        <Fragment key={i}>
          {i === total - 1 && <div ref={lastSlotRef} aria-hidden="true" className="md:hidden" />}
          <StackItem index={i} total={total} progress={progress} animate={isStack && !reduceMotion}>
            {child}
          </StackItem>
        </Fragment>
      ))}
      {/* Lets the finished stack rest for a beat before it scrolls away.
          Must be in-flow content (not padding): sticky children are
          bounded by the parent's content box. */}
      <div aria-hidden="true" className="h-[14vh] md:hidden motion-reduce:hidden" />
    </div>
  );
}
