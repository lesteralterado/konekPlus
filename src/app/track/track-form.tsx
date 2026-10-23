"use client";

import { useActionState } from "react";
import { courierTrackingUrl } from "@/lib/couriers";
import { finishById, isFinishId } from "@/lib/finishes";
import { type TrackState, trackOrder } from "./actions";
import { PaymentPanel } from "./payment-panel";

const initialState: TrackState = { error: null, order: null };

const STEPS = ["Order received", "Confirmed", "Preparing", "Shipped", "Delivered"] as const;
// Cash orders are handed over in person — no shipping step.
const CASH_STEPS = ["Order received", "Confirmed", "Preparing", "Handed over"] as const;

const STEP_INDEX: Record<string, number> = {
  new: 0,
  contacted: 0,
  confirmed: 1,
  preparing: 2,
  shipped: 3,
  delivered: 4,
  fulfilled: 4,
};

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-PH", { dateStyle: "medium" }) : null;
}

export function TrackForm() {
  const [state, action, pending] = useActionState(trackOrder, initialState);
  const order = state.order;
  const isCash = order?.payment_method === "cash";
  const steps: readonly string[] = isCash ? CASH_STEPS : STEPS;
  const rawIndex = order ? (STEP_INDEX[order.status] ?? 0) : 0;
  // Delivered (4) is the last of the 4 cash steps (index 3).
  const current = isCash ? Math.min(rawIndex, 3) : rawIndex;
  const parcelUrl = order ? courierTrackingUrl(order.courier, order.tracking_number) : null;

  return (
    <div>
      <form action={action} className="flex flex-col gap-3">
        <input
          name="reference"
          placeholder="Order reference, e.g. KP-1A2B3C"
          autoCapitalize="characters"
          required
          className={inputClass}
        />
        <input
          name="phone"
          type="tel"
          placeholder="Mobile number you ordered with"
          autoComplete="tel"
          required
          className={inputClass}
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Looking…" : "Track my order"}
        </button>
      </form>

      {order && (
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]">
          <p className="font-semibold text-brand-900">
            {order.quantity} × {isFinishId(order.finish) ? finishById(order.finish).name : "card"}
          </p>
          <p className="text-xs text-slate-400">Ordered {formatDate(order.created_at)}</p>

          {order.status === "cancelled" ? (
            <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
              This order was cancelled. Message us if that is unexpected.
            </p>
          ) : (
            <ol className="mt-5 flex flex-col gap-3">
              {steps.map((label, i) => {
                const done = i <= current;
                return (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        done ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span
                      className={
                        i === current
                          ? "font-semibold text-brand-900"
                          : done
                            ? "text-slate-600"
                            : "text-slate-400"
                      }
                    >
                      {label}
                      {!isCash && i === 3 && formatDate(order.shipped_at)
                        ? ` · ${formatDate(order.shipped_at)}`
                        : ""}
                      {(isCash ? i === 3 : i === 4) && formatDate(order.delivered_at)
                        ? ` · ${formatDate(order.delivered_at)}`
                        : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {order.tracking_number && (
            <div className="mt-5 rounded-xl bg-brand-50/60 px-4 py-3 text-sm">
              <p className="text-slate-600">
                {order.courier}:{" "}
                <span className="font-mono font-semibold">{order.tracking_number}</span>
              </p>
              {parcelUrl && (
                <a
                  href={parcelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-medium text-brand-700 hover:underline"
                >
                  Track the parcel →
                </a>
              )}
            </div>
          )}

          <PaymentPanel
            key={`${state.reference}-${order.payment_status}`}
            order={order}
            reference={state.reference ?? ""}
            phone={state.phone ?? ""}
            gcash={state.gcash ?? null}
          />

          {order.status !== "cancelled" && current >= 3 && (
            <p className="mt-5 text-sm text-slate-500">
              When your card arrives, find the 6-digit PIN on its sleeve, tap the card with your
              phone, and enter the PIN to activate it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
