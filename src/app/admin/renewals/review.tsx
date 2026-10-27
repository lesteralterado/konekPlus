"use client";

import { useState, useTransition } from "react";
import { showToast } from "@/components/toast";
import { confirmRenewal, rejectRenewal, type RenewalResult } from "./actions";

const INPUT =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-base focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 md:text-sm";

// Confirm (with what actually arrived in GCash) or reject (with a reason the
// owner sees on their dashboard).
export function ReviewRenewal({ id, amountDue }: { id: string; amountDue: number }) {
  const [amount, setAmount] = useState(String(amountDue));
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<RenewalResult>, toast: string) {
    startTransition(async () => {
      const res = await action();
      setError(res.error);
      if (!res.error) showToast(toast);
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {rejecting ? (
        <>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            placeholder="What's wrong? e.g. No GCash payment with that reference"
            className={INPUT}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => rejectRenewal(id, reason), "Renewal rejected")}
              className="ios-press flex-1 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Working…" : "Reject"}
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="ios-press rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Received ₱
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              className={`${INPUT} w-24`}
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => confirmRenewal(id, amount), "Pro extended")}
            className="ios-press rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Working…" : "Confirm & extend Pro"}
          </button>
          <button
            type="button"
            onClick={() => setRejecting(true)}
            className="ios-press rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Reject
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
