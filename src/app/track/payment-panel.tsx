"use client";

import { useActionState, useState } from "react";
import { formatPrice } from "@/lib/finishes";
import { type GcashAccount, type ProofState, type TrackedOrder, submitPaymentProof } from "./actions";

const initialProof: ProofState = { error: null, sent: false };

const CONFIRMED = new Set(["confirmed", "preparing", "shipped", "delivered", "fulfilled"]);

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard blocked — the value is on screen to copy by hand.
        }
      }}
      className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// Payment section of the tracked order: what's owed and how to pay — and,
// for GCash, a form to send the payment proof (verified by a person).
export function PaymentPanel({
  order,
  reference,
  phone,
  gcash,
}: {
  order: TrackedOrder;
  reference: string;
  phone: string;
  gcash: GcashAccount;
}) {
  const [proof, proofAction, pending] = useActionState(submitPaymentProof, initialProof);
  if (order.status === "cancelled") return null;

  const confirmed = CONFIRMED.has(order.status) && order.amount_due_php !== null;
  const due = order.amount_due_php !== null ? formatPrice(order.amount_due_php) : null;
  const status = proof.sent ? "proof_submitted" : order.payment_status;

  if (status === "paid") {
    return (
      <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        ✓ Payment received{due ? ` · ${due}` : ""}. Thank you!
      </div>
    );
  }
  if (status === "refunded") {
    return (
      <div className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
        This payment was refunded.
      </div>
    );
  }
  if (!confirmed && CONFIRMED.has(order.status)) {
    // Confirmed before amounts were locked (orders older than 0020) — the
    // admin sets it from the payment drawer.
    return (
      <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        We&apos;re finalising your total — check back here soon to pay
        {order.payment_method === "gcash"
          ? " via GCash."
          : order.payment_method === "cash"
            ? " in cash when we meet."
            : ", or pay the courier on delivery."}
      </p>
    );
  }
  if (!confirmed) {
    return (
      <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        We&apos;ll confirm your order with you first — then you can pay
        {order.payment_method === "gcash"
          ? " via GCash right here."
          : order.payment_method === "cash"
            ? " in cash when we meet."
            : " the courier on delivery."}
      </p>
    );
  }
  if (order.payment_method === "cash") {
    return (
      <div className="mt-5 rounded-xl bg-brand-50/60 px-4 py-3 text-sm text-slate-700">
        Pay <strong className="text-brand-900">{due}</strong> in cash when we meet. We&apos;ll
        message you to agree on a time and place.
      </div>
    );
  }
  if (order.payment_method === "cod") {
    return (
      <div className="mt-5 rounded-xl bg-brand-50/60 px-4 py-3 text-sm text-slate-700">
        Amount to pay the courier on delivery: <strong className="text-brand-900">{due}</strong>
      </div>
    );
  }
  if (status === "proof_submitted") {
    return (
      <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="font-semibold">Payment proof sent ✓</p>
        <p>We&apos;ll check it against our GCash and confirm within a day.</p>
      </div>
    );
  }

  // Confirmed, unpaid GCash order.
  return (
    <div className="mt-5 rounded-2xl bg-brand-50/60 p-4">
      <p className="font-semibold text-brand-900">Pay with GCash</p>

      <div className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2">
          <span className="flex-1 text-slate-500">
            Amount <strong className="block text-lg text-brand-900">{due}</strong>
          </span>
          <CopyChip text={String(order.amount_due_php)} />
        </div>
        {gcash ? (
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2">
            <span className="flex-1 text-slate-500">
              Send to <strong className="block font-mono text-lg text-brand-900">{gcash.number}</strong>
              <span className="text-slate-600">{gcash.name}</span>
            </span>
            <CopyChip text={gcash.number.replace(/\s+/g, "")} />
          </div>
        ) : (
          <p className="rounded-xl bg-white px-3 py-2 text-slate-600">
            We&apos;ll message you our GCash number.
          </p>
        )}
      </div>

      {order.payment_note && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <strong>Please check:</strong> {order.payment_note}
        </p>
      )}

      <form action={proofAction} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="reference" value={reference} />
        <input type="hidden" name="phone" value={phone} />
        <p className="text-sm font-medium text-slate-700">After paying, send us your proof:</p>
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
        {proof.error && <p className="text-sm text-red-600">{proof.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send payment proof"}
        </button>
      </form>
    </div>
  );
}
