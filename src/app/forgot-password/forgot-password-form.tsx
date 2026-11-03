"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { type ForgotPasswordState, requestPasswordReset } from "./actions";

// 16px on phones: below that, iOS Safari zooms the page when a field is focused.
const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 md:text-sm";

export function ForgotPasswordForm({ t }: { t: Dictionary["auth"] }) {
  const [state, formAction, pending] = useActionState<ForgotPasswordState, FormData>(
    requestPasswordReset,
    { status: "idle", error: null },
  );

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-lg bg-brand-50 px-4 py-4 text-sm text-brand-900">
        <p className="font-semibold">{t.reset.sentTitle}</p>
        <p className="mt-1 text-slate-600">{t.reset.sentBody}</p>
        <Link
          href="/login"
          className="mt-3 inline-block py-1 font-medium text-brand-700 hover:text-brand-800"
        >
          {t.reset.backToSignIn}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700">
          {t.emailLabel}
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t.emailPlaceholder}
          defaultValue={state.email ?? ""}
          required
          autoFocus
          className={inputClass}
        />
      </div>
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {t.reset.errors[state.error]}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-brand-600 px-4 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? t.reset.submitting : t.reset.submit}
      </button>
      <Link
        href="/login"
        className="py-2 text-center text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        {t.reset.backToSignIn}
      </Link>
    </form>
  );
}
