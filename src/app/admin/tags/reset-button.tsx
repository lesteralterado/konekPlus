"use client";

import { showToast } from "@/components/toast";
import { RotateIcon } from "../icons";
import { ConfirmButton } from "../ui/drawers";
import { resetTag } from "./actions";

// Unclaim a card. Confirmed in a drawer (not window.confirm) because it
// detaches the card from its owner.
export function ResetButton({ tagId, compact = false }: { tagId: string; compact?: boolean }) {
  return (
    <ConfirmButton
      title={`Reset ${tagId}?`}
      message="This unclaims the card and detaches it from its owner — they lose access until it's claimed again."
      confirmLabel="Reset card"
      triggerLabel={`Reset ${tagId}`}
      triggerClassName={
        compact
          ? "ios-press grid size-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-500"
          : "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
      }
      onConfirm={async () => {
        await resetTag(tagId);
        showToast("Card reset");
      }}
    >
      <RotateIcon className={compact ? "size-4.5" : "h-3.5 w-3.5"} />
      {!compact && "Reset"}
    </ConfirmButton>
  );
}
