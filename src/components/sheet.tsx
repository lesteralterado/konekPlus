"use client";

import { AnimatePresence, motion, useDragControls } from "motion/react";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { CloseIcon } from "@/app/dashboard/icons";
import { useIsClient } from "@/components/toast";

// iOS-style bottom sheet: springs up, dims the page, drag the grabber/header
// down (or tap outside / Escape / ✕) to dismiss. Portals to <body> because
// a transformed ancestor (e.g. the profile's .fade-up) would otherwise trap
// position:fixed. Shared by the public profile and the admin drawers.
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  scopeClass = "profile-ui",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  // Token scope (.profile-ui follows dark mode; .admin-ui is light-only).
  scopeClass?: string;
  children: React.ReactNode;
}) {
  const reduce = usePrefersReducedMotion();
  const isClient = useIsClient();
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  // Latest onClose without re-running the open/close effect (which moves
  // focus) every time a parent re-renders with a new inline callback.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={`${scopeClass} fixed inset-0 z-50`}>
          <motion.div
            aria-hidden="true"
            onClick={onClose}
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-ios-bg px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-ios-label shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.35)] outline-none sm:bottom-6 sm:rounded-[28px]"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={
              reduce ? { duration: 0.2 } : { type: "spring", stiffness: 380, damping: 36 }
            }
            drag={reduce ? false : "y"}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onClose();
            }}
          >
            {/* Drag handle area — only this starts a drag, so text fields
                and scrolling inside the sheet behave normally. */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="sticky top-0 z-10 -mx-5 touch-none bg-ios-bg px-5 pt-2"
            >
              <div className="mx-auto h-1.5 w-9 rounded-full bg-ios-label-3" />
              <div className="flex items-center justify-between py-3">
                <h2 className="text-[17px] font-semibold">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel}
                  className="ios-press grid h-8 w-8 place-items-center rounded-full bg-ios-fill text-ios-label-2"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
