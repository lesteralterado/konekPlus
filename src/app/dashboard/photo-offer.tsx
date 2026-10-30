"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { showToast } from "@/components/toast";
import { CONSENT_TEXT, type ConsentLocale } from "@/lib/photo-consent";
import { resizeImageToJpeg } from "@/lib/resize-image";
import type { CustomerPhotoStatus, FreebieStatus } from "@/lib/types";
import { CameraIcon, ImageIcon } from "./icons";
import { submitMyPhoto, withdrawMyPhoto, type MyPhotoResult } from "./photo-actions";

// A card owner sharing a photo of themselves with their card, for orders that
// arrived by courier. Optional, with the same three separate choices as at a
// hand-over. It goes to a review queue; nothing is public or promised until
// an admin approves it. Only rendered when the offer is switched on (see
// photo-offer-section.tsx), or to show the status of a photo already sent.

export type MyPhoto = {
  id: string;
  status: CustomerPhotoStatus;
  freebieStatus: FreebieStatus;
};

const primaryButton =
  "ios-press h-12.5 w-full rounded-full bg-brand-900 text-[17px] font-semibold text-white disabled:opacity-50";
const secondaryButton =
  "ios-press h-12.5 w-full rounded-full bg-white text-[17px] font-semibold text-slate-600 ring-1 ring-slate-200 disabled:opacity-50";

// "Not now" is remembered on this device only.
const DISMISS_KEY = "konek_photo_offer_dismissed";
const DISMISS_EVENT = "konek-photo-offer";

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

function SendFlow({
  defaultLocale,
  onClose,
}: {
  defaultLocale: ConsentLocale;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"consent" | "capture" | "preview">("consent");
  const [locale, setLocale] = useState<ConsentLocale>(defaultLocale);
  const [agree, setAgree] = useState({ record: false, age: false, social: false, website: false });
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
      setStep("preview");
    } catch {
      setError("We couldn't read that photo. Try another one.");
    } finally {
      setPreparing(false);
    }
  }

  function send() {
    if (!photo) return;
    const form = new FormData();
    form.set("photo", new File([photo.blob], "photo.jpg", { type: "image/jpeg" }));
    form.set("consent_record", "1");
    form.set("consent_age", "1");
    if (agree.social) form.set("consent_social", "1");
    if (agree.website) form.set("consent_website", "1");

    startSending(async () => {
      const result = await submitMyPhoto(form);
      if (result.error) {
        setError(result.error);
        return;
      }
      showToast("Photo sent — thank you!");
      onClose();
    });
  }

  if (step === "preview" && photo) {
    return (
      <div className="pb-2">
        {/* A local blob preview — next/image has nothing to optimise here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt="Your photo"
          className="max-h-[50dvh] w-full rounded-2xl bg-slate-900 object-contain"
        />
        {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex flex-col gap-2.5 pb-1">
          <button type="button" disabled={sending} onClick={send} className={primaryButton}>
            {sending ? "Sending…" : "Send photo"}
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={() => {
              setPhoto(null);
              setError(null);
              setStep("capture");
            }}
            className={secondaryButton}
          >
            Retake
          </button>
        </div>
      </div>
    );
  }

  if (step === "capture") {
    return (
      <div className="pb-2">
        <p className="text-[15px] text-slate-600">
          Hold your Konek+ card up next to you — face visible, in good light.
        </p>
        {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {/* Phones open the camera app (front camera); a computer opens the file picker. */}
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

        <div className="mt-4 flex flex-col gap-2.5 pb-1">
          <button
            type="button"
            disabled={preparing}
            onClick={() => cameraInput.current?.click()}
            className={`${primaryButton} flex items-center justify-center gap-2`}
          >
            <CameraIcon className="h-5 w-5" />
            {preparing ? "Preparing…" : "Take a photo"}
          </button>
          <button
            type="button"
            disabled={preparing}
            onClick={() => galleryInput.current?.click()}
            className={`${secondaryButton} flex items-center justify-center gap-2`}
          >
            <ImageIcon className="h-5 w-5" />
            Choose from gallery
          </button>
          <button type="button" onClick={() => setStep("consent")} className={secondaryButton}>
            Back
          </button>
        </div>
      </div>
    );
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

      <p className="mt-3 text-[15px] text-slate-700">{text.selfIntro}</p>

      <div className="mt-3 flex flex-col gap-2.5">
        <ConsentRow required checked={agree.record} onChange={(v) => setAgree({ ...agree, record: v })}>
          {text.record}
        </ConsentRow>
        <ConsentRow checked={agree.social} onChange={(v) => setAgree({ ...agree, social: v })}>
          {text.social}
        </ConsentRow>
        <ConsentRow checked={agree.website} onChange={(v) => setAgree({ ...agree, website: v })}>
          {text.website}
        </ConsentRow>
        <ConsentRow required checked={agree.age} onChange={(v) => setAgree({ ...agree, age: v })}>
          {text.age}
        </ConsentRow>
      </div>

      <p className="mt-3 text-xs text-slate-500">{text.withdraw}</p>

      <div className="mt-4 flex flex-col gap-2.5 pb-1">
        <button
          type="button"
          disabled={!agree.record || !agree.age}
          onClick={() => setStep("capture")}
          className={primaryButton}
        >
          Continue
        </button>
        <button type="button" onClick={onClose} className={secondaryButton}>
          Not now
        </button>
      </div>
    </div>
  );
}

