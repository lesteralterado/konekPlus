"use client";

import { useState, useTransition } from "react";
import { copyText, showToast } from "@/components/toast";
import { COURIERS, courierTrackingUrl } from "@/lib/couriers";
import { markShipped } from "./actions";

// `stacked` = the phone drawer version: full-width 16px fields (no iOS
// zoom) and a big button. Inline (desktop) keeps the compact pill row.
//
// The shipping email goes to the CUSTOMER only, at the address on the order;
// the form says so, and the result afterwards says whether it really sent.
export function ShipOrder({
  orderId,
  email,
  customerName,
  reference,
  stacked = false,
  onDone,
}: {
  orderId: string;
  // The address on the order, or null if the customer didn't give one.
  email: string | null;
  customerName: string;
  // KP-XXXXXX, for the copyable message.
  reference: string;
  stacked?: boolean;
  onDone?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [courier, setCourier] = useState<string>(COURIERS[0].name);
  const [tracking, setTracking] = useState("");

  const field = stacked
    ? "h-12 w-full rounded-2xl bg-white px-4 text-base text-slate-800 ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
    : "rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400";

  // The same news as the email, for SMS or Messenger: for a customer with no
  // email, or one who'd rather hear it there.
  function copyMessage() {
    const number = tracking.trim();
    if (!number) {
      setError("Enter the tracking number first.");
      return;
    }
    setError(null);
    const link = courierTrackingUrl(courier, number);
    const text = [
      `Hi ${customerName}, your Konek+ order ${reference} is on its way via ${courier}.`,
      `Tracking number: ${number}`,
      link ? `Track the parcel: ${link}` : null,
      `Order status: ${window.location.origin}/track`,
      "",
      "When it arrives: find the 6-digit PIN on the sleeve it came in, tap the card on the back of your phone (or scan its QR code), and enter the PIN to set up your profile.",
    ]
      .filter((line) => line !== null)
      .join("\n");
    void copyText(text, "Message copied");
  }

  return (
    <form
      action={() =>
        startTransition(async () => {
          const res = await markShipped(orderId, courier, tracking);
          setError(res.error);
          if (res.error) return;

          // Say what really happened. A failed or missing email needs the
          // admin to message the customer, so those stay on screen longer.
          if (res.emailed === "sent") {
            showToast(`Shipped · emailed ${res.emailedTo}`);
          } else if (res.emailed === "failed") {
            showToast("Shipped, but the email didn't send — message the customer yourself", 6000);
          } else {
            showToast("Marked shipped — no email on this order, message the customer yourself", 5000);
          }
          onDone?.();
        })
      }
      className={stacked ? "flex flex-col gap-3" : "mt-3 flex flex-wrap items-center gap-2"}
    >
      <select
        name="courier"
        aria-label="Courier"
        value={courier}
        onChange={(e) => setCourier(e.target.value)}
        className={field}
      >
        {COURIERS.map((c) => (
          <option key={c.name}>{c.name}</option>
        ))}
      </select>
      <input
        name="tracking"
        required
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        placeholder="Tracking number"
        aria-label="Tracking number"
        autoCapitalize="characters"
        className={field}
      />

      {email ? (
        <p className="w-full text-sm text-slate-500">
          We&apos;ll email the tracking details to{" "}
          <strong className="break-all font-semibold text-slate-700">{email}</strong> (the customer,
          at the address on this order).
        </p>
      ) : (
        <p className="w-full rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No email on this order, so the customer won&apos;t be notified. Message them yourself with
          the tracking number.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={
          stacked
            ? "ios-press mt-1 h-12.5 rounded-full bg-brand-900 text-[17px] font-semibold text-white disabled:opacity-60"
            : "rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        }
      >
        {isPending ? "Saving…" : email ? "Mark shipped & email customer" : "Mark shipped"}
      </button>
      <button
        type="button"
        onClick={copyMessage}
        className={
          stacked
            ? "ios-press h-11 rounded-full bg-white text-[15px] font-semibold text-brand-700 ring-1 ring-slate-200"
            : "rounded-full px-2 py-1.5 text-xs font-medium text-brand-700 hover:underline"
        }
      >
        Copy message for SMS / Messenger
      </button>
      {error && <span className="w-full text-sm text-red-600">{error}</span>}
    </form>
  );
}
