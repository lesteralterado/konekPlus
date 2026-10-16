"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type ForgotPasswordState, requestPasswordReset } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ForgotPasswordState, FormData>(
    requestPasswordReset,
    { status: "idle", error: null },
  );

  if (state.status === "sent") {
    return (
      <div className="rounded-lg bg-brand-50 px-4 py-4 text-sm text-brand-900">
        <p className="font-semibold">Check your email</p>
        <p className="mt-1 text-slate-600">
          If an account exists for that address, we&apos;ve sent a link to reset your password. It
          can take a minute — check your spam folder too.
        </p>
        <Link href="/login" className="mt-3 inline-block font-medium text-brand-700 hover:text-brand-800">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Email"
        required
        autoFocus
        className={inputClass}
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <Link href="/login" className="text-center text-sm font-medium text-brand-700 hover:text-brand-800">
        ← Back to sign in
      </Link>
    </form>
  );
}
