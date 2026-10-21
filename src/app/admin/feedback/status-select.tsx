"use client";

import { useOptimistic, useTransition } from "react";
import type { FeedbackStatus } from "@/lib/types";
import { FEEDBACK_STATUS, TONE_DOT, TONE_PILL } from "../ui/status";
import { setFeedbackStatus } from "./actions";

const STATUSES: FeedbackStatus[] = ["new", "reviewed", "resolved"];

// Desktop: compact select. Phones: a 3-way segmented control — one tap to
// move an entry along, current state filled in its colour.
export function FeedbackStatusSelect({ id, status }: { id: string; status: FeedbackStatus }) {
  const [isPending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(status);

  function change(next: FeedbackStatus) {
    if (next === shown) return;
    startTransition(async () => {
      setShown(next);
      await setFeedbackStatus(id, next);
    });
  }

  return (
    <>
      <select
        value={shown}
        disabled={isPending}
        onChange={(e) => change(e.target.value as FeedbackStatus)}
        className={`hidden shrink-0 rounded-full border-0 px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60 md:block ${TONE_PILL[FEEDBACK_STATUS[shown].tone]}`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {FEEDBACK_STATUS[s].label}
          </option>
        ))}
      </select>

      <div role="radiogroup" aria-label="Status" className="grid grid-cols-3 gap-1 rounded-full bg-slate-100 p-1 md:hidden">
        {STATUSES.map((s) => {
          const on = s === shown;
          const { tone, label } = FEEDBACK_STATUS[s];
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => change(s)}
              className={`ios-press flex h-9 items-center justify-center gap-1.5 rounded-full text-sm font-semibold ${
                on ? `bg-white shadow-sm ${TONE_PILL[tone].split(" ")[1]}` : "text-slate-500"
              }`}
            >
              <span className={`size-2 rounded-full ${on ? TONE_DOT[tone] : "bg-slate-300"}`} />
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}
