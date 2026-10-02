"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CloseIcon, StarIcon } from "@/app/dashboard/icons";
import { submitFeedback, type FeedbackFormState } from "./feedback-actions";

const initialState: FeedbackFormState = { error: null, resetToken: 0 };

const inputClass =
  "w-full rounded-2xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-.9L3 20l1.4-5.5a8.5 8.5 0 0 1 16.6-3Z" />
    </svg>
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
          onClick={() => setValue(value === n ? 0 : n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="p-0.5 text-accent-500 transition hover:scale-110"
        >
          <StarIcon filled={n <= value} className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}

export function FeedbackWidget() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(submitFeedback, initialState);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const prevToken = useRef(initialState.resetToken);

  useEffect(() => {
    if (state.resetToken !== prevToken.current && !state.error) {
      setJustSubmitted(true);
    }
    prevToken.current = state.resetToken;
  }, [state.resetToken, state.error]);

  // /admin already has its own review screen, and /f/[slug] *is* a
  // dedicated full-page feedback form — the floating button would just
  // duplicate it on top of itself.
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/f/")) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand-900 px-4 py-3 text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700 active:scale-95"
      >
        <MessageIcon className="h-5 w-5" />
        <span className="hidden text-sm font-semibold sm:inline">Feedback</span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setJustSubmitted(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close();
        }}
        className="m-auto w-[92vw] max-w-sm rounded-3xl border-0 bg-transparent p-0 backdrop:bg-brand-900/40 backdrop:backdrop-blur-sm"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="rounded-3xl bg-white p-6 shadow-2xl"
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-900">
                {justSubmitted ? "Thanks!" : "Send feedback"}
              </h2>
              {!justSubmitted && (
                <p className="mt-0.5 text-xs text-slate-400">
                  Bugs, ideas, anything — we read every one.
                </p>
              )}
            </div>
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
                Your feedback was sent. We genuinely appreciate it.
              </p>
              <button
                type="button"
                onClick={() => setJustSubmitted(false)}
                className="self-start rounded-full bg-brand-50 px-5 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
              >
                Send another
              </button>
            </div>
          ) : (
            <form action={formAction} key={state.resetToken} className="flex flex-col gap-3">
              {/* Honeypot — hidden from real visitors via CSS, not `type="hidden"`,
                  since some bots skip inputs with type=hidden. */}
              <div className="absolute left-[-9999px]" aria-hidden="true">
                <label>
                  Website
                  <input name="website" type="text" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <input type="hidden" name="page_path" value={pathname ?? ""} />

              <select name="category" defaultValue="general" className={inputClass}>
                <option value="general">General feedback</option>
                <option value="bug">Something&apos;s broken</option>
                <option value="feature">Feature request</option>
              </select>

              <textarea
                name="message"
                required
                rows={4}
                placeholder="What's on your mind?"
                className={inputClass}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Rate your experience (optional)
                </span>
                <StarPicker name="rating" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Screenshot (optional)
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
                {pending ? "Sending…" : "Send feedback"}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
