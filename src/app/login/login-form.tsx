"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PasswordInput } from "@/components/password-input";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { type LoginState, login } from "./actions";

const initialLoginState: LoginState = { error: null };

// 16px on phones: below that, iOS Safari zooms the page when a field is focused.
const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 md:text-sm";

const labelClass = "block text-sm font-medium text-slate-700";

export function LoginForm({ next, t }: { next: string; t: Dictionary["auth"] }) {
  const [state, formAction, pending] = useActionState(login, initialLoginState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className={labelClass}>
          {t.emailLabel}
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t.emailPlaceholder}
          // Kept after a failed attempt (React clears the form otherwise).
          defaultValue={state.email ?? ""}
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="login-password" className={labelClass}>
            {t.passwordLabel}
          </label>
          <Link
            href="/forgot-password"
            className="-my-2 py-2 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            {t.forgot}
          </Link>
        </div>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          placeholder={t.passwordPlaceholder}
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
          required
          className={inputClass}
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {t.errors[state.error]}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-brand-600 px-4 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
