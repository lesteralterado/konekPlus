"use client";

import { useState, useTransition } from "react";
import { copyText, showToast } from "@/components/toast";
import type { KeychainNfcStatus } from "@/lib/types";
import { CheckIcon, CloseIcon, CopyIcon, ExternalIcon, RotateIcon } from "../icons";
import { ConfirmButton } from "../ui/drawers";
import { CARD, ICON_ACTION } from "../ui/kit";
import { setItemNfcResult } from "./actions";

// One keychain to write with NFC Tools: the full clean link (tap to copy),
// a big Copy button, then report the test result — Works ✓ or Failed.
export function ProgramItem({
  itemId,
  orderId,
  icon,
  title,
  link,
  status,
  badge,
}: {
  itemId: string;
  orderId: string;
  icon: React.ReactNode;
  title: string;
  link: string;
  status: KeychainNfcStatus;
  badge: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const works = status === "tested";

  async function copy() {
    if (await copyText(link, "Link copied — paste it in NFC Tools")) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function report(result: "works" | "failed") {
    startTransition(async () => {
      await setItemNfcResult(itemId, orderId, result);
      showToast(result === "works" ? "Marked working" : "Marked failed — re-write it");
    });
  }

  return (
    <li className={`${CARD} flex flex-col gap-3 ${works ? "ring-emerald-200" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
          {icon}
        </span>
        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-800">{title}</p>
        {badge}
      </div>

      {/* The exact link that goes on the chip — shown in full; tap copies it. */}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className="ios-press rounded-2xl bg-slate-50 px-3.5 py-3 text-left font-mono text-[13px] leading-snug break-all text-slate-700 ring-1 ring-slate-200/70"
      >
        {link}
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className={`ios-press flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-semibold ${
            copied ? "bg-emerald-500 text-white" : "bg-brand-900 text-white"
          }`}
        >
          {copied ? <CheckIcon className="size-4.5" /> : <CopyIcon className="size-4.5" />}
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          aria-label="Open link to check it"
          title="Open link to check it"
          className={ICON_ACTION}
        >
          <ExternalIcon className="size-4.5" />
        </a>
      </div>

      {works ? (
        <div className="flex items-center gap-2">
          <p className="flex h-11 flex-1 items-center gap-2 rounded-full bg-emerald-50 px-4 text-[15px] font-semibold text-emerald-700">
            <CheckIcon className="size-4.5" />
            Works
          </p>
          <ConfirmButton
            title="Redo this keychain?"
            message="Puts it back to “pending” so you can write and test the chip again."
            confirmLabel="Redo"
            destructive={false}
            triggerLabel="Redo this keychain"
            onConfirm={() => setItemNfcResult(itemId, orderId, "reset")}
          >
            <RotateIcon className="size-4.5" />
          </ConfirmButton>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => report("works")}
            className="ios-press flex h-12 items-center justify-center gap-1.5 rounded-full bg-emerald-500 text-[15px] font-semibold text-white disabled:opacity-60"
          >
            <CheckIcon className="size-4.5" />
            Works
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => report("failed")}
            className="ios-press flex h-12 items-center justify-center gap-1.5 rounded-full bg-white text-[15px] font-semibold text-red-600 ring-1 ring-red-200 disabled:opacity-60"
          >
            <CloseIcon className="size-4.5" />
            Failed
          </button>
        </div>
      )}
    </li>
  );
}
