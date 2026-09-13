"use client";

import { useTransition } from "react";
import {
  markCompleted,
  markHandedOver,
  markReadyForHandover,
  markReadyForProgramming,
  verifyLinks,
} from "./actions";

const buttonClass =
  "rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60";

function ActionButton({
  label,
  pendingLabel,
  onRun,
  confirmMessage,
}: {
  label: string;
  pendingLabel: string;
  onRun: () => Promise<void>;
  confirmMessage?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirmMessage && !confirm(confirmMessage)) return;
        startTransition(onRun);
      }}
      className={buttonClass}
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}

export function VerifyLinksButton({ orderId }: { orderId: string }) {
  return (
    <ActionButton
      label="Verify links"
      pendingLabel="Verifying…"
      onRun={() => verifyLinks(orderId)}
    />
  );
}

export function MarkReadyForProgrammingButton({ orderId }: { orderId: string }) {
  return (
    <ActionButton
      label="Mark ready for programming"
      pendingLabel="Updating…"
      onRun={() => markReadyForProgramming(orderId)}
    />
  );
}

export function MarkReadyForHandoverButton({ orderId }: { orderId: string }) {
  return (
    <ActionButton
      label="Mark ready for handover"
      pendingLabel="Updating…"
      onRun={() => markReadyForHandover(orderId)}
    />
  );
}

export function HandoverButton({
  orderId,
  customerName,
}: {
  orderId: string;
  customerName: string;
}) {
  return (
    <ActionButton
      label="Release / Handover"
      pendingLabel="Releasing…"
      confirmMessage={`Confirm physical handover of all keychains to ${customerName}?`}
      onRun={() => markHandedOver(orderId)}
    />
  );
}

export function MarkCompletedButton({ orderId }: { orderId: string }) {
  return (
    <ActionButton
      label="Mark completed"
      pendingLabel="Updating…"
      onRun={() => markCompleted(orderId)}
    />
  );
}
