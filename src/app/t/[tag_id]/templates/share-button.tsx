"use client";

import { useState } from "react";
import { ShareIcon } from "@/app/dashboard/icons";

export function ShareButton({
  title,
  className,
  iconOnly,
  label = "Share",
}: {
  title: string;
  className: string;
  iconOnly?: boolean;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url, title });
      } catch {
        // User cancelled the native share sheet — nothing more to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. no HTTPS/permission) — nothing more we can do silently.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={iconOnly ? (copied ? "Copied!" : label) : undefined}
      title={iconOnly ? (copied ? "Copied!" : label) : undefined}
      className={className}
    >
      {iconOnly && copied ? (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <ShareIcon className="h-[18px] w-[18px]" />
      )}
      {!iconOnly && (copied ? "Copied!" : label)}
    </button>
  );
}
