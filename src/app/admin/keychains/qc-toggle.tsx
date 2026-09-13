"use client";

import { useTransition } from "react";
import { setItemQcPassed } from "./actions";

export function QcToggle({
  itemId,
  orderId,
  passed,
}: {
  itemId: string;
  orderId: string;
  passed: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setItemQcPassed(itemId, orderId, !passed))}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
        passed
          ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {isPending ? "…" : passed ? "QC passed" : "Mark QC passed"}
    </button>
  );
}
