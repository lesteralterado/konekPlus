"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { copyText } from "@/components/toast";
import { CopyIcon, PlusIcon } from "../icons";
import { ICON_ACTION } from "./kit";

// Replaces window.confirm(): a bottom drawer with the consequence spelled out
// once, a big red (or brand) confirm, and an easy Cancel. The trigger is
// whatever the caller renders (usually an icon button).
export function ConfirmButton({
  title,
  message,
  confirmLabel,
  onConfirm,
  destructive = true,
  triggerLabel,
  triggerClassName = ICON_ACTION,
  children,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
  destructive?: boolean;
  triggerLabel: string;
  triggerClassName?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        aria-label={triggerLabel}
        title={triggerLabel}
        aria-haspopup="dialog"
        className={triggerClassName}
      >
        {children}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title} closeLabel="Cancel" scopeClass="admin-ui">
        <p className="text-[15px] leading-relaxed text-slate-600">{message}</p>
        <div className="mt-5 flex flex-col gap-2.5 pb-1">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await onConfirm();
                setOpen(false);
              })
            }
            className={`ios-press h-12.5 rounded-full text-[17px] font-semibold text-white disabled:opacity-60 ${
              destructive ? "bg-red-500" : "bg-brand-900"
            }`}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ios-press h-12.5 rounded-full bg-white text-[17px] font-semibold text-slate-600 ring-1 ring-slate-200"
          >
            Cancel
          </button>
        </div>
      </Sheet>
    </>
  );
}

// Floating "+" for the page's main create action (phones only); the form
// opens in a drawer. On md+ the page shows the form inline as before.
export function Fab({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        className="ios-press fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-30 grid size-14 place-items-center rounded-full bg-brand-900 text-white shadow-[0_10px_30px_-8px_rgba(11,43,60,0.6)] md:hidden"
      >
        <PlusIcon className="size-6" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={label} closeLabel="Close" scopeClass="admin-ui">
        <div className="pb-2">{children}</div>
      </Sheet>
    </>
  );
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => copyText(text, "Copied")}
      aria-label={label}
      title={label}
      className={ICON_ACTION}
    >
      <CopyIcon className="size-4.5" />
    </button>
  );
}
