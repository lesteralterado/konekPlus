"use client";

import { useTransition } from "react";
import { resetTag } from "./actions";
import { RotateIcon } from "../icons";

export function ResetButton({ tagId }: { tagId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            `Unclaim "${tagId}"? This detaches it from its current owner — they'll lose access until it's claimed again.`,
          )
        ) {
          return;
        }
        startTransition(async () => {
          await resetTag(tagId);
        });
      }}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
    >
      <RotateIcon className="h-3.5 w-3.5" />
      {isPending ? "Resetting…" : "Reset"}
    </button>
  );
}
