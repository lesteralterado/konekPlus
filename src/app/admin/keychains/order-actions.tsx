"use client";

import { useTransition } from "react";
import { openHandoverPhoto } from "../photos/handover-photo";
import { ConfirmButton } from "../ui/drawers";
import {
  markCompleted,
  markHandedOver,
  markReadyForHandover,
  markReadyForProgramming,
  verifyLinks,
} from "./actions";

// Full-width thumb-sized button on phones, compact pill from md up.
const buttonClass =
  "ios-press h-12 w-full rounded-full bg-brand-600 px-4 text-[15px] font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 md:h-auto md:w-auto md:py-2 md:text-xs";

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

  // Irreversible steps confirm in a drawer instead of window.confirm().
  if (confirmMessage) {
    return (
      <ConfirmButton
        title={label}
        message={confirmMessage}
        confirmLabel={label}
        destructive={false}
        triggerLabel={label}
        triggerClassName={buttonClass}
        onConfirm={onRun}
      >
        {label}
      </ConfirmButton>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(onRun)}
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
      onRun={async () => {
        await markHandedOver(orderId);
        // The customer is right there: offer the optional photo. The status
        // change unmounts this button, so the sheet lives in the admin layout.
        openHandoverPhoto({ kind: "keychain", orderId, customerName });
      }}
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
