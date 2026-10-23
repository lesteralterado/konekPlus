"use client";

import { useActionState, useState } from "react";
import { PasswordInput } from "@/components/password-input";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { format } from "@/lib/i18n/format";
import { PinInput } from "./pin-input";
import {
  type ClaimState,
  linkExistingAndClaim,
  signUpAndClaim,
  type VerifyPinState,
  verifyTagPin,
} from "./actions";

const initialClaimState: ClaimState = { error: null };
const initialVerifyState: VerifyPinState = { error: null, verified: null };

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

function PinStep({
  tagId,
  dict,
  state,
  action,
  pending,
}: {
  tagId: string;
  dict: Dictionary["claimForm"];
  state: VerifyPinState;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="mb-3 text-center">
        <h1 className="text-2xl font-semibold text-brand-900">{dict.pinStepTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">{dict.pinStepBody}</p>
      </div>
      <input type="hidden" name="tag_id" value={tagId} />
      <PinInput name="pin" digitLabel={dict.pinDigit} disabled={pending} invalid={!!state.error} />
      <p className="text-center text-xs text-slate-500">{dict.pinHint}</p>
      {state.error && (
        <p role="alert" className="text-center text-sm text-red-600">
          {state.reason?.kind === "wrong" ? (
            state.reason.triesLeft <= 1 ? (
              dict.pinWrongLast
            ) : (
              format(dict.pinWrong, { n: String(state.reason.triesLeft) })
            )
          ) : state.reason?.kind === "locked" ? (
            format(dict.pinLocked, { m: String(state.reason.minutes) })
          ) : state.reason?.kind === "claimed" ? (
            <>
              {dict.pinClaimed}{" "}
              <a href="/login" className="font-semibold underline">
                {dict.pinLogin}
              </a>
            </>
          ) : (
            state.error
          )}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? dict.pinChecking : dict.pinContinue}
      </button>
      <p className="mt-2 text-center text-xs text-slate-400">{dict.pinNoSleeve}</p>
    </form>
  );
}

export function ClaimForm({
  tagId,
  needsPin,
  dict,
}: {
  tagId: string;
  needsPin: boolean;
  dict: Dictionary["claimForm"];
}) {
  const [tab, setTab] = useState<"new" | "existing">("new");
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyTagPin,
    initialVerifyState,
  );
  const verified = verifyState.verified;
  const [newState, newAction, newPending] = useActionState(
    signUpAndClaim,
    initialClaimState,
  );
  const [existingState, existingAction, existingPending] = useActionState(
    linkExistingAndClaim,
    initialClaimState,
  );

  // Cards that ship with a PIN start with a PIN step; the signup/login forms
  // only appear once it's accepted, prefilled from the order.
  if (needsPin && !verified) {
    return (
      <PinStep
        tagId={tagId}
        dict={dict}
        state={verifyState}
        action={verifyAction}
        pending={verifyPending}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-brand-900">{dict.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {verified ? dict.pinAccepted : dict.subtitle}
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
          {dict.tabNew}
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
          {dict.tabExisting}
        </button>
      </div>

      {tab === "new" ? (
        <form action={newAction} className="flex flex-col gap-3">
          <input type="hidden" name="tag_id" value={tagId} />
          {verified && <input type="hidden" name="pin" value={verified.pin} />}
          <input
            name="full_name"
            placeholder={dict.fullName}
            defaultValue={verified?.full_name ?? ""}
            required
            className={inputClass}
          />
          <input name="job_title" placeholder={dict.jobTitle} className={inputClass} />
          <input name="company" placeholder={dict.company} className={inputClass} />
          <input
            name="phone"
            type="tel"
            placeholder={dict.phone}
            defaultValue={verified?.phone ?? ""}
            className={inputClass}
          />
          <hr className="my-1 border-slate-100" />
          <input
            name="email"
            type="email"
            placeholder={dict.email}
            defaultValue={verified?.email ?? ""}
            required
            className={inputClass}
          />
          <PasswordInput
            name="password"
            placeholder={dict.passwordMin}
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
            {newPending ? dict.submitNewPending : dict.submitNew}
          </button>
        </form>
      ) : (
        <form action={existingAction} className="flex flex-col gap-3">
          <input type="hidden" name="tag_id" value={tagId} />
          {verified && <input type="hidden" name="pin" value={verified.pin} />}
          <input
            name="email"
            type="email"
            placeholder={dict.email}
            defaultValue={verified?.email ?? ""}
            required
            className={inputClass}
          />
          <PasswordInput
            name="password"
            placeholder={dict.password}
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
            {existingPending ? dict.submitExistingPending : dict.submitExisting}
          </button>
        </form>
      )}
    </div>
  );
}
