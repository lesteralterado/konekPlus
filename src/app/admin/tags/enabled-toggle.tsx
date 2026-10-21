"use client";

import { useTransition } from "react";
import { showToast } from "@/components/toast";
import { PowerIcon } from "../icons";
import { setTagEnabled } from "./actions";

// `compact` (phones): a power icon whose colour is the state — green = live,
// grey = switched off. Tap flips it.
export function EnabledToggle({
  tagId,
  enabled,
  compact = false,
}: {
  tagId: string;
  enabled: boolean;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const label = enabled ? `Disable ${tagId}` : `Enable ${tagId}`;

  function toggle() {
    startTransition(async () => {
      await setTagEnabled(tagId, !enabled);
      showToast(enabled ? "Card disabled" : "Card enabled");
    });
  }

  if (compact) {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={toggle}
        aria-label={label}
        aria-pressed={enabled}
        title={label}
        className={`ios-press grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-50 ${
          enabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
        }`}
      >
        <PowerIcon className="size-4.5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 disabled:opacity-60"
    >
      {isPending ? "…" : enabled ? "Disable" : "Enable"}
    </button>
  );
}
