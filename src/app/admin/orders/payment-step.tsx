"use client";

import { useEffect, useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { copyText, showToast } from "@/components/toast";
import { formatPrice } from "@/lib/finishes";
import type { CardOrderStatus, PaidVia, PaymentMethod, PaymentStatus } from "@/lib/types";
import { BankIcon, CashIcon, CheckIcon, CopyIcon, TruckIcon, WalletIcon } from "../icons";
import { ConfirmButton } from "../ui/drawers";
import { ICON_ACTION } from "../ui/kit";
import {
  getProofUrl,
  markPaid,
  markRefunded,
  rejectProof,
  setAmountDue,
  undoPayment,
} from "./payment-actions";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  gcash: "GCash",
  cash: "Cash (meet-up)",
};

// How the money actually came in — can differ from the chosen method.
const VIA: { value: PaidVia; label: string; icon: typeof CashIcon }[] = [
  { value: "cash", label: "Cash", icon: CashIcon },
  { value: "gcash", label: "GCash", icon: WalletIcon },
  { value: "bank", label: "Bank", icon: BankIcon },
  { value: "courier", label: "Courier", icon: TruckIcon },
];

function defaultVia(method: PaymentMethod, status: PaymentStatus): PaidVia {
  if (method === "gcash") return "gcash";
  if (method === "cash") return "cash";
  return status === "with_courier" ? "courier" : "cash";
}

const FIELD =
  "h-12 w-full rounded-2xl bg-white px-4 text-base text-slate-800 ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

export type PaymentInfo = {
  orderId: string;
  reference: string;
  method: PaymentMethod;
  status: PaymentStatus;
  orderStatus: CardOrderStatus;
  amountDue: number;
  estimate: boolean;
  amountReceived: number | null;
  paidAt: string | null;
  paidVia: PaidVia | null;
  gcashRef: string | null;
  proofPath: string | null;
  proofAt: string | null;
  note: string | null;
};

// The payment button beside an order's next step, and the drawer it opens:
// verify GCash proof, mark paid / remittance received, or review & undo.
export function PaymentStep(p: PaymentInfo) {
  const [open, setOpen] = useState(false);
  if (p.status === "refunded" || (p.status === "unpaid" && p.orderStatus === "cancelled")) return null;

  const trigger =
    p.status === "proof_submitted"
      ? { label: "Verify payment", cls: "bg-amber-500 text-white" }
      : p.status === "with_courier"
        ? { label: "Remittance received", cls: "bg-sky-500 text-white" }
        : p.status === "paid"
          ? { label: `Paid ${formatPrice(p.amountReceived ?? p.amountDue)}`, cls: "bg-emerald-50 text-emerald-700" }
          : { label: "Mark paid", cls: "bg-white text-slate-700 ring-1 ring-slate-200" };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`ios-press flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold md:h-9 md:w-auto md:px-4 md:text-xs ${trigger.cls}`}
      >
        {p.status === "paid" && <CheckIcon className="size-4" />}
        {trigger.label}
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={`Payment · ${p.reference}`}
        closeLabel="Close"
        scopeClass="admin-ui"
      >
        {open && <PaymentDrawer {...p} onDone={() => setOpen(false)} />}
      </Sheet>
    </>
  );
}

