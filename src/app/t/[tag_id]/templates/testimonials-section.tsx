"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { StarIcon } from "@/app/dashboard/icons";
import type { ProfileTestimonial } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { format } from "@/lib/i18n/format";
import { submitTestimonial, type TestimonialFormState } from "../actions";
import { GroupedList, IconTile, RowBody, RowText, SectionHeader } from "../ui/ios";
import { Sheet } from "../ui/sheet";

const initialState: TestimonialFormState = { error: null, resetToken: 0 };

// 17px text: iOS Safari zooms the page when focusing inputs under 16px.
const inputClass =
  "w-full rounded-xl bg-ios-surface px-4 py-3 text-[17px] text-ios-label placeholder:text-ios-label-3 focus:outline-none focus:ring-2 focus:ring-ios-tint/40";

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-accent-500" aria-label={`${rating}/5`}>
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
          aria-pressed={n <= value}
          className="ios-press p-1 text-accent-500"
        >
          <StarIcon filled={n <= value} className="h-6 w-6" />
        </button>
      ))}
    </div>
  );
}

export function TestimonialsSection({
  profileId,
  ownerFirstName,
  items,
  dict,
}: {
  profileId: string;
  ownerFirstName: string;
  items: ProfileTestimonial[];
  dict: Dictionary["profile"];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(submitTestimonial, initialState);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const prevToken = useRef(initialState.resetToken);

  useEffect(() => {
    if (state.resetToken !== prevToken.current && !state.error) {
      setJustSubmitted(true);
    }
    prevToken.current = state.resetToken;
  }, [state.resetToken, state.error]);

  function close() {
    setOpen(false);
    setJustSubmitted(false);
  }

  const leaveRow = (
    <GroupedList>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="ios-row group/row flex w-full items-center pl-4"
      >
        <IconTile className="bg-accent-500 text-white">
          <StarIcon filled className="h-4 w-4" />
        </IconTile>
        <RowBody className="pr-4">
          <RowText title={format(dict.leaveFeedbackFor, { name: ownerFirstName })} />
        </RowBody>
      </button>
    </GroupedList>
  );

  return (
    <>
      {items.length > 0 && (
        <section>
          <SectionHeader>{dict.feedbackHeading}</SectionHeader>
          <div className="flex flex-col gap-2">
            {items.map((t) => (
              <figure key={t.id} className="rounded-[22px] bg-ios-surface px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <figcaption className="truncate text-[15px] font-semibold text-ios-label">
                    {t.author_name || dict.anonymous}
                  </figcaption>
                  <StarRow rating={t.rating} />
                </div>
                <blockquote className="mt-1 text-[15px] leading-relaxed text-ios-label-2">
                  {t.message}
                </blockquote>
              </figure>
            ))}
          </div>
        </section>
      )}
      {leaveRow}

      <Sheet
        open={open}
        onClose={close}
        title={justSubmitted ? dict.testimonialThanksTitle : dict.leaveFeedback}
        closeLabel={dict.close}
      >
        {justSubmitted ? (
          <div className="flex flex-col gap-4 pb-2">
            <p className="text-[15px] text-ios-label-2">{dict.testimonialThanksBody}</p>
            <button
              type="button"
              onClick={() => setJustSubmitted(false)}
              className="ios-press self-start rounded-full bg-ios-fill px-5 py-2.5 text-[15px] font-semibold text-ios-tint"
            >
              {dict.testimonialAnother}
            </button>
          </div>
        ) : (
          <form action={formAction} key={state.resetToken} className="flex flex-col gap-3 pb-2">
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
              placeholder={dict.testimonialNamePlaceholder}
              autoComplete="name"
              className={inputClass}
            />
            <textarea
              name="message"
              required
              rows={3}
              placeholder={dict.testimonialMessagePlaceholder}
              className={inputClass}
            />
            <div className="flex items-center justify-between rounded-xl bg-ios-surface py-1.5 pl-4 pr-2">
              <span className="text-[15px] text-ios-label">{dict.testimonialRatingLabel}</span>
              <StarPicker name="rating" />
            </div>

            {state.error && <p className="text-sm text-red-500">{state.error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="ios-press mt-1 h-12.5 rounded-full bg-ios-primary text-[17px] font-semibold text-ios-on-primary disabled:opacity-60"
            >
              {pending ? dict.testimonialSending : dict.testimonialSubmit}
            </button>
          </form>
        )}
      </Sheet>
    </>
  );
}
