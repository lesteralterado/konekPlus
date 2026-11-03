"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { showToast } from "@/components/toast";
import { CONSENT_TEXT, type ConsentLocale } from "@/lib/photo-consent";
import { resizeImageToJpeg } from "@/lib/resize-image";
import { CameraIcon, ImageIcon, StarIcon } from "./icons";
import { markReviewPromptSeen, removeMyReview, submitReview } from "./review-actions";

// "How's your Konek+?": asked once, as a pop-up, on a card owner's first
// dashboard visit after activating a card from an order; if they skip it, a
// small card stays on the dashboard. Their review goes to an admin inbox and
// only reaches the website when an admin publishes it — they agree to that
// when they send it. An optional photo carries its own consent choices.

export type MyReview = { id: string; status: "new" | "approved"; published: boolean };

const primaryButton =
  "ios-press h-12.5 w-full rounded-full bg-brand-900 text-[17px] font-semibold text-white disabled:opacity-50";
const secondaryButton =
  "ios-press h-12.5 w-full rounded-full bg-white text-[17px] font-semibold text-slate-600 ring-1 ring-slate-200 disabled:opacity-50";
const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

// "Not now" on the card is remembered on this device only.
const DISMISS_KEY = "konek_review_card_dismissed";
const DISMISS_EVENT = "konek-review-card";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(DISMISS_EVENT, onChange);
  };
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Private mode: it just comes back next visit.
  }
  window.dispatchEvent(new Event(DISMISS_EVENT));
}

