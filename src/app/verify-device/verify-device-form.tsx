"use client";

import { useActionState } from "react";
import { type VerifyDeviceState, resendLoginPin, verifyDevicePin } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

const initialVerifyDeviceState: VerifyDeviceState = {
  error: null,
  resent: false,
};

export function VerifyDeviceForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(
    verifyDevicePin,
    initialVerifyDeviceState,
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendLoginPin,
    initialVerifyDeviceState,
  );

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
          className={inputClass}
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
      <form action={resendAction}>
        {resendState.resent ? (
          <p className="text-center text-sm text-slate-500">
            Code resent — check your email.
          </p>
        ) : (
          <button
            type="submit"
            disabled={resendPending}
            className="w-full text-center text-sm font-medium text-brand-700 hover:text-brand-800 disabled:opacity-60"
          >
            {resendPending ? "Sending…" : "Resend code"}
          </button>
        )}
        {resendState.error && (
          <p className="mt-1 text-center text-sm text-red-600">
            {resendState.error}
          </p>
        )}
      </form>
    </div>
  );
}
