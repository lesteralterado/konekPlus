"use client";

import { useActionState, useState } from "react";
import { formatPrice } from "@/lib/finishes";
import type { GcashAccount } from "@/lib/gcash";
import { PRO_TERMS } from "@/lib/plan";
import type { ProTerm } from "@/lib/types";
import { submitRenewal, type RenewState } from "./renew-actions";

const initial: RenewState = { error: null, sent: false };

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

// Pay for Pro by GCash, then send the reference. Shown open when Pro is
// ending soon or already over; otherwise tucked behind "Renew Pro".
export function RenewPanel({
  gcash,
  pending,
  rejectedNote,
  open,
}: {
  gcash: GcashAccount;
  pending: boolean;
  rejectedNote: string | null;
  open: boolean;
}) {
  const [state, action, submitting] = useActionState(submitRenewal, initial);
  const [term, setTerm] = useState<ProTerm>("yearly");
  const price = PRO_TERMS[term].pricePhp;

  if (pending || state.sent) {
    return (
      <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="font-semibold">Renewal sent ✓</p>
        <p>We&apos;ll check it against our GCash and confirm within a day.</p>
      </div>
    );
  }

  return (
    <details open={open} className="group mt-4 rounded-2xl bg-brand-50/60 p-4">
      <summary className="cursor-pointer list-none font-semibold text-brand-900 marker:content-none">
        Renew Pro <span className="text-brand-500 group-open:hidden">→</span>
      </summary>

      {rejectedNote && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <strong>About your last payment:</strong> {rejectedNote}
        </p>
      )}

      <div role="radiogroup" aria-label="How long" className="mt-3 grid grid-cols-2 gap-2">
        {(Object.keys(PRO_TERMS) as ProTerm[]).map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={term === key}
            onClick={() => setTerm(key)}
            className={`rounded-xl px-3 py-2.5 text-left ring-1 transition ${
              term === key ? "bg-white ring-2 ring-brand-600" : "bg-white/60 ring-slate-200"
            }`}
          >
            <span className="block text-sm text-slate-500">{PRO_TERMS[key].label}</span>
            <span className="text-lg font-semibold text-brand-900">
              {formatPrice(PRO_TERMS[key].pricePhp)}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-slate-600">
        {gcash ? (
          <>
            Send <strong className="text-brand-900">{formatPrice(price)}</strong> by GCash to{" "}
            <strong className="font-mono text-brand-900">{gcash.number}</strong> ({gcash.name}), then
            send us the reference below.
          </>
        ) : (
          <>Message us for our GCash number, then send the reference below.</>
        )}{" "}
        Nothing renews automatically.
      </p>

      <form action={action} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="term" value={term} />
        <input
          name="gcash_ref"
          required
          maxLength={40}
          inputMode="numeric"
          placeholder="GCash reference no. (from your receipt)"
          className={`${inputClass} font-mono`}
        />
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Screenshot of the receipt (optional)
          <input
            name="screenshot"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700"
          />
        </label>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Sending…" : `I've paid ${formatPrice(price)} — send proof`}
        </button>
      </form>
    </details>
  );
}
