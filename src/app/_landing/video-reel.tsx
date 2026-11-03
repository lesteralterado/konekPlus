"use client";

import { useState } from "react";
import { FACEBOOK_REEL_URL } from "@/lib/constants";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

// The size Facebook's embed code gave for this reel (9:16, a phone-shaped
// player).
const WIDTH = 267;
const HEIGHT = 476;

// Facebook's own video-plugin address for the reel. autoplay: the visitor has
// just pressed play, so starting it is what they asked for.
const PLAYER_SRC = `https://www.facebook.com/plugins/video.php?${new URLSearchParams({
  height: String(HEIGHT),
  href: FACEBOOK_REEL_URL,
  show_text: "false",
  width: String(WIDTH),
  t: "0",
  autoplay: "true",
})}`;

// The short video, as a click-to-play card: nothing is loaded from Facebook
// until the visitor presses play. That keeps the page fast, and keeps visitors
// who just scroll past from being sent to Facebook (the privacy policy says
// so). After the tap it's Facebook's own player, exactly as embedded.
export function VideoReel({ t }: { t: Dictionary["home"]["reel"] }) {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="reel" className="scroll-mt-24 bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {t.kicker}
          </span>
          <h2 className="mt-4 text-3xl font-semibold leading-snug text-balance text-brand-900 sm:text-4xl">
            {t.heading}
          </h2>
          <p className="mt-5 text-slate-500">{t.body}</p>
        </div>

        <div className="flex flex-col items-center">
          <div
            className="overflow-hidden rounded-3xl bg-brand-900 shadow-xl ring-1 ring-slate-900/10"
            style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%" }}
          >
            {playing ? (
              <iframe
                src={PLAYER_SRC}
                width={WIDTH}
                height={HEIGHT}
                title={t.iframeTitle}
                style={{ border: "none", overflow: "hidden" }}
                scrolling="no"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={t.play}
                className="group flex h-full w-full flex-col items-center justify-center gap-4 bg-[linear-gradient(160deg,#17384f_0%,#0a1c29_100%)] text-white"
              >
                <span className="grid size-16 place-items-center rounded-full bg-white/15 ring-1 ring-white/30 transition group-hover:bg-white/25 group-active:scale-95">
                  <svg viewBox="0 0 24 24" className="ml-1 size-7 fill-current" aria-hidden="true">
                    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" />
                  </svg>
                </span>
                <span className="text-sm font-semibold tracking-wide">{t.play}</span>
              </button>
            )}
          </div>
          <p className="mt-3 max-w-[267px] text-center text-xs text-slate-400">{t.note}</p>
          {/* Always there, so the video can still be reached if Facebook
              won't play it in the embed. */}
          <a
            href={FACEBOOK_REEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-sm font-semibold text-brand-700 hover:underline"
          >
            {t.openOnFacebook} ↗
          </a>
        </div>
      </div>
    </section>
  );
}
