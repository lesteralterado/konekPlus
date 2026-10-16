"use client";

import { useActionState, useEffect, useState } from "react";
import { type VerifyDeviceState, resendLoginPin, verifyDevicePin } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

const initialVerifyDeviceState: VerifyDeviceState = {
  error: null,
  resent: false,
};

// Matches store_login_pin()'s cooldown (0009_device_verification.sql).
const COOLDOWN_MS = 60_000;

export function VerifyDeviceForm({
  next,
  startCooldown,
}: {
  next: string;
  // True when a code was just sent on the way here.
  startCooldown: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    verifyDevicePin,
    initialVerifyDeviceState,
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendLoginPin,
    initialVerifyDeviceState,
  );

  const [mountedAt] = useState(() => Date.now());
  const [now, setNow] = useState(mountedAt);
  const cooldownUntil = Math.max(
    startCooldown ? mountedAt + COOLDOWN_MS : 0,
    resendState.sentAt ? resendState.sentAt + COOLDOWN_MS : 0,
  );
  const secondsLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        <input
          name="pin"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="6-digit code"
          required
          autoFocus
          className={`${inputClass} text-center text-lg tracking-[0.4em]`}
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Verifying…" : "Verify"}
        </button>
      </form>
      <form action={resendAction} className="text-center">
        {resendState.resent && secondsLeft > 0 && (
          <p className="text-sm text-slate-500">New code sent — check your email.</p>
        )}
        <button
          type="submit"
          disabled={resendPending || secondsLeft > 0}
          className="text-sm font-medium text-brand-700 hover:text-brand-800 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {resendPending
            ? "Sending…"
            : secondsLeft > 0
              ? `Resend code in ${secondsLeft}s`
              : "Resend code"}
        </button>
        {resendState.error && (
          <p className="mt-1 text-sm text-red-600">{resendState.error}</p>
        )}
      </form>
    </div>
  );
}
