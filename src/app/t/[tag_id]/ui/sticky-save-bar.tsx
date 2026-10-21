"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { UserPlusIcon } from "./icons";
import { useIsClient } from "@/components/toast";

// Keeps the #1 action one tap away: once the main "Save to contacts"
// button (targetId) has scrolled up out of view, a slim glass bar pins it
// to the bottom. Hides again when the real button is back on screen.
export function StickySaveBar({
  targetId,
  href,
  name,
  avatarUrl,
  label,
}: {
  targetId: string;
  href: string;
  name: string;
  avatarUrl: string | null;
  label: string;
}) {
  const [show, setShow] = useState(false);
  const reduce = usePrefersReducedMotion();
  const isClient = useIsClient();

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      // Only once it's *above* the viewport — not before the visitor reaches it.
      setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          className="profile-ui pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 80 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 80 }}
          transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 380, damping: 32 }}
        >
          <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-full bg-ios-glass p-1.5 pl-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] ring-1 ring-ios-separator backdrop-blur-xl backdrop-saturate-150">
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-900 font-bold text-white">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" width={40} height={40} className="size-full object-cover" />
              ) : (
                name.slice(0, 1).toUpperCase()
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ios-label">
              {name}
            </span>
            <a
              href={href}
              className="ios-press flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ios-primary px-4 text-sm font-semibold text-ios-on-primary"
            >
              <UserPlusIcon className="size-4" />
              {label}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
