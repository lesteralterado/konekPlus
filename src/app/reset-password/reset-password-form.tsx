"use client";

import { useActionState } from "react";
import { PasswordInput } from "@/components/password-input";
import { type ResetPasswordState, resetPassword } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(
    resetPassword,
    { error: null },
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <PasswordInput
        name="password"
        placeholder="New password (min. 8 characters)"
        autoComplete="new-password"
        required
        minLength={8}
        autoFocus
        className={inputClass}
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
