"use client";

import {
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { useRef } from "react";

type Beat = { title: string; body: string };
type Clip = { video: string; firstFrame: string; lastFrame: string };

// Scroll-progress windows per caption: [fade in from, fully in] plus an
// optional [fade out from, gone]. Timed to the clip — closed box, lid
// opening (~45–65%), then the card hero shot, whose caption stays to the
// end. All offsets must stay within 0–1: Motion runs these on the native
// Web Animations engine, which throws on anything outside that range.
const BEAT_WINDOWS: readonly (readonly number[])[] = [
  [0.02, 0.1, 0.28, 0.36],
  [0.4, 0.48, 0.64, 0.72],
  [0.78, 0.86],
];

// Feathers the video's edges into the section background so it reads as
// part of the page rather than a pasted-in rectangle.
const FEATHER = "[mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_78%)]";

function Caption({
  progress,
  window,
  beat,
}: {
  progress: MotionValue<number>;
  window: readonly number[];
  beat: Beat;
}) {
  const fadesOut = window.length === 4;
  const opacity = useTransform(progress, [...window], fadesOut ? [0, 1, 1, 0] : [0, 1]);
  const y = useTransform(progress, [...window], fadesOut ? [28, 0, 0, -28] : [28, 0]);
  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-x-0 bottom-[9vh] mx-auto max-w-xl px-6 text-center"
    >
      <h3 className="text-3xl font-semibold tracking-tight text-white text-balance sm:text-5xl">
        {beat.title}
      </h3>
      <p className="mt-3 text-balance text-white/60 sm:text-lg">{beat.body}</p>
    </motion.div>
  );
}

function StaticUnboxing({ clip, kicker, beats }: { clip: Clip; kicker: string; beats: Beat[] }) {
  return (
    <section data-nav-theme="dark" className="bg-[#0e1114] px-6 py-20 sm:py-28">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-white/50">
        {kicker}
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary-transformed still; next/image adds nothing here */}
      <img
        src={clip.lastFrame}
        alt=""
        className={`mx-auto mt-8 aspect-3/2 w-full max-w-4xl object-cover ${FEATHER}`}
      />
      <div className="mx-auto mt-10 grid max-w-5xl gap-8 text-center sm:grid-cols-3">
        {beats.map((beat) => (
          <div key={beat.title}>
            <h3 className="text-xl font-semibold text-white">{beat.title}</h3>
            <p className="mt-2 text-sm text-white/60">{beat.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Unboxing(props: { clip: Clip; kicker: string; beats: Beat[] }) {
  const reduceMotion = usePrefersReducedMotion();
  return reduceMotion ? <StaticUnboxing {...props} /> : <PinnedUnboxing {...props} />;
}

// Its own component so the scroll tracker only exists while this version is
// mounted — swapping to the static version unmounts it cleanly.
function PinnedUnboxing({ clip, kicker, beats }: { clip: Clip; kicker: string; beats: Beat[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTime = useRef(0);

  // Start fetching the clip about a screen before the section arrives.
  const near = useInView(sectionRef, { margin: "100% 0px", once: true });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.25], [0.86, 1]);
  const kickerOpacity = useTransform(scrollYProgress, [0, 0.08, 0.9, 1], [0, 1, 1, 0.6]);

  // One seek in flight at a time; the latest scroll position wins once it
  // lands. Assigning currentTime on every scroll event queues dozens of
  // seeks and makes the scrub lag behind the wheel.
  function seekToTarget() {
    const video = videoRef.current;
    if (!video || !video.duration || video.seeking) return;
    if (Math.abs(video.currentTime - targetTime.current) > 0.02) {
      video.currentTime = targetTime.current;
    }
  }

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const duration = videoRef.current?.duration;
    if (!duration) return;
    targetTime.current = Math.min(p * duration, duration - 0.05);
    seekToTarget();
  });

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    // iOS Safari won't paint seeked frames of a video that has never
    // played; a muted play/pause "primes" it without visible playback.
    video
      .play()
      .then(() => video.pause())
      .catch(() => {})
      .finally(() => {
        targetTime.current = Math.min(
          scrollYProgress.get() * video.duration,
          video.duration - 0.05,
        );
        seekToTarget();
      });
  }

  return (
    <section ref={sectionRef} data-nav-theme="dark" className="relative h-[260vh] bg-[#0e1114]">
      {/* Blends in from the hero's brand navy above. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] bg-linear-to-b from-brand-900 to-transparent" />

      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        <motion.p
          style={{ opacity: kickerOpacity }}
          className="absolute top-24 text-xs font-semibold uppercase tracking-wide text-white/50"
        >
          {kicker}
        </motion.p>

        <motion.div
          style={{ scale }}
          className={`relative aspect-3/2 w-[min(100%,calc(72vh*1.5))] ${FEATHER}`}
        >
          <video
            ref={videoRef}
            src={near ? clip.video : undefined}
            poster={clip.firstFrame}
            muted
            playsInline
            preload={near ? "auto" : "none"}
            onLoadedMetadata={handleLoadedMetadata}
            onSeeked={seekToTarget}
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
        </motion.div>

        {beats.map((beat, i) => (
          <Caption key={beat.title} progress={scrollYProgress} window={BEAT_WINDOWS[i]} beat={beat} />
        ))}
      </div>
    </section>
  );
}
