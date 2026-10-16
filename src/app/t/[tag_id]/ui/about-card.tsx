"use client";

import { useState } from "react";
import { SectionHeader } from "./ios";

// Long bios clamp to 4 lines with an inline "more", like App Store
// descriptions, so the contact actions below stay close to the top.
const CLAMP_THRESHOLD = 200;

export function AboutCard({ heading, bio, moreLabel }: { heading: string; bio: string; moreLabel: string }) {
  const long = bio.length > CLAMP_THRESHOLD || bio.split("\n").length > 4;
  const [expanded, setExpanded] = useState(false);
  const clamped = long && !expanded;

  return (
    <section>
      <SectionHeader>{heading}</SectionHeader>
      <div className="rounded-[22px] bg-ios-surface px-4 py-3.5">
        <p
          className={`whitespace-pre-line text-[15px] leading-relaxed text-ios-label ${clamped ? "line-clamp-4" : ""}`}
        >
          {bio}
        </p>
        {clamped && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-1 text-[15px] font-semibold text-ios-tint"
          >
            {moreLabel}
          </button>
        )}
      </div>
    </section>
  );
}
