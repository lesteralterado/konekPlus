"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { PROFILE_BANNER_URL } from "@/lib/constants";
import { extractHandle, extractWhatsAppNumber } from "@/lib/socials";
import type { Profile } from "@/lib/types";
import { disconnectSocial, type ProfileFormState, updateProfile } from "./actions";
import {
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "./icons";

const initialProfileState: ProfileFormState = { error: null, success: false };

const rowValueClass =
  "w-full border-0 border-b border-transparent bg-transparent p-0 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none";
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

export function ProfileForm({
  profile,
  feedback,
}: {
  profile: Profile;
  feedback?: { type: "success" | "error"; message: string } | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialProfileState,
  );
  const [preview, setPreview] = useState<string | null>(profile.avatar_url);
  const [isDisconnecting, startDisconnect] = useTransition();
  const youtubeUrl = profile.socials?.youtube ?? "";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.18)]">
        <div
          className="h-36 bg-slate-200 bg-cover bg-center sm:h-40"
          style={{ backgroundImage: `url(${PROFILE_BANNER_URL})` }}
        />
        <div className="flex flex-col items-center px-6 pb-8 text-center">
          <div className="relative -mt-14">
            <div className="h-28 w-28 overflow-hidden rounded-full bg-brand-100 shadow-lg ring-4 ring-white">
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
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-brand-700">
                  {(profile.full_name ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <label
              className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white shadow-md ring-2 ring-white transition hover:bg-brand-700"
              title="Change photo"
            >
              <PencilIcon className="h-4 w-4" />
              <input
                name="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPreview(URL.createObjectURL(file));
                }}
                className="sr-only"
              />
            </label>
          </div>

          <input
            name="full_name"
            defaultValue={profile.full_name ?? ""}
            placeholder="Full name"
            required
            className="mt-4 w-full max-w-[260px] border-0 border-b border-transparent bg-transparent p-0 text-center text-xl font-bold text-brand-900 placeholder:text-slate-300 focus:border-brand-300 focus:outline-none"
          />

          <div className="mt-1 flex w-full max-w-xs items-center justify-center gap-1.5 text-sm text-slate-500">
            <input
              name="job_title"
              defaultValue={profile.job_title ?? ""}
              placeholder="Job title"
              title={profile.job_title ?? ""}
              className="min-w-0 flex-1 truncate border-0 border-b border-transparent bg-transparent p-0 text-center placeholder:text-slate-400 focus:border-brand-300 focus:outline-none"
            />
            <span className="shrink-0 text-slate-300">·</span>
            <input
              name="company"
              defaultValue={profile.company ?? ""}
              placeholder="Company"
              title={profile.company ?? ""}
              className="min-w-0 flex-1 truncate border-0 border-b border-transparent bg-transparent p-0 text-center placeholder:text-slate-400 focus:border-brand-300 focus:outline-none"
            />
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
            icon={<GlobeIcon />}
            label="Website"
            name="social_website"
            placeholder="yourname.com"
            defaultValue={profile.socials?.website ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        {feedback && (
          <p
            className={`text-sm ${feedback.type === "error" ? "text-red-600" : "text-brand-700"}`}
          >
            {feedback.message}
          </p>
        )}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && (
          <p className="text-sm text-brand-700">
            Saved — every card linked to your profile is now up to date.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
