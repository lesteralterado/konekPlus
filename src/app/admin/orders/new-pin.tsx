"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { copyText } from "@/components/toast";
import { CopyIcon, KeyIcon } from "../icons";
import { resetCardPin } from "../tags/actions";

// Lost or smudged sleeve slip: generate a fresh PIN for an unclaimed card.
// Two steps in one drawer — confirm (the old PIN stops working), then the
// new PIN, shown once, big enough to copy onto a new sleeve.
export function NewPinButton({ tagId }: { tagId: string }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setPin(null);
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`New PIN for ${tagId}`}
        title="New PIN (lost slip)"
        aria-haspopup="dialog"
        className="ios-press grid size-11 shrink-0 place-items-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200"
      >
        <KeyIcon className="size-4.5" />
      </button>
      <Sheet open={open} onClose={close} title={`New PIN · ${tagId}`} closeLabel="Close" scopeClass="admin-ui">
        {pin ? (
          <div className="flex flex-col items-center gap-3 pb-2 text-center">
            <p className="text-sm text-slate-500">Write this on the new sleeve. It&apos;s shown only once.</p>
            <p className="font-mono text-5xl font-bold tracking-[0.2em] text-brand-900">{pin}</p>
            <div className="grid w-full grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => copyText(pin, "PIN copied")}
                className="ios-press flex h-12 items-center justify-center gap-2 rounded-full bg-white font-semibold text-slate-700 ring-1 ring-slate-200"
              >
                <CopyIcon className="size-4.5" />
                Copy
              </button>
              <button
                type="button"
                onClick={close}
                className="ios-press h-12 rounded-full bg-brand-900 font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-2">
            <p className="text-[15px] leading-relaxed text-slate-600">
              Generates a new 6-digit PIN for this card. The PIN on the old sleeve stops working.
              Only for cards that aren&apos;t activated yet.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await resetCardPin(tagId);
                  setError(res.error);
                  setPin(res.pin);
                })
              }
              className="ios-press h-12.5 rounded-full bg-brand-900 text-[17px] font-semibold text-white disabled:opacity-60"
            >
              {isPending ? "Generating…" : "Generate new PIN"}
            </button>
            <button
              type="button"
              onClick={close}
              className="ios-press h-12 rounded-full bg-white font-semibold text-slate-600 ring-1 ring-slate-200"
            >
              Cancel
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}
