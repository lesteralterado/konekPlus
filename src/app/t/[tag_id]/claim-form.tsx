"use client";

import { useActionState, useState } from "react";
import {
  type ClaimState,
  linkExistingAndClaim,
  signUpAndClaim,
} from "./actions";

const initialClaimState: ClaimState = { error: null };

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export function ClaimForm({ tagId }: { tagId: string }) {
  const [tab, setTab] = useState<"new" | "existing">("new");
  const [newState, newAction, newPending] = useActionState(
    signUpAndClaim,
    initialClaimState,
  );
  const [existingState, existingAction, existingPending] = useActionState(
    linkExistingAndClaim,
    initialClaimState,
  );

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-brand-900">
          Welcome to your new card
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          This card hasn&apos;t been claimed yet. Set it up in a minute.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setTab("new")}
          className={`rounded-full py-2 transition ${
            tab === "new"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          This is my first card
        </button>
        <button
          type="button"
          onClick={() => setTab("existing")}
          className={`rounded-full py-2 transition ${
            tab === "existing"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          I have an account
        </button>
      </div>

      {tab === "new" ? (
        <form action={newAction} className="flex flex-col gap-3">
          <input type="hidden" name="tag_id" value={tagId} />
          <input
            name="full_name"
            placeholder="Full name"
            required
            className={inputClass}
          />
          <input name="job_title" placeholder="Job title" className={inputClass} />
          <input name="company" placeholder="Company" className={inputClass} />
          <input
            name="phone"
            type="tel"
            placeholder="Phone"
            className={inputClass}
          />
          <hr className="my-1 border-slate-100" />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className={inputClass}
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min. 8 characters)"
            required
            minLength={8}
            className={inputClass}
          />
          {newState.error && (
            <p className="text-sm text-red-600">{newState.error}</p>
          )}
          <button
            type="submit"
            disabled={newPending}
            className="mt-1 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {newPending ? "Setting up your card…" : "Create my profile"}
          </button>
        </form>
      ) : (
        <form action={existingAction} className="flex flex-col gap-3">
          <input type="hidden" name="tag_id" value={tagId} />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className={inputClass}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className={inputClass}
          />
          {existingState.error && (
            <p className="text-sm text-red-600">{existingState.error}</p>
          )}
          <button
            type="submit"
            disabled={existingPending}
            className="mt-1 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {existingPending ? "Linking this card…" : "Log in & link this card"}
          </button>
        </form>
      )}
    </div>
  );
}
