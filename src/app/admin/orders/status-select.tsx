"use client";

import { useTransition } from "react";
import type { CardOrderStatus } from "@/lib/types";
import { setOrderStatus } from "./actions";

const STATUS_CLASS: Record<CardOrderStatus, string> = {
  new: "bg-amber-50 text-amber-700",
  contacted: "bg-brand-50 text-brand-700",
  fulfilled: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
  confirmed: "bg-brand-50 text-brand-700",
  preparing: "bg-brand-50 text-brand-700",
  shipped: "bg-sky-50 text-sky-700",
  delivered: "bg-emerald-50 text-emerald-700",
};

export function OrderStatusSelect({ id, status }: { id: string; status: CardOrderStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => setOrderStatus(id, e.target.value as CardOrderStatus))
      }
      className={`shrink-0 rounded-full border-0 px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60 ${STATUS_CLASS[status]}`}
    >
      <option value="new">New</option>
      <option value="contacted">Contacted</option>
      <option value="confirmed">Confirmed</option>
      <option value="preparing">Preparing</option>
      <option value="shipped">Shipped</option>
      <option value="delivered">Delivered</option>
      <option value="fulfilled">Fulfilled (legacy)</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}
