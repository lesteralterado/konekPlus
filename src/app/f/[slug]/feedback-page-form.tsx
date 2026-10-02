"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { StarIcon } from "@/app/dashboard/icons";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { submitFeedback, type FeedbackFormState } from "@/app/feedback-actions";

const initialState: FeedbackFormState = { error: null, resetToken: 0 };

const inputClass =
  "w-full rounded-2xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

function StarPicker({ name }: { name: string }) {
  const [value, setValue] = useState(0);
  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={value || ""} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setValue(value === n ? 0 : n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="p-0.5 text-accent-500 transition hover:scale-110"
        >
          <StarIcon filled={n <= value} className="h-6 w-6" />
        </button>
      ))}
    </div>
  );
}

export function FeedbackPageForm({
  slug,
  page,
  form,
}: {
  slug: string;
  page: Dictionary["feedbackPage"];
  form: Dictionary["feedbackWidget"];
}) {
  const [state, formAction, pending] = useActionState(submitFeedback, initialState);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const prevToken = useRef(initialState.resetToken);

  useEffect(() => {
    if (state.resetToken !== prevToken.current && !state.error) {
      setJustSubmitted(true);
    }
    prevToken.current = state.resetToken;
  }, [state.resetToken, state.error]);

  if (justSubmitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold text-brand-900">{form.thanksTitle}</h1>
        <p className="text-sm text-slate-600">{form.thanksBody}</p>
        <button
          type="button"
          onClick={() => setJustSubmitted(false)}
          className="rounded-full bg-brand-50 px-5 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          {form.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-900">{page.title}</h1>
      <p className="mt-1.5 text-sm text-slate-500">{page.subtitle}</p>

      <form
        action={formAction}
        key={state.resetToken}
        className="mt-6 flex flex-col gap-3"
      >
        {/* Honeypot — see src/app/feedback-actions.ts for why this field exists. */}
        <div className="absolute left-[-9999px]" aria-hidden="true">
          <label>
            Website
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <input type="hidden" name="page_path" value={`/f/${slug}`} />

        <select name="category" defaultValue="general" className={inputClass}>
          <option value="general">{form.categoryGeneral}</option>
          <option value="bug">{form.categoryBug}</option>
          <option value="feature">{form.categoryFeature}</option>
        </select>

        <textarea
          name="message"
          required
          rows={5}
          placeholder={form.messagePlaceholder}
          className={inputClass}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">{form.ratingLabel}</span>
          <StarPicker name="rating" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            {form.screenshotLabel}
          </label>
          <input
            name="screenshot"
            type="file"
            accept="image/*"
            className="text-xs text-slate-600"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 self-start rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? form.sending : form.submit}
        </button>
      </form>
    </div>
  );
}
