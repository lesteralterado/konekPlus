"use client";

import { useTransition } from "react";
import type { FeedbackStatus } from "@/lib/types";
import { setFeedbackStatus } from "./actions";

const STATUS_CLASS: Record<FeedbackStatus, string> = {
  new: "bg-amber-50 text-amber-700",
  reviewed: "bg-brand-50 text-brand-700",
  resolved: "bg-slate-100 text-slate-500",
};

export function FeedbackStatusSelect({
  id,
  status,
}: {
  id: string;
  status: FeedbackStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => setFeedbackStatus(id, e.target.value as FeedbackStatus))
      }
      className={`shrink-0 rounded-full border-0 px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60 ${STATUS_CLASS[status]}`}
    >
      <option value="new">New</option>
      <option value="reviewed">Reviewed</option>
      <option value="resolved">Resolved</option>
    </select>
  );
}
