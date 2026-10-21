"use client";

import { useState, useTransition } from "react";
import { type AssignCardsResult, assignCards } from "./actions";

export function AssignCards({
  orderId,
  reference,
  quantity,
  assignedCodes,
}: {
  orderId: string;
  reference: string;
  quantity: number;
  assignedCodes: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AssignCardsResult | null>(null);

  if (result && result.error === null) {
    return (
      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm print:border-0 print:bg-white print:p-0">
        <p className="font-medium text-amber-800 print:text-black">
          {reference} · write these on the cards and sleeves. PINs are shown only once.
        </p>
        <table className="mt-2 w-full max-w-sm font-mono text-slate-800">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="pr-4">Card code</th>
              <th>PIN</th>
            </tr>
          </thead>
          <tbody>
            {result.cards.map((c) => (
              <tr key={c.tag_id}>
                <td className="pr-4">{c.tag_id}</td>
                <td>{c.pin}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          onClick={() => window.print()}
          className="mt-3 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-700 print:hidden"
        >
          Print slip
        </button>
      </div>
    );
  }

  if (assignedCodes.length > 0) {
    return (
      <p className="mt-2 text-xs text-slate-500">
        Cards assigned: <span className="font-mono">{assignedCodes.join(", ")}</span>
      </p>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => setResult(await assignCards(orderId, quantity)))
        }
        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
      >
        {isPending ? "Assigning…" : `Assign ${quantity} card${quantity === 1 ? "" : "s"} + PINs`}
      </button>
      {result && result.error !== null && (
        <p className="mt-1 text-xs text-red-600">{result.error}</p>
      )}
    </div>
  );
}
