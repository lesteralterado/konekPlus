"use client";

import { useActionState } from "react";
import { addTagByCode, type AddTagState } from "./actions";

const initialAddTagState: AddTagState = { error: null };

export function AddTagForm() {
  const [state, formAction, pending] = useActionState(
    addTagByCode,
    initialAddTagState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input
          name="tag_id"
          placeholder="Code printed on the card, e.g. 7fH3kNp"
          className="w-full rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        {state.error && (
          <p className="mt-1 text-sm text-red-600">{state.error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-3xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Linking…" : "Add card"}
      </button>
    </form>
  );
}
