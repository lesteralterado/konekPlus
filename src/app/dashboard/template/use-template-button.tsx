"use client";

import { useTransition } from "react";
import { setTemplate } from "./actions";

export function UseTemplateButton({
  template,
  isActive,
  locked = false,
}: {
  template: string;
  isActive: boolean;
  // A Pro style on a Basic plan: shown, not selectable.
  locked?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (isActive) {
    return (
      <span className="inline-flex w-full items-center justify-center rounded-full bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700">
        {locked ? "Saved — shows with Pro" : "Currently active"}
      </span>
    );
  }

  if (locked) {
    return (
      <span className="inline-flex w-full items-center justify-center rounded-full bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-500">
        Comes with Pro
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setTemplate(template))}
      className="inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
    >
      {isPending ? "Switching…" : "Use this style"}
    </button>
  );
}
