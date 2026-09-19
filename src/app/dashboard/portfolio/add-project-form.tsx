"use client";

import { useActionState } from "react";
import { addPortfolioItem, type PortfolioFormState } from "./actions";

const initialState: PortfolioFormState = { error: null, resetToken: 0 };

const inputClass =
  "w-full rounded-2xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

export function AddProjectForm() {
  const [state, formAction, pending] = useActionState(addPortfolioItem, initialState);

  return (
    <form
      action={formAction}
      key={state.resetToken}
      className="rounded-4xl bg-white p-6 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-8"
    >
      <h2 className="mb-4 text-lg font-semibold text-brand-900">
        Add a project
      </h2>
      <div className="flex flex-col gap-3">
        <input name="title" placeholder="Project title" required className={inputClass} />
        <textarea
          name="description"
          placeholder="Short description"
          rows={2}
          className={inputClass}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            name="project_url"
            placeholder="Project link (optional)"
            className={inputClass}
          />
          <input
            name="tech"
            placeholder="Tech / services used (optional)"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Image
          </label>
          <input
            name="image"
            type="file"
            accept="image/*"
            className="text-sm text-slate-600"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add project"}
        </button>
      </div>
    </form>
  );
}
