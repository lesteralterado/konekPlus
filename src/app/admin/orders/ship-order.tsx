"use client";

import { useState, useTransition } from "react";
import { showToast } from "@/components/toast";
import { COURIERS } from "@/lib/couriers";
import { markShipped } from "./actions";

// `stacked` = the phone drawer version: full-width 16px fields (no iOS
// zoom) and a big button. Inline (desktop) keeps the compact pill row.
export function ShipOrder({
  orderId,
  hasEmail,
  stacked = false,
  onDone,
}: {
  orderId: string;
  hasEmail: boolean;
  stacked?: boolean;
  onDone?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const field = stacked
    ? "h-12 w-full rounded-2xl bg-white px-4 text-base text-slate-800 ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
    : "rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400";

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const res = await markShipped(
            orderId,
            String(formData.get("courier") ?? ""),
            String(formData.get("tracking") ?? ""),
          );
          setError(res.error);
          if (!res.error) {
            showToast(hasEmail ? "Shipped · customer emailed" : "Marked shipped");
            onDone?.();
          }
        })
      }
      className={stacked ? "flex flex-col gap-3" : "mt-3 flex flex-wrap items-center gap-2"}
    >
      <select name="courier" aria-label="Courier" className={field}>
        {COURIERS.map((c) => (
          <option key={c.name}>{c.name}</option>
        ))}
      </select>
      <input
        name="tracking"
        required
        placeholder="Tracking number"
        aria-label="Tracking number"
        autoCapitalize="characters"
        className={field}
      />
      <button
        type="submit"
        disabled={isPending}
        className={
          stacked
            ? "ios-press mt-1 h-12.5 rounded-full bg-brand-900 text-[17px] font-semibold text-white disabled:opacity-60"
            : "rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        }
      >
        {isPending ? "Saving…" : hasEmail ? "Mark shipped + email" : "Mark shipped"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
