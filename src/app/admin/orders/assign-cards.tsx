"use client";

import { useState, useTransition } from "react";
import { cardUrl } from "@/lib/card-link";
import { type AssignCardsResult, assignCards } from "./actions";
import { CardChips } from "./card-chips";

export function AssignCards({
  orderId,
  reference,
  quantity,
  assigned,
  origin,
}: {
  orderId: string;
  reference: string;
  quantity: number;
  assigned: { tagId: string; writtenAt: string | null; claimed: boolean }[];
  // SITE_URL — the domain written onto each chip (src/lib/card-link.ts).
  origin: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AssignCardsResult | null>(null);

  if (result && result.error === null) {
    return (
      <>
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm print:border-0 print:bg-white print:p-0">
          <p className="font-medium text-amber-800 print:text-black">
            {reference} · write the codes on the sleeves. PINs go on the sleeve only — never on
            the chip — and are shown only once.
          </p>
          <table className="mt-2 w-full font-mono text-slate-800">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pr-4">Card code</th>
                <th className="pr-4">PIN</th>
                <th className="hidden sm:table-cell">Link (on the chip)</th>
              </tr>
            </thead>
            <tbody>
              {result.cards.map((c) => (
                <tr key={c.tag_id}>
                  <td className="pr-4">{c.tag_id}</td>
                  <td className="pr-4">{c.pin}</td>
                  <td className="hidden break-all text-xs sm:table-cell">{cardUrl(origin, c.tag_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-3 h-11 rounded-full bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 md:h-auto md:py-1.5 md:text-xs print:hidden"
          >
            Print slip
          </button>
        </div>
        <div className="print:hidden">
          <CardChips
            origin={origin}
            cards={result.cards.map((c) => ({ tagId: c.tag_id, writtenAt: null, claimed: false }))}
          />
        </div>
      </>
    );
  }

  if (assigned.length > 0) {
    return <CardChips origin={origin} cards={assigned} />;
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => setResult(await assignCards(orderId, quantity)))
        }
        className="ios-press h-11 w-full rounded-full bg-slate-100 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60 md:h-auto md:w-auto md:py-1.5 md:text-xs md:font-medium"
      >
        {isPending ? "Assigning…" : `Assign ${quantity} card${quantity === 1 ? "" : "s"} + PINs`}
      </button>
      {result && result.error !== null && (
        <p className="mt-1 text-xs text-red-600">{result.error}</p>
      )}
    </div>
  );
}
