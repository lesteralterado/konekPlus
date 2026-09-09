"use client";

import { useTransition } from "react";
import { setTagEnabled } from "./actions";

export function EnabledToggle({
  tagId,
  enabled,
}: {
  tagId: string;
  enabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await setTagEnabled(tagId, !enabled);
        });
      }}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 disabled:opacity-60"
    >
      {isPending ? "…" : enabled ? "Disable" : "Enable"}
    </button>
  );
}
