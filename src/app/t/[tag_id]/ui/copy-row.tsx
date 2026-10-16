"use client";

import { useRef } from "react";
import { CopyIcon } from "./icons";
import { IconTile, RowBody } from "./ios";
import { copyText } from "./toast";

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 10;

// Contact row (phone/email) in the iOS Contacts style: small label over the
// value in the tint colour. Tap → call/mail. Press-and-hold, or the trailing
// copy button, copies the value — handy for pasting into Viber/Messenger.
export function CopyRow({
  href,
  label,
  value,
  icon,
  iconClassName,
  copyLabel,
  copiedLabel,
}: {
  href: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClassName: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  function cancel() {
    clearTimeout(timer.current);
    start.current = null;
  }

  return (
    <div className="group/row flex items-center pl-4 transition-colors duration-200 has-[a:active]:bg-ios-fill">
      <IconTile className={iconClassName}>{icon}</IconTile>
      <RowBody>
        <a
          href={href}
          className="flex min-w-0 flex-1 select-none flex-col py-2 [-webkit-touch-callout:none]"
          onPointerDown={(e) => {
            fired.current = false;
            start.current = { x: e.clientX, y: e.clientY };
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
              fired.current = true;
              void copyText(value, copiedLabel);
            }, LONG_PRESS_MS);
          }}
          onPointerMove={(e) => {
            const s = start.current;
            if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE) cancel();
          }}
          onPointerUp={cancel}
          onPointerLeave={cancel}
          onPointerCancel={cancel}
          onContextMenu={(e) => {
            if (fired.current) e.preventDefault();
          }}
          onClick={(e) => {
            // The hold already copied — don't also start a call.
            if (fired.current) {
              e.preventDefault();
              fired.current = false;
            }
          }}
        >
          <span className="text-[13px] leading-snug text-ios-label-2">{label}</span>
          <span className="truncate text-[17px] leading-snug text-ios-tint">{value}</span>
        </a>
        <button
          type="button"
          onClick={() => copyText(value, copiedLabel)}
          aria-label={`${copyLabel} ${label}`}
          title={copyLabel}
          className="ios-press mr-1.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ios-label-2 active:bg-ios-fill"
        >
          <CopyIcon className="size-4.5" />
        </button>
      </RowBody>
    </div>
  );
}
