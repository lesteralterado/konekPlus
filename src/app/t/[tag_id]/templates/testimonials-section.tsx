"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CloseIcon, StarIcon } from "@/app/dashboard/icons";
import type { ProfileTestimonial } from "@/lib/types";
import { submitTestimonial, type TestimonialFormState } from "../actions";

const initialState: TestimonialFormState = { error: null, resetToken: 0 };

const inputClass =
  "w-full rounded-2xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-accent-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon key={i} filled={i < rating} className="h-3.5 w-3.5" />
      ))}
    </span>
  );
}

function StarPicker({ name }: { name: string }) {
  const [value, setValue] = useState(0);
  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={value || ""} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setValue(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="p-0.5 text-accent-500 transition hover:scale-110"
        >
          <StarIcon filled={n <= value} className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}

export function TestimonialsSection({
  profileId,
  ownerFirstName,
  items,
}: {
  profileId: string;
  ownerFirstName: string;
  items: ProfileTestimonial[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(submitTestimonial, initialState);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const prevToken = useRef(initialState.resetToken);

  useEffect(() => {
    if (state.resetToken !== prevToken.current && !state.error) {
      setJustSubmitted(true);
    }
    prevToken.current = state.resetToken;
  }, [state.resetToken, state.error]);

  if (items.length === 0) {
    return (
      <div className="mt-6 w-full text-left">
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="mx-auto block rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-brand-300 hover:text-brand-700"
        >
          Leave feedback for {ownerFirstName}
        </button>
        <TestimonialDialog
          dialogRef={dialogRef}
          profileId={profileId}
          formAction={formAction}
          state={state}
          pending={pending}
          justSubmitted={justSubmitted}
          onClose={() => setJustSubmitted(false)}
          onSubmitAnother={() => setJustSubmitted(false)}
        />
      </div>
    );
  }

  return (
    <div className="mt-6 w-full text-left">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Feedback
        </h2>
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="text-xs font-semibold text-brand-700 hover:text-brand-900"
        >
          Leave feedback
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700">
                {t.author_name || "Anonymous"}
              </span>
              <StarRow rating={t.rating} />
            </div>
            <p className="mt-1.5 text-sm text-slate-500">{t.message}</p>
          </div>
        ))}
      </div>
      <TestimonialDialog
        dialogRef={dialogRef}
        profileId={profileId}
        formAction={formAction}
        state={state}
        pending={pending}
        justSubmitted={justSubmitted}
        onClose={() => setJustSubmitted(false)}
        onSubmitAnother={() => setJustSubmitted(false)}
      />
    </div>
  );
}

function TestimonialDialog({
  dialogRef,
  profileId,
  formAction,
  state,
  pending,
  justSubmitted,
  onClose,
  onSubmitAnother,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  profileId: string;
  formAction: (formData: FormData) => void;
  state: TestimonialFormState;
  pending: boolean;
  justSubmitted: boolean;
  onClose: () => void;
  onSubmitAnother: () => void;
}) {
  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
      className="m-auto w-[92vw] max-w-sm rounded-3xl border-0 bg-transparent p-0 backdrop:bg-brand-900/40 backdrop:backdrop-blur-sm"
    >
      <div onClick={(e) => e.stopPropagation()} className="rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-brand-900">
            {justSubmitted ? "Thanks!" : "Leave feedback"}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {justSubmitted ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Thanks for the feedback — it&apos;ll show up here once they approve it.
            </p>
            <button
              type="button"
              onClick={onSubmitAnother}
              className="self-start rounded-full bg-brand-50 px-5 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              Leave another
            </button>
          </div>
        ) : (
          <form action={formAction} key={state.resetToken} className="flex flex-col gap-3">
            {/* Honeypot — see src/app/feedback-actions.ts for why this field exists. */}
            <div className="absolute left-[-9999px]" aria-hidden="true">
              <label>
                Website
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <input type="hidden" name="profile_id" value={profileId} />

            <input
              name="author_name"
              placeholder="Your name (optional)"
              className={inputClass}
            />
            <textarea
              name="message"
              required
              rows={3}
              placeholder="How was your experience?"
              className={inputClass}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Rating</span>
              <StarPicker name="rating" />
            </div>

            {state.error && <p className="text-sm text-red-600">{state.error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 self-start rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Sending…" : "Submit"}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