function ConsentRow({
  checked,
  onChange,
  required = false,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-slate-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-brand-600"
      />
      <span className="text-[15px] leading-snug text-slate-800">
        {children}
        {required && <span className="ml-1 text-xs font-semibold text-slate-400">(required)</span>}
      </span>
    </label>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (stars: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Your rating" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="ios-press p-1 text-accent-500"
        >
          <StarIcon filled={n <= value} className="h-8 w-8" />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({
  defaultName,
  defaultLocale,
  onClose,
}: {
  defaultName: string;
  defaultLocale: ConsentLocale;
  onClose: () => void;
}) {
  const [locale, setLocale] = useState<ConsentLocale>(defaultLocale);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [name, setName] = useState(defaultName);
  const [agree, setAgree] = useState({
    review: false,
    age: false,
    photoRecord: false,
    photoSocial: false,
    photoWebsite: false,
  });
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [sending, startSending] = useTransition();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const text = CONSENT_TEXT[locale];

  // Free the preview's object URL when it's replaced or the sheet closes.
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.url);
    },
    [photo],
  );

  async function onPicked(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPreparing(true);
    try {
      const blob = await resizeImageToJpeg(file);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setError("We couldn't read that photo. Try another one.");
    } finally {
      setPreparing(false);
    }
  }

  const ready =
    rating > 0 &&
    message.trim().length > 0 &&
    name.trim().length > 0 &&
    agree.review &&
    agree.age &&
    (!photo || agree.photoRecord);

  function send() {
    const form = new FormData();
    form.set("rating", String(rating));
    form.set("message", message);
    form.set("display_name", name);
    form.set("consent_review", "1");
    form.set("consent_age", "1");
    if (photo) {
      form.set("photo", new File([photo.blob], "photo.jpg", { type: "image/jpeg" }));
      form.set("photo_consent_record", "1");
      if (agree.photoSocial) form.set("photo_consent_social", "1");
      if (agree.photoWebsite) form.set("photo_consent_website", "1");
    }

    startSending(async () => {
      const result = await submitReview(form);
      if (result.error) {
        setError(result.error);
        return;
      }
      showToast("Thanks for your review!");
      onClose();
    });
  }

  return (
    <div className="pb-2">
      <div role="group" aria-label="Language" className="grid grid-cols-2 gap-2">
        {(["en", "fil"] as const).map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={locale === code}
            onClick={() => setLocale(code)}
            className={`ios-press h-10 rounded-full text-sm font-semibold ${
              locale === code ? "bg-brand-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {code === "fil" ? "Filipino" : "English"}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[15px] text-slate-700">{text.reviewIntro}</p>

      <div className="mt-3">
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={400}
        rows={4}
        placeholder="What do you think of your Konek+?"
        aria-label="Your message"
        className={`${field} mt-3`}
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        placeholder="Name to show (first name and last initial is fine)"
        aria-label="Name to show"
        className={`${field} mt-2.5`}
      />

      {/* Optional photo, with its own choices. */}
      <div className="mt-4 rounded-2xl bg-slate-50 p-3.5">
        <p className="text-sm font-semibold text-brand-900">Add a photo with your card (optional)</p>
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="user"
          hidden
          onChange={(e) => {
            void onPicked(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void onPicked(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {photo ? (
          <div className="mt-2 flex items-center gap-3">
            {/* A local blob preview — next/image has nothing to optimise here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="Your photo" className="size-16 rounded-xl bg-slate-200 object-cover" />
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="ios-press text-sm font-semibold text-slate-500 hover:text-red-600"
            >
              Remove photo
            </button>
          </div>
        ) : (
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={preparing}
              onClick={() => cameraInput.current?.click()}
              className="ios-press inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-semibold text-brand-700 ring-1 ring-slate-200 disabled:opacity-50"
            >
              <CameraIcon className="h-4 w-4" />
              {preparing ? "Preparing…" : "Take a photo"}
            </button>
            <button
              type="button"
              disabled={preparing}
              onClick={() => galleryInput.current?.click()}
              className="ios-press inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-semibold text-brand-700 ring-1 ring-slate-200 disabled:opacity-50"
            >
              <ImageIcon className="h-4 w-4" />
              Gallery
            </button>
          </div>
        )}
        {photo && (
          <div className="mt-3 flex flex-col gap-2.5">
            <ConsentRow
              required
              checked={agree.photoRecord}
              onChange={(v) => setAgree({ ...agree, photoRecord: v })}
            >
              {text.record}
            </ConsentRow>
            <ConsentRow
              checked={agree.photoSocial}
              onChange={(v) => setAgree({ ...agree, photoSocial: v })}
            >
              {text.social}
            </ConsentRow>
            <ConsentRow
              checked={agree.photoWebsite}
              onChange={(v) => setAgree({ ...agree, photoWebsite: v })}
            >
              {text.website}
            </ConsentRow>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        <ConsentRow required checked={agree.review} onChange={(v) => setAgree({ ...agree, review: v })}>
          {text.reviewShow}
        </ConsentRow>
        <ConsentRow required checked={agree.age} onChange={(v) => setAgree({ ...agree, age: v })}>
          {text.age}
        </ConsentRow>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {text.reviewWithdraw}
        {photo && ` ${text.withdraw}`}
      </p>

      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-col gap-2.5 pb-1">
        <button type="button" disabled={!ready || sending || preparing} onClick={send} className={primaryButton}>
          {sending ? "Sending…" : "Send review"}
        </button>
        <button type="button" disabled={sending} onClick={onClose} className={secondaryButton}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

function RemoveSheet({ reviewId, onClose }: { reviewId: string; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    startTransition(async () => {
      const result = await removeMyReview(reviewId);
      setError(result.error);
      if (!result.error) {
        showToast("Review removed");
        onClose();
      }
    });
  }

  return (
    <div className="pb-2">
      <p className="text-[15px] leading-relaxed text-slate-600">
        We&apos;ll take your review down from our website if it&apos;s there and delete it, along
        with any photo you attached. If a photo was already posted on social media, message us and
        we&apos;ll take that post down too.
      </p>
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-col gap-2.5 pb-1">
        <button
          type="button"
          disabled={pending}
          onClick={remove}
          className="ios-press h-12.5 w-full rounded-full bg-red-500 text-[17px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Removing…" : "Remove my review"}
        </button>
        <button type="button" onClick={onClose} className={secondaryButton}>
          Keep it
        </button>
      </div>
    </div>
  );
}

function statusText(review: MyReview) {
  if (review.status === "approved" && review.published) {
    return { title: "Your review is on our website ✓", body: "Thank you for sharing it!" };
  }
  if (review.status === "approved") {
    return { title: "Thanks for your review ✓", body: "We've read it. Thank you for sharing!" };
  }
  return {
    title: "Thanks for your review ✓",
    body: "We'll read it soon. If it goes on our website, you'll see it there.",
  };
}

export function ReviewPrompt({
  eligible,
  review,
  autoOpen,
  defaultName,
  defaultLocale,
}: {
  eligible: boolean;
  review: MyReview | null;
  // First visit since activating: open the form straight away, once.
  autoOpen: boolean;
  defaultName: string;
  defaultLocale: ConsentLocale;
}) {
  // The initial state is all it takes: the sheet only renders on the client.
  const [sheet, setSheet] = useState<"write" | "remove" | null>(
    autoOpen && eligible && !review ? "write" : null,
  );
  // Server snapshot: not dismissed, so the card matches what the server sent.
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => false);

  function close() {
    const wasWriting = sheet === "write";
    setSheet(null);
    // Skipping the pop-up counts as having seen it; the card stays.
    if (wasWriting && autoOpen) void markReviewPromptSeen();
  }

  const card = "mt-4 rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]";

  return (
    <>
      {review ? (
        <section className={card}>
          <h2 className="font-semibold text-brand-900">{statusText(review).title}</h2>
          <p className="mt-1 text-sm text-slate-500">{statusText(review).body}</p>
          <button
            type="button"
            onClick={() => setSheet("remove")}
            className="ios-press mt-3 text-sm font-semibold text-slate-500 hover:text-red-600"
          >
            Remove my review
          </button>
        </section>
      ) : (
        eligible &&
        !dismissed && (
          <section className={card}>
            <h2 className="font-semibold text-brand-900">How&apos;s your Konek+?</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tell us how it&apos;s going. It&apos;s optional, and it only goes on our website if you
              say so.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSheet("write")}
                className="ios-press inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <StarIcon filled className="h-4 w-4" />
                Write a review
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="ios-press text-sm font-semibold text-slate-500 hover:text-brand-700"
              >
                Not now
              </button>
            </div>
          </section>
        )
      )}

      <Sheet open={sheet === "write"} onClose={close} title="How's your Konek+?" closeLabel="Close" scopeClass="admin-ui">
        {sheet === "write" && (
          <ReviewForm defaultName={defaultName} defaultLocale={defaultLocale} onClose={close} />
        )}
      </Sheet>
      <Sheet open={sheet === "remove"} onClose={close} title="Remove your review?" closeLabel="Close" scopeClass="admin-ui">
        {sheet === "remove" && review && <RemoveSheet reviewId={review.id} onClose={close} />}
      </Sheet>
    </>
  );
}
