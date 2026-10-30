"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { CameraIcon, ImageIcon } from "@/app/dashboard/icons";
import { Sheet } from "@/components/sheet";
import { showToast } from "@/components/toast";
import { CONSENT_TEXT, type ConsentLocale } from "@/lib/photo-consent";
import { PHOTO_FREEBIE } from "@/lib/photo-freebie";
import { resizeImageToJpeg } from "@/lib/resize-image";
import { saveHandoverPhoto } from "./actions";

// The optional photo with a customer, taken right after a handover (or later
// from the order). Handover itself never waits for it: the status change has
// already happened, and "Skip" is as prominent as "Continue".
//
// The sheet lives in one host mounted by the admin layout and is opened by
// openHandoverPhoto(): recording a handover changes the order's status, which
// unmounts the button that was tapped, so the sheet can't belong to it.

export type PhotoTarget = {
  kind: "keychain" | "card";
  orderId: string;
  customerName: string;
};

type Store = { id: number; open: boolean; target: PhotoTarget | null };

const INITIAL: Store = { id: 0, open: false, target: null };
let store: Store = INITIAL;
const listeners = new Set<() => void>();

function setStore(next: Store) {
  store = next;
  for (const l of listeners) l();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// A beat of delay so a confirm drawer that's closing gets out of the way
// first, instead of two sheets sliding at once.
export function openHandoverPhoto(target: PhotoTarget) {
  setTimeout(() => setStore({ id: store.id + 1, open: true, target }), 250);
}

function closeHandoverPhoto() {
  setStore({ ...store, open: false });
}

export function HandoverPhotoHost() {
  const { id, open, target } = useSyncExternalStore(
    subscribe,
    () => store,
    () => INITIAL,
  );

  return (
    <Sheet
      open={open}
      onClose={closeHandoverPhoto}
      title={target ? `Photo with ${target.customerName}` : "Photo"}
      closeLabel="Close"
      scopeClass="admin-ui"
    >
      {/* Keyed so each opening starts from the consent step. */}
      {target && <PhotoFlow key={id} target={target} onClose={closeHandoverPhoto} />}
    </Sheet>
  );
}

const primaryButton =
  "ios-press h-12.5 w-full rounded-full bg-brand-900 text-[17px] font-semibold text-white disabled:opacity-50";
const secondaryButton =
  "ios-press h-12.5 w-full rounded-full bg-white text-[17px] font-semibold text-slate-600 ring-1 ring-slate-200 disabled:opacity-50";

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

function PhotoFlow({ target, onClose }: { target: PhotoTarget; onClose: () => void }) {
  const [step, setStep] = useState<"consent" | "capture" | "preview" | "saved">("consent");
  // The saved photo, kept so it can be sent to the customer from their phone.
  const [savedFile, setSavedFile] = useState<File | null>(null);
  const [locale, setLocale] = useState<ConsentLocale>("fil");
  const [agree, setAgree] = useState({ record: false, age: false, social: false, website: false });
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [saving, startSaving] = useTransition();
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

  function save() {
    if (!photo) return;
    const file = new File([photo.blob], "photo.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.set("kind", target.kind);
    form.set("order_id", target.orderId);
    form.set("photo", file);
    form.set("consent_record", "1");
    form.set("consent_age", "1");
    if (agree.social) form.set("consent_social", "1");
    if (agree.website) form.set("consent_website", "1");

    startSaving(async () => {
      const result = await saveHandoverPhoto(form);
      if (result.error) {
        setError(result.error);
        return;
      }
      // On a phone, offer to send the customer their copy (Messenger, Viber,
      // SMS…); elsewhere there's nothing more to do.
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        setSavedFile(file);
        setStep("saved");
      } else {
        showToast("Photo saved");
        onClose();
      }
    });
  }

  async function sharePhoto() {
    if (!savedFile) return;
    try {
      await navigator.share({ files: [savedFile], title: "Your Konek+ photo" });
    } catch {
      // Cancelled, or no app to share to — the photo is saved either way.
    }
  }

  if (step === "saved" && savedFile) {
    return (
      <div className="pb-2">
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Photo saved ✓
        </p>
        <p className="mt-3 text-[15px] text-slate-600">
          Send {target.customerName} their own copy? It opens Messenger, Viber, SMS or whatever
          they use.
        </p>
        <div className="mt-4 flex flex-col gap-2.5 pb-1">
          <button type="button" onClick={sharePhoto} className={primaryButton}>
            Send them the photo
          </button>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Done
          </button>
        </div>
      </div>
    );
  }

  if (step === "preview" && photo) {
    return (
      <div className="pb-2">
        {/* A local blob preview — next/image has nothing to optimise here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt="Photo to save"
          className="max-h-[50dvh] w-full rounded-2xl bg-slate-900 object-contain"
        />
        {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex flex-col gap-2.5 pb-1">
          <button type="button" disabled={saving} onClick={save} className={primaryButton}>
            {saving ? "Saving…" : "Save photo"}
          </button>
          <button
            type="button"
            disabled={saving}
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
          Ask {target.customerName} to hold what they bought, face visible, in good light.
        </p>
        {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {/* Phones open the camera app (rear camera); a computer opens the file picker. */}
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
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
            {preparing ? "Preparing…" : "Take photo"}
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
      <p className="rounded-2xl bg-brand-50/70 px-4 py-3 text-sm text-brand-900">
        Optional — the handover is already recorded. Hand the phone to the customer, or read this
        aloud and tick what they agree to.
        {PHOTO_FREEBIE.enabled && (
          <>
            {" "}
            Freebie for agreeing: <b>{PHOTO_FREEBIE.label}</b>.
          </>
        )}
      </p>

      <div role="group" aria-label="Language" className="mt-3 grid grid-cols-2 gap-2">
        {(["fil", "en"] as const).map((code) => (
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

      <p className="mt-3 text-[15px] text-slate-700">{text.intro}</p>

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
          Skip — no photo
        </button>
      </div>
    </div>
  );
}
