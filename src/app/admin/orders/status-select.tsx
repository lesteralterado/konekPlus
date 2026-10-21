"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { showToast } from "@/components/toast";
import type { CardOrderStatus } from "@/lib/types";
import { CheckIcon } from "../icons";
import { ORDER_STATUS, StatusPill, TONE_DOT, TONE_PILL } from "../ui/status";
import { setOrderStatus } from "./actions";

const ORDER: CardOrderStatus[] = [
  "new",
  "contacted",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "fulfilled",
  "cancelled",
];

// Desktop: the compact select as before. Phones: the status pill itself is
// the control — tap it for a drawer of statuses (dot + word + ✓ on current).
export function OrderStatusSelect({ id, status }: { id: string; status: CardOrderStatus }) {
  const [isPending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(status);
  const [open, setOpen] = useState(false);

  function change(next: CardOrderStatus) {
    setOpen(false);
    if (next === shown) return;
    startTransition(async () => {
      setShown(next);
      await setOrderStatus(id, next);
      showToast(`Marked ${ORDER_STATUS[next].label.toLowerCase()}`);
    });
  }

  return (
    <>
      <select
        value={shown}
        disabled={isPending}
        onChange={(e) => change(e.target.value as CardOrderStatus)}
        className={`hidden shrink-0 rounded-full border-0 px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60 md:block ${TONE_PILL[ORDER_STATUS[shown].tone]}`}
      >
        {ORDER.map((s) => (
          <option key={s} value={s}>
            {s === "fulfilled" ? "Fulfilled (legacy)" : ORDER_STATUS[s].label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Status: ${ORDER_STATUS[shown].label}. Change`}
        aria-haspopup="dialog"
        className={`ios-press md:hidden ${isPending ? "opacity-60" : ""}`}
      >
        <StatusPill {...ORDER_STATUS[shown]} />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Status" closeLabel="Close" scopeClass="admin-ui">
        <div className="overflow-hidden rounded-[22px] bg-white">
          {ORDER.filter((s) => s !== "fulfilled" || shown === "fulfilled").map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => change(s)}
              className="ios-row group/row flex w-full items-center pl-4"
            >
              <span className={`size-3 shrink-0 rounded-full ${TONE_DOT[ORDER_STATUS[s].tone]}`} />
              <span className="ml-3 flex min-h-13 flex-1 items-center border-b border-slate-200/70 pr-4 text-left text-[17px] text-slate-800 group-last/row:border-b-0">
                <span className="flex-1">{ORDER_STATUS[s].label}</span>
                {s === shown && <CheckIcon className="size-5 text-brand-600" />}
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
