"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { showToast, useIsClient } from "@/components/toast";
import { PROFILE_BANNER_URL } from "@/lib/constants";
import { extractHandle, extractWhatsAppNumber } from "@/lib/socials";
import type { Profile } from "@/lib/types";
import { disconnectSocial, type ProfileFormState, updateProfile } from "./actions";
import { AvatarCropper } from "./avatar-cropper";
import { PhotoSheet, type PhotoSheetView } from "./photo-sheet";
import { ProfileSummary } from "./profile-summary";
import {
  CameraIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  LinkIcon,
  MailIcon,
  PhoneIcon,
  PinterestIcon,
  SparkleIcon,
  ThreadsIcon,
  TikTokIcon,
  WhatsAppIcon,
  XIcon,
  YouTubeIcon,
} from "./icons";

const initialProfileState: ProfileFormState = { error: null, success: false };

const rowValueClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
const rowLabelClass =
  "mb-0.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400";
const iconChipClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700";
const cardClass =
  "rounded-4xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6";

function SocialField({
  icon,
  label,
  name,
  prefix,
  placeholder,
  defaultValue,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  prefix?: string;
  placeholder: string;
  defaultValue: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className={iconChipClass}>{icon}</span>
      <div className="min-w-0 flex-1 text-left">
        <label className={rowLabelClass}>{label}</label>
        <div className="flex items-center gap-1">
          {prefix && (
            <span className="shrink-0 text-sm text-slate-400">{prefix}</span>
          )}
          <input
            name={name}
            defaultValue={defaultValue}
            placeholder={placeholder}
            className={rowValueClass}
          />
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className={rowLabelClass}>{children}</span>;
}

export function ProfileForm({
  profile,
  feedback,
  initialEditing = false,
}: {
  profile: Profile;
  feedback?: { type: "success" | "error"; message: string } | null;
  initialEditing?: boolean;
}) {
  const [editing, setEditing] = useState(initialEditing);
  const [dirty, setDirty] = useState(false);
  // The action wrapper leaves edit mode on success. The form is submitted via
  // onSubmit (below) rather than `action=`, because React resets uncontrolled
  // fields after an action completes — which would wipe the user's edits when
  // the server returns a validation error.
  const [state, formAction, pending] = useActionState(
    async (prev: ProfileFormState, formData: FormData) => {
      const result = await updateProfile(prev, formData);
      if (result.success) {
        setEditing(false);
        setDirty(false);
        showToast("Profile saved");
      }
      return result;
    },
    initialProfileState,
  );
  const [, startSubmit] = useTransition();

  const [preview, setPreview] = useState<string | null>(profile.avatar_url);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetView, setSheetView] = useState<PhotoSheetView>("menu");
  // avatarInputRef is the one named "avatar" input that rides along with the
  // form; the other two only collect a file before it goes to the cropper.
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const isClient = useIsClient();
  const isTouch = isClient && window.matchMedia("(pointer: coarse)").matches;
  const canWebcam = isClient && !!navigator.mediaDevices?.getUserMedia;
  const canTakePhoto = isTouch || canWebcam;

  const [isDisconnecting, startDisconnect] = useTransition();
  const youtubeUrl = profile.socials?.youtube ?? "";
  const [links, setLinks] = useState<{ key: number; label: string; url: string }[]>(
    () => profile.links.map((l, i) => ({ key: i, ...l })),
  );
  const nextLinkKey = useRef(links.length);

  useEffect(() => {
    if (!editing || !dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [editing, dirty]);

  function resetDraft() {
    setPreview(profile.avatar_url);
    setRemoveAvatar(false);
    setCropSrc(null);
    setDirty(false);
    const fresh = profile.links.map((l, i) => ({ key: i, ...l }));
    setLinks(fresh);
    nextLinkKey.current = fresh.length;
  }

  function startEditing() {
    resetDraft();
    setEditing(true);
  }

  // Unsaved edits ask first, in the app's bottom drawer (not a browser
  // confirm() box); with nothing changed, Cancel just leaves edit mode.
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  function discardAndExit() {
    setConfirmDiscard(false);
    resetDraft();
    setEditing(false);
  }

  function cancelEditing() {
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    discardAndExit();
  }

  function openPhotoSheet() {
    setSheetView("menu");
    setSheetOpen(true);
  }

  function chooseFile() {
    setSheetOpen(false);
    fileInputRef.current?.click();
  }

  function takePhoto() {
    if (isTouch) {
      setSheetOpen(false);
      captureInputRef.current?.click();
    } else {
      setSheetView("camera");
    }
  }

  function startCrop(file: File) {
    setSheetOpen(false);
    setCropSrc(URL.createObjectURL(file));
  }

  function handlePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) startCrop(file);
  }

  function handleCropped(blob: Blob) {
    const file = new File([blob], "avatar.jpg", { type: blob.type });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    if (avatarInputRef.current) {
      avatarInputRef.current.files = dataTransfer.files;
    }
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setPreview(URL.createObjectURL(blob));
    setRemoveAvatar(false);
    setCropSrc(null);
    setDirty(true);
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function removePhoto() {
    setSheetOpen(false);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    setPreview(null);
    setRemoveAvatar(true);
    setDirty(true);
  }

  const feedbackNote = feedback && (
    <p
      className={`text-center text-sm ${feedback.type === "error" ? "text-red-600" : "text-brand-700"}`}
    >
      {feedback.message}
    </p>
  );

  if (!editing) {
    return (
      <div className="flex flex-col gap-4">
        {feedbackNote}
        <ProfileSummary profile={profile} onEdit={startEditing} />
      </div>
    );
  }

  return (
    <>
      {cropSrc && (
        <AvatarCropper
          imageSrc={cropSrc}
          onCancel={handleCropCancel}
          onCropped={handleCropped}
        />
      )}
      <Sheet
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="Discard changes?"
        closeLabel="Keep editing"
        scopeClass="admin-ui"
      >
        <p className="text-[15px] text-slate-600">Your edits haven&apos;t been saved.</p>
        <div className="mt-5 flex flex-col gap-2.5 pb-1">
          <button
            type="button"
            onClick={discardAndExit}
            className="ios-press h-12.5 rounded-full bg-red-500 text-[17px] font-semibold text-white"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => setConfirmDiscard(false)}
            className="ios-press h-12.5 rounded-full bg-white text-[17px] font-semibold text-slate-600 ring-1 ring-slate-200"
          >
            Keep editing
          </button>
        </div>
      </Sheet>
      <PhotoSheet
        open={sheetOpen}
        view={sheetView}
        hasPhoto={!!preview}
        canTakePhoto={canTakePhoto}
        onClose={() => setSheetOpen(false)}
        onTakePhoto={takePhoto}
        onChooseFile={chooseFile}
        onRemove={removePhoto}
        onCaptured={startCrop}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePicked}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handlePicked}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startSubmit(() => formAction(formData));
        }}
        onChange={() => setDirty(true)}
        className="flex flex-col gap-6"
      >
      {feedbackNote}
      <input ref={avatarInputRef} name="avatar" type="file" className="hidden" tabIndex={-1} aria-hidden="true" />
      {removeAvatar && <input type="hidden" name="remove_avatar" value="1" />}
      <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.18)]">
        <div
          className="h-36 bg-slate-200 bg-cover bg-center sm:h-40"
          style={{ backgroundImage: `url(${PROFILE_BANNER_URL})` }}
        />
        <div className="flex flex-col items-center px-6 pb-8">
          <div className="relative -mt-14">
            <button
              type="button"
              onClick={openPhotoSheet}
              aria-label="Change profile photo"
              className="block h-28 w-28 overflow-hidden rounded-full bg-brand-100 shadow-lg ring-4 ring-white"
            >
              {preview ? (
                <Image
                  src={preview}
                  alt=""
                  width={112}
                  height={112}
                  unoptimized={preview.startsWith("blob:")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-brand-700">
                  {(profile.full_name ?? "?").slice(0, 1).toUpperCase()}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={openPhotoSheet}
              aria-label="Change profile photo"
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-md ring-2 ring-white transition hover:bg-brand-700"
            >
              <CameraIcon className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={openPhotoSheet}
            className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Change photo
          </button>

          <div className="mt-5 flex w-full max-w-sm flex-col gap-4 text-left">
            <label className="block">
              <FieldLabel>Full name</FieldLabel>
              <input
                name="full_name"
                defaultValue={profile.full_name ?? ""}
                placeholder="Your full name"
                required
                className={rowValueClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <FieldLabel>Job title</FieldLabel>
                <input
                  name="job_title"
                  defaultValue={profile.job_title ?? ""}
                  placeholder="e.g. Designer"
                  className={rowValueClass}
                />
              </label>
              <label className="block">
                <FieldLabel>Company</FieldLabel>
                <input
                  name="company"
                  defaultValue={profile.company ?? ""}
                  placeholder="e.g. Acme Inc."
                  className={rowValueClass}
                />
              </label>
            </div>
            <label className="block">
              <FieldLabel>Tagline</FieldLabel>
              <input
                name="tagline"
                defaultValue={profile.tagline ?? ""}
                placeholder="e.g. “Building modern web solutions”"
                className={rowValueClass}
              />
            </label>
            <label className="block">
              <FieldLabel>Bio</FieldLabel>
              <textarea
                name="bio"
                defaultValue={profile.bio ?? ""}
                placeholder="A couple of sentences about what you do."
                rows={3}
                className={`${rowValueClass} resize-none`}
              />
            </label>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex flex-col divide-y divide-slate-100">
          <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className={iconChipClass}>
              <PhoneIcon />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <label className={rowLabelClass}>Phone</label>
              <input
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ""}
                placeholder="Add a phone number"
                className={rowValueClass}
              />
            </div>
            <ShowOnCardToggle name="show_phone" defaultChecked={profile.show_phone ?? true} label="phone" />
          </div>
          <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className={iconChipClass}>
              <MailIcon />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <label className={rowLabelClass}>Email</label>
              <input
                name="email"
                type="email"
                defaultValue={profile.email ?? ""}
                placeholder="Add an email"
                className={rowValueClass}
              />
            </div>
            <ShowOnCardToggle name="show_email" defaultChecked={profile.show_email ?? true} label="email" />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="mb-1 text-sm font-semibold text-brand-900">Socials</h3>
        <p className="mb-3 text-xs text-slate-400">
          Just your username — we&apos;ll build the link.
        </p>
        <div className="flex flex-col divide-y divide-slate-100">
          <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className={iconChipClass}>
              <YouTubeIcon />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <label className={rowLabelClass}>YouTube</label>
              {youtubeUrl ? (
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-800">
                    Connected
                  </span>
                  <button
                    type="button"
                    disabled={isDisconnecting}
                    onClick={() =>
                      startDisconnect(() => disconnectSocial("youtube"))
                    }
                    className="text-xs font-medium text-slate-400 underline decoration-dotted hover:text-red-600 disabled:opacity-60"
                  >
                    {isDisconnecting ? "Removing…" : "Disconnect"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Not connected</p>
              )}
            </div>
            {!youtubeUrl && (
              <a
                href="/api/connect/youtube"
                className="shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
              >
                Connect
              </a>
            )}
          </div>
          <SocialField
            icon={<LinkedInIcon />}
            label="LinkedIn"
            name="social_linkedin"
            prefix="linkedin.com/in/"
            placeholder="your-name"
            defaultValue={extractHandle(
              "linkedin",
              profile.socials?.linkedin ?? "",
            )}
          />
          <SocialField
            icon={<InstagramIcon />}
            label="Instagram"
            name="social_instagram"
            prefix="@"
            placeholder="username"
            defaultValue={extractHandle(
              "instagram",
              profile.socials?.instagram ?? "",
            )}
          />
          <SocialField
            icon={<FacebookIcon />}
            label="Facebook"
            name="social_facebook"
            prefix="facebook.com/"
            placeholder="username"
            defaultValue={extractHandle(
              "facebook",
              profile.socials?.facebook ?? "",
            )}
          />
          <SocialField
            icon={<TikTokIcon />}
            label="TikTok"
            name="social_tiktok"
            prefix="@"
            placeholder="username"
            defaultValue={extractHandle(
              "tiktok",
              profile.socials?.tiktok ?? "",
            )}
          />
          <SocialField
            icon={<WhatsAppIcon />}
            label="WhatsApp"
            name="social_whatsapp"
            prefix="+"
            placeholder="63 912 345 6789"
            defaultValue={extractWhatsAppNumber(
              profile.socials?.whatsapp ?? "",
            )}
          />
          <SocialField
            icon={<XIcon />}
            label="X (Twitter)"
            name="social_x"
            prefix="@"
            placeholder="username"
            defaultValue={extractHandle("x", profile.socials?.x ?? "")}
          />
          <SocialField
            icon={<ThreadsIcon />}
            label="Threads"
            name="social_threads"
            prefix="@"
            placeholder="username"
            defaultValue={extractHandle("threads", profile.socials?.threads ?? "")}
          />
          <SocialField
            icon={<PinterestIcon />}
            label="Pinterest"
            name="social_pinterest"
            prefix="pinterest.com/"
            placeholder="username"
            defaultValue={extractHandle(
              "pinterest",
              profile.socials?.pinterest ?? "",
            )}
          />
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="mb-1 text-sm font-semibold text-brand-900">
          Custom action button
        </h3>
        <p className="mb-3 text-xs text-slate-400">
          One prominent button on your profile — book a meeting, get a quote,
          shop now, whatever matters most.
        </p>
        <div className="flex flex-col divide-y divide-slate-100">
          <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className={iconChipClass}>
              <SparkleIcon />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <label className={rowLabelClass}>Button label</label>
              <input
                name="cta_label"
                defaultValue={profile.cta_label ?? ""}
                placeholder="e.g. Book a Meeting"
                className={rowValueClass}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className={iconChipClass}>
              <LinkIcon />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <label className={rowLabelClass}>Button link</label>
              <input
                name="cta_url"
                defaultValue={profile.cta_url ?? ""}
                placeholder="https://…"
                className={rowValueClass}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="mb-1 text-sm font-semibold text-brand-900">Links</h3>
        <p className="mb-3 text-xs text-slate-400">
          Your website, portfolio, store, booking page — whatever you want to
          point people to.
        </p>
        <div className="flex flex-col gap-3">
          {links.map((link) => (
            <div key={link.key} className="flex items-center gap-2">
              <input
                name="link_label"
                defaultValue={link.label}
                placeholder="Label (e.g. Portfolio)"
                className={`${rowValueClass} w-28 shrink-0 rounded-lg border border-slate-200 px-2.5 py-2`}
              />
              <input
                name="link_url"
                defaultValue={link.url}
                placeholder="https://…"
                className={`${rowValueClass} flex-1 rounded-lg border border-slate-200 px-2.5 py-2`}
              />
              <button
                type="button"
                onClick={() =>
                  setLinks((prev) => prev.filter((l) => l.key !== link.key))
                }
                aria-label="Remove link"
                className="shrink-0 text-slate-300 transition hover:text-red-500"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setLinks((prev) => [
                ...prev,
                { key: nextLinkKey.current++, label: "", url: "" },
              ])
            }
            className="self-start text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            + Add a link
          </button>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-6 border-t border-slate-200 bg-white/90 px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        {state.error && (
          <p className="mb-2 text-center text-sm text-red-600">{state.error}</p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={cancelEditing}
            className="flex-1 rounded-full border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || !dirty}
            className="flex-2 rounded-full bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
    </>
  );
}

// Privacy: hide this field from the public card and the saved contact
// (vCard). Still kept on the account. Checked = shown (0022).
function ShowOnCardToggle({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label className="flex shrink-0 cursor-pointer flex-col items-center gap-0.5" title={`Show ${label} on my card`}>
      {/* Tells the server this form carries the switch, so an unchecked
          (absent) checkbox means "hide" — and nothing else can hide it by accident. */}
      <input type="hidden" name={`${name}_present`} value="1" />
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
        aria-label={`Show ${label} on my card`}
      />
      <span className="relative h-6 w-10 rounded-full bg-slate-200 transition peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-200 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4" />
      <span className="text-[10px] font-medium text-slate-400">On card</span>
    </label>
  );
}