function PaymentDrawer(p: PaymentInfo & { onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [via, setVia] = useState<PaidVia>(defaultVia(p.method, p.status));

  useEffect(() => {
    if (!p.proofPath) return;
    let alive = true;
    getProofUrl(p.proofPath).then((url) => alive && setProofUrl(url));
    return () => {
      alive = false;
    };
  }, [p.proofPath]);

  function run(action: () => Promise<{ error: string | null }>, toast: string) {
    startTransition(async () => {
      const res = await action();
      setError(res.error);
      if (!res.error) {
        showToast(toast);
        p.onDone();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* Amount due */}
      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200/70">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Amount due{p.estimate ? " · estimate" : ""}
          </p>
          <p className="text-2xl font-bold text-brand-900">{formatPrice(p.amountDue)}</p>
          <p className="text-xs text-slate-500">{METHOD_LABEL[p.method]}</p>
        </div>
        {p.status !== "paid" && (
          <button
            type="button"
            onClick={() => setEditingAmount((v) => !v)}
            className="text-sm font-semibold text-brand-700"
          >
            {editingAmount ? "Cancel" : "Edit"}
          </button>
        )}
      </div>
      {editingAmount && (
        <form
          action={(fd) =>
            run(() => setAmountDue(p.orderId, String(fd.get("amount") ?? "")), "Amount updated")
          }
          className="flex gap-2"
        >
          <input name="amount" inputMode="numeric" defaultValue={p.amountDue} aria-label="Amount due (₱)" className={FIELD} />
          <button type="submit" disabled={isPending} className="ios-press shrink-0 rounded-full bg-brand-900 px-5 font-semibold text-white disabled:opacity-60">
            Save
          </button>
        </form>
      )}

      {/* Customer's GCash proof */}
      {(p.gcashRef || p.proofPath) && p.status !== "paid" && (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Customer&apos;s proof
            {p.proofAt && ` · ${new Date(p.proofAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`}
          </p>
          {p.gcashRef && (
            <div className="mt-1 flex items-center gap-2">
              <p className="flex-1 font-mono text-lg font-semibold text-slate-800">{p.gcashRef}</p>
              <button
                type="button"
                onClick={() => copyText(p.gcashRef!, "Reference copied")}
                aria-label="Copy GCash reference"
                className={ICON_ACTION}
              >
                <CopyIcon className="size-4.5" />
              </button>
            </div>
          )}
          {p.proofPath &&
            (proofUrl ? (
              <a href={proofUrl} target="_blank" rel="noreferrer" className="mt-3 block">
                {/* Signed, short-lived URL to a private bucket — plain <img>
                    on purpose (next/image would try to cache/optimise it). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proofUrl} alt="GCash payment screenshot" className="max-h-80 w-full rounded-xl bg-slate-100 object-contain" />
              </a>
            ) : (
              <div className="mt-3 h-40 animate-pulse rounded-xl bg-slate-100" />
            ))}
          <p className="mt-2 text-xs text-slate-500">Check it matches a payment in your GCash history.</p>
        </div>
      )}

      {p.status === "paid" ? (
        <>
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">
            <p className="flex items-center gap-2 text-lg font-bold">
              <CheckIcon className="size-5" />
              Paid {formatPrice(p.amountReceived ?? p.amountDue)}
            </p>
            {p.paidAt && (
              <p className="text-sm">
                {new Date(p.paidAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
            {p.paidVia && (
              <p className="text-sm">via {VIA.find((v) => v.value === p.paidVia)?.label}</p>
            )}
            {p.gcashRef && <p className="font-mono text-sm">GCash ref {p.gcashRef}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ConfirmButton
              title="Undo payment?"
              message="Clears the paid record — use this if it was marked paid by mistake."
              confirmLabel="Undo payment"
              triggerLabel="Undo payment"
              triggerClassName="ios-press h-12 rounded-full bg-white text-[15px] font-semibold text-slate-600 ring-1 ring-slate-200"
              onConfirm={async () => {
                await undoPayment(p.orderId);
                showToast("Payment undone");
                p.onDone();
              }}
            >
              Undo
            </ConfirmButton>
            <ConfirmButton
              title="Mark refunded?"
              message="Use this after you've sent the money back to the customer."
              confirmLabel="Mark refunded"
              triggerLabel="Mark refunded"
              triggerClassName="ios-press h-12 rounded-full bg-white text-[15px] font-semibold text-red-600 ring-1 ring-red-200"
              onConfirm={async () => {
                await markRefunded(p.orderId, "");
                showToast("Marked refunded");
                p.onDone();
              }}
            >
              Refunded
            </ConfirmButton>
          </div>
        </>
      ) : rejecting ? (
        <form
          action={(fd) =>
            run(() => rejectProof(p.orderId, String(fd.get("reason") ?? "")), "Sent back to the customer")
          }
          className="flex flex-col gap-3"
        >
          <label className="text-sm font-medium text-slate-600" htmlFor="reject-reason">
            What&apos;s wrong? The customer sees this on the Track page.
          </label>
          <textarea
            id="reject-reason"
            name="reason"
            rows={3}
            required
            maxLength={300}
            placeholder="e.g. We can't find this reference — please check the number."
            className="w-full rounded-2xl bg-white px-4 py-3 text-base text-slate-800 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setRejecting(false)} className="ios-press h-12 rounded-full bg-white font-semibold text-slate-600 ring-1 ring-slate-200">
              Back
            </button>
            <button type="submit" disabled={isPending} className="ios-press h-12 rounded-full bg-red-500 font-semibold text-white disabled:opacity-60">
              Send back
            </button>
          </div>
        </form>
      ) : (
        <form
          action={(fd) =>
            run(
              () =>
                markPaid(
                  p.orderId,
                  String(fd.get("amount") ?? ""),
                  String(fd.get("ref") ?? ""),
                  via,
                ),
              p.status === "with_courier" ? "Remittance recorded" : "Marked paid",
            )
          }
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            {p.status === "with_courier" ? "Amount remitted (₱)" : "Amount received (₱)"}
            <input name="amount" inputMode="numeric" required defaultValue={p.amountDue} className={FIELD} />
          </label>
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-600">Received via</legend>
            <div className="grid grid-cols-4 gap-2">
              {VIA.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVia(value)}
                  aria-pressed={via === value}
                  className={`ios-press flex flex-col items-center gap-1 rounded-2xl py-2.5 text-xs font-semibold ${
                    via === value
                      ? "bg-brand-900 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200"
                  }`}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          {via === "gcash" && (
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              GCash reference (optional)
              <input name="ref" defaultValue={p.gcashRef ?? ""} maxLength={40} className={`${FIELD} font-mono`} />
            </label>
          )}
          <button type="submit" disabled={isPending} className="ios-press flex h-12.5 items-center justify-center gap-2 rounded-full bg-emerald-500 text-[17px] font-semibold text-white disabled:opacity-60">
            <CheckIcon className="size-5" />
            {isPending
              ? "Saving…"
              : p.status === "proof_submitted"
                ? "Confirm paid"
                : p.status === "with_courier"
                  ? "Remittance received"
                  : "Mark paid"}
          </button>
          {p.status === "proof_submitted" && (
            <button type="button" onClick={() => setRejecting(true)} className="ios-press h-12 rounded-full bg-white font-semibold text-red-600 ring-1 ring-red-200">
              Proof doesn&apos;t match
            </button>
          )}
        </form>
      )}

      {p.note && p.status !== "paid" && (
        <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">Last note to customer: {p.note}</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
