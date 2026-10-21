"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { showToast } from "@/components/toast";
import type { CardOrderStatus } from "@/lib/types";
import { BoxIcon, CheckIcon, TruckIcon } from "../icons";
import { ORDER_STATUS } from "../ui/status";
import { setOrderStatus } from "./actions";
import { ShipOrder } from "./ship-order";

// The one thing to do next for an order, as a single big button — so the
// common path (new → contacted → confirmed → packing → shipped → delivered)
// is a tap each, without opening the status menu.
const NEXT: Partial<
  Record<CardOrderStatus, { to: CardOrderStatus; label: string; icon: typeof CheckIcon }>
> = {
  new: { to: "contacted", label: "Mark contacted", icon: CheckIcon },
  contacted: { to: "confirmed", label: "Confirm order", icon: CheckIcon },
  confirmed: { to: "preparing", label: "Start packing", icon: BoxIcon },
  preparing: { to: "shipped", label: "Ship", icon: TruckIcon },
  shipped: { to: "delivered", label: "Mark delivered", icon: CheckIcon },
};

export function NextStep({
  orderId,
  status,
  hasEmail,
}: {
  orderId: string;
  status: CardOrderStatus;
  hasEmail: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [shipOpen, setShipOpen] = useState(false);
  const step = NEXT[status];
  if (!step) return null;
  const Icon = step.icon;

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (step.to === "shipped") {
            setShipOpen(true);
            return;
          }
          startTransition(async () => {
            await setOrderStatus(orderId, step.to);
            showToast(`Marked ${ORDER_STATUS[step.to].label.toLowerCase()}`);
          });
        }}
        className="ios-press flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-900 text-[15px] font-semibold text-white disabled:opacity-60 md:h-9 md:w-auto md:px-4 md:text-xs"
      >
        <Icon className="size-4.5 md:size-4" />
        {isPending ? "Saving…" : step.label}
      </button>

      {step.to === "shipped" && (
        <Sheet
          open={shipOpen}
          onClose={() => setShipOpen(false)}
          title="Ship order"
          closeLabel="Close"
          scopeClass="admin-ui"
        >
          <div className="pb-2">
            <ShipOrder orderId={orderId} hasEmail={hasEmail} stacked onDone={() => setShipOpen(false)} />
          </div>
        </Sheet>
      )}
    </>
  );
}