function RemoveSheet({ photoId, onClose }: { photoId: string; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    startTransition(async () => {
      const result: MyPhotoResult = await withdrawMyPhoto(photoId);
      setError(result.error);
      if (!result.error) {
        showToast("Photo removed");
        onClose();
      }
    });
  }

  return (
    <div className="pb-2">
      <p className="text-[15px] leading-relaxed text-slate-600">
        We&apos;ll take your photo down from our website if it&apos;s there, and delete it from our
        storage. If it was already posted on social media, message us and we&apos;ll take that
        post down too. Any thank-you you&apos;ve already received is yours to keep.
      </p>
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-col gap-2.5 pb-1">
        <button
          type="button"
          disabled={pending}
          onClick={remove}
          className="ios-press h-12.5 w-full rounded-full bg-red-500 text-[17px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Removing…" : "Remove my photo"}
        </button>
        <button type="button" onClick={onClose} className={secondaryButton}>
          Keep it
        </button>
      </div>
    </div>
  );
}

function statusText(photo: MyPhoto, customerText: string) {
  if (photo.status === "pending_review") {
    return {
      title: "Photo sent ✓",
      body: "We're taking a quick look. We'll let you know about your thank-you once it's approved.",
    };
  }
  if (photo.freebieStatus === "given") {
    return { title: "Thank-you sent ✓", body: "Thanks for sharing your photo with us!" };
  }
  if (photo.freebieStatus === "pending") {
    return {
      title: "Photo approved ✓",
      body: `Thank you! We'll arrange your thank-you (${customerText}) soon.`,
    };
  }
  return { title: "Photo approved ✓", body: "Thank you for sharing it with us!" };
}

export function PhotoOffer({
  eligible,
  photo,
  customerText,
  defaultLocale,
}: {
  eligible: boolean;
  photo: MyPhoto | null;
  customerText: string;
  defaultLocale: ConsentLocale;
}) {
  const [sheet, setSheet] = useState<"send" | "remove" | null>(null);
  const close = () => setSheet(null);
  // Server snapshot: not dismissed, so the card matches what the server sent.
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => false);

  const card = "mt-4 rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]";

  return (
    <>
      {photo ? (
        <section className={card}>
          <h2 className="font-semibold text-brand-900">{statusText(photo, customerText).title}</h2>
          <p className="mt-1 text-sm text-slate-500">{statusText(photo, customerText).body}</p>
          <button
            type="button"
            onClick={() => setSheet("remove")}
            className="ios-press mt-3 text-sm font-semibold text-slate-500 hover:text-red-600"
          >
            Remove my photo
          </button>
        </section>
      ) : (
        eligible &&
        !dismissed && (
          <section className={card}>
            <h2 className="font-semibold text-brand-900">A photo with your card?</h2>
            <p className="mt-1 text-sm text-slate-500">
              Share a photo of you with your Konek+ and get {customerText}. It&apos;s optional, and you
              choose what we may do with it.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSheet("send")}
                className="ios-press inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <CameraIcon className="h-4 w-4" />
                Add a photo
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

      <Sheet open={sheet === "send"} onClose={close} title="Share a photo" closeLabel="Close" scopeClass="admin-ui">
        {sheet === "send" && <SendFlow defaultLocale={defaultLocale} onClose={close} />}
      </Sheet>
      <Sheet open={sheet === "remove"} onClose={close} title="Remove your photo?" closeLabel="Close" scopeClass="admin-ui">
        {sheet === "remove" && photo && <RemoveSheet photoId={photo.id} onClose={close} />}
      </Sheet>
    </>
  );
}
