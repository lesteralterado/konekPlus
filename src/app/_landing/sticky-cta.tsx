"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// Phones only: keeps "order" one thumb-tap away once the hero's own CTA has
// scrolled off, and gets out of the way while the order form is on screen.
export function StickyCta({
  heroId,
  orderId,
  fromLabel,
  orderLabel,
}: {
  heroId: string;
  orderId: string;
  fromLabel: string;
  orderLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  const [heroVisible, setHeroVisible] = useState(true);
  const [orderVisible, setOrderVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    const order = document.getElementById(orderId);
    if (!hero || !order) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) setHeroVisible(entry.isIntersecting);
        if (entry.target === order) setOrderVisible(entry.isIntersecting);
      }
    });
    observer.observe(hero);
    observer.observe(order);
    return () => observer.disconnect();
  }, [heroId, orderId]);

  const show = !heroVisible && !orderVisible;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
          // right-20 leaves room for the floating Feedback button (bottom-5 right-5).
          className="fixed bottom-4 left-4 right-20 z-40 md:hidden"
        >
          <a
            href={`#${orderId}`}
            className="flex items-center justify-between gap-3 rounded-full bg-brand-900/90 py-2 pl-5 pr-2 text-white shadow-xl shadow-brand-900/30 ring-1 ring-white/10 backdrop-blur-xl"
          >
            <span className="text-sm font-semibold">{fromLabel}</span>
            <span className="rounded-full bg-accent-500 px-4 py-2 text-sm font-bold text-brand-900">
              {orderLabel}
            </span>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
