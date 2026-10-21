"use client";

import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { CheckIcon } from "@/app/t/[tag_id]/ui/icons";

// Tiny module-level store so any island on the profile (copy rows, share
// sheet) can raise the same glass "Copied" pill without a context provider.
type Toast = { id: number; message: string } | null;

let current: Toast = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function showToast(message: string) {
  current = { id: Date.now(), message };
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    emit();
  }, 1800);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const subscribeNoop = () => () => {};

export function useIsClient() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

// Copies text, telling the visitor whether it worked. Returns false when
// the clipboard is blocked (no HTTPS / permission) so callers can stay quiet.
export async function copyText(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    navigator.vibrate?.(10);
    showToast(message);
    return true;
  } catch {
    return false;
  }
}

export function Toaster({ scopeClass = "profile-ui" }: { scopeClass?: string }) {
  const toast = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
  const reduce = usePrefersReducedMotion();
  const isClient = useIsClient();
  if (!isClient) return null;

  return createPortal(
    <div
      aria-live="polite"
      className={`${scopeClass} pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[60] flex justify-center px-4`}
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.92 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="flex items-center gap-2 rounded-full bg-ios-glass px-4 py-2.5 text-sm font-semibold text-ios-label shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] ring-1 ring-ios-separator backdrop-blur-xl backdrop-saturate-150"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-ios-tint text-white">
              <CheckIcon className="h-3 w-3" />
            </span>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
