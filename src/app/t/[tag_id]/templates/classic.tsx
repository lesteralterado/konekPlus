import Image from "next/image";
import Link from "next/link";
import { PROFILE_BANNER_URL } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { getOrderedSocials } from "./social-list";

export function ClassicTemplate({
  profile,
  tagId,
  isOwner,
}: {
  profile: Profile;
  tagId: string;
  isOwner: boolean;
}) {
  const socials = getOrderedSocials(profile.socials);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="fade-up overflow-hidden rounded-[2.5rem] bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.18)]">
        <div className="relative h-40 sm:h-48">
          <div
            className="absolute inset-0 bg-slate-200 bg-cover bg-center"
            style={{ backgroundImage: `url(${PROFILE_BANNER_URL})` }}
          />
          {isOwner && (
            <Link
              href="/dashboard"
              className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-brand-700 shadow-sm backdrop-blur transition hover:bg-white active:scale-95"
            >
              Edit
            </Link>
          )}
        </div>

        <div className="flex flex-col items-center px-6 pb-8 text-center">
          <div className="relative -mt-14 h-28 w-28 overflow-hidden rounded-full bg-brand-100 shadow-lg ring-4 ring-white">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name ?? "Profile photo"}
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-brand-700">
                {(profile.full_name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-brand-900">
            {profile.full_name}
          </h1>
          {(profile.job_title || profile.company) && (
            <p className="mt-1 text-slate-500">
              {[profile.job_title, profile.company].filter(Boolean).join(" · ")}
            </p>
          )}

          <div className="mt-6 flex w-full flex-col gap-3">
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="rounded-2xl border-2 border-slate-200 px-4 py-3.5 text-center font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 active:scale-[0.98]"
              >
                Call {profile.phone}
              </a>
            )}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="rounded-2xl border-2 border-slate-200 px-4 py-3.5 text-center font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 active:scale-[0.98]"
              >
                Email {profile.email}
              </a>
            )}
            <a
              href={`/t/${tagId}/vcard`}
              className="rounded-2xl bg-brand-600 px-4 py-3.5 text-center font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 active:scale-[0.98]"
            >
              Save to contacts
            </a>
          </div>

          {socials.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {socials.map(({ key, url, Icon, label }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-brand-700 active:scale-95"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
