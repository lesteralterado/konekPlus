"use client";

import { useState, useTransition } from "react";
import { COURIERS } from "@/lib/couriers";
import { markShipped } from "./actions";

export function ShipOrder({ orderId, hasEmail }: { orderId: string; hasEmail: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
        })
      }
      className="mt-3 flex flex-wrap items-center gap-2"
    >
      <select
        name="courier"
        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600"
      >
        {COURIERS.map((c) => (
          <option key={c.name}>{c.name}</option>
        ))}
      </select>
      <input
        name="tracking"
        required
        placeholder="Tracking number"
        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {isPending ? "Saving…" : hasEmail ? "Mark shipped + email" : "Mark shipped"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
