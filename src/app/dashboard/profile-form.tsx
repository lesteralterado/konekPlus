"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import type { Profile } from "@/lib/types";
import { type ProfileFormState, updateProfile } from "./actions";
import {
  GlobeIcon,
  InstagramIcon,
  LinkIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
} from "./icons";

const initialProfileState: ProfileFormState = { error: null, success: false };

const rowValueClass =
  "w-full border-0 border-b border-transparent bg-transparent p-0 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none";
const rowLabelClass =
  "mb-0.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400";
const iconChipClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700";
const cardClass =
  "rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialProfileState,
  );
  const [preview, setPreview] = useState<string | null>(profile.avatar_url);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="h-28 w-28 overflow-hidden rounded-full bg-brand-100 shadow-md ring-4 ring-white">
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
              <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-brand-700">
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
          className="mt-4 w-full max-w-[260px] border-0 border-b border-transparent bg-transparent p-0 text-center text-xl font-semibold text-brand-900 placeholder:text-slate-300 focus:border-brand-300 focus:outline-none"
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
        <h3 className="mb-4 text-sm font-semibold text-brand-900">Socials</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-brand-50/60 p-3 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm">
              <LinkIcon className="h-4 w-4" />
            </span>
            <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              LinkedIn
            </label>
            <input
              name="social_linkedin"
              placeholder="Add link"
              defaultValue={profile.socials?.linkedin ?? ""}
              className="w-full border-0 bg-transparent p-0 text-center text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-brand-50/60 p-3 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm">
              <InstagramIcon className="h-4 w-4" />
            </span>
            <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Instagram
            </label>
            <input
              name="social_instagram"
              placeholder="Add link"
              defaultValue={profile.socials?.instagram ?? ""}
              className="w-full border-0 bg-transparent p-0 text-center text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-brand-50/60 p-3 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm">
              <GlobeIcon className="h-4 w-4" />
            </span>
            <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Website
            </label>
            <input
              name="social_website"
              placeholder="Add link"
              defaultValue={profile.socials?.website ?? ""}
              className="w-full border-0 bg-transparent p-0 text-center text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
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
