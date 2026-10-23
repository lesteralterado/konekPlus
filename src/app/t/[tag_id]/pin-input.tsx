"use client";

import { useRef, useState } from "react";
import { format } from "@/lib/i18n/format";

const LENGTH = 6;

// Six one-digit boxes for the sleeve PIN: auto-advance, Backspace goes back,
// paste (or iOS SMS/one-time-code autofill) fills every box, and the form
// submits itself once all six are in. A hidden `pin` field carries the
// value, so the server action reads it exactly as before.
export function PinInput({
  name,
  digitLabel,
  disabled,
  invalid,
}: {
  name: string;
  digitLabel: string; // "Digit {n} of 6"
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const hiddenRef = useRef<HTMLInputElement>(null);

  function commit(next: string[], focusIndex: number) {
    setDigits(next);
    refs.current[Math.min(focusIndex, LENGTH - 1)]?.focus();
    if (next.every(Boolean)) {
      // Let the hidden input pick up the new value before submitting.
      requestAnimationFrame(() => hiddenRef.current?.form?.requestSubmit());
    }
  }

  function fill(from: number, text: string) {
    const incoming = text.replace(/\D/g, "").slice(0, LENGTH - from).split("");
    if (incoming.length === 0) return;
    const next = [...digits];
    incoming.forEach((d, i) => (next[from + i] = d));
    commit(next, from + incoming.length);
  }

  return (
    <div role="group" aria-label={format(digitLabel, { n: "1–6" })} className="flex justify-center gap-2">
      <input ref={hiddenRef} type="hidden" name={name} value={digits.join("")} />
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={i === 0}
          aria-label={format(digitLabel, { n: String(i + 1) })}
          aria-invalid={invalid || undefined}
          maxLength={LENGTH}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const v = e.currentTarget.value;
            if (v.replace(/\D/g, "").length > 1) {
              fill(i, v); // autofill / fast typing put several digits in one box
              return;
            }
            const digit = v.replace(/\D/g, "").slice(-1);
            const next = [...digits];
            next[i] = digit;
            commit(next, digit ? i + 1 : i);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              e.preventDefault();
              const next = [...digits];
              next[i - 1] = "";
              commit(next, i - 1);
            } else if (e.key === "ArrowLeft" && i > 0) {
              refs.current[i - 1]?.focus();
            } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
              refs.current[i + 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            fill(0, e.clipboardData.getData("text"));
          }}
          className={`size-12 rounded-xl border bg-white text-center font-mono text-2xl font-semibold text-brand-900 focus:outline-none focus:ring-2 disabled:opacity-60 sm:size-13 ${
            invalid
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-slate-200 focus:border-brand-500 focus:ring-brand-100"
          }`}
        />
      ))}
    </div>
  );
}
