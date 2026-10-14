"use client";

import { useActionState } from "react";
import { addTestimonial, type AddTestimonialState } from "./actions";

const INPUT =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export function AddTestimonialForm() {
  const [state, formAction, pending] = useActionState<AddTestimonialState, FormData>(
    addTestimonial,
    { error: null, resetToken: 0 },
  );

  return (
    // key resets the uncontrolled fields only after a successful add.
    <form key={state.resetToken} action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input name="author_name" required maxLength={80} placeholder="Customer name" className={INPUT} />
      <input name="author_role" maxLength={120} placeholder="Role, e.g. Realtor · Makati (optional)" className={INPUT} />
      <textarea
        name="quote"
        required
        maxLength={400}
        rows={3}
        placeholder="Their words, exactly as they agreed to be quoted"
        className={`${INPUT} sm:col-span-2`}
      />
      <div className="flex items-center gap-3 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Rating
          <select name="rating" defaultValue="5" className={`${INPUT} w-auto`}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} ★
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="ml-auto rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add (as draft)"}
        </button>
      </div>
      {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
    </form>
  );
}
