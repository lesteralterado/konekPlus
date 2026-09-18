import Image from "next/image";
import Link from "next/link";
import { PhoneIcon, MailIcon } from "@/app/dashboard/icons";
import type { Profile } from "@/lib/types";
import { getOrderedSocials } from "./social-list";

export function EditorialTemplate({
  profile,
  tagId,
  isOwner,
}: {
  profile: Profile;
  tagId: string;
  isOwner: boolean;
}) {
  const socials = getOrderedSocials(profile.socials);
  const initial = (profile.full_name ?? "?").slice(0, 1).toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="fade-up overflow-hidden rounded-[2.5rem] bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.18)]">
        <div className="relative h-80 sm:h-96">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? "Profile photo"}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 text-8xl font-bold text-white/25">
              {initial}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/10" />

          {isOwner && (
            <Link
              href="/dashboard"
              className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-brand-700 shadow-sm backdrop-blur transition hover:bg-white active:scale-95"
            >
              Edit
            </Link>
          )}

          <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {profile.full_name}
            </h1>
            {(profile.job_title || profile.company) && (
              <p className="mt-1 text-sm font-medium text-white/75">
                {[profile.job_title, profile.company].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center px-6 py-7 text-center">
          {socials.length > 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-2.5">
              {socials.map(({ key, url, Icon, label }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500/10 text-accent-500 transition hover:bg-accent-500/20 active:scale-95"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          )}

          <div className="flex w-full gap-3">
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-slate-50 py-3.5 text-slate-700 transition hover:bg-slate-100 active:scale-[0.97]"
              >
                <PhoneIcon className="h-5 w-5" />
                <span className="text-xs font-semibold">Call</span>
              </a>
            )}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-slate-50 py-3.5 text-slate-700 transition hover:bg-slate-100 active:scale-[0.97]"
              >
                <MailIcon className="h-5 w-5" />
                <span className="text-xs font-semibold">Email</span>
              </a>
            )}
          </div>

          <a
            href={`/t/${tagId}/vcard`}
            className="mt-3 w-full rounded-2xl bg-accent-500 px-4 py-3.5 text-center font-bold text-brand-900 shadow-lg shadow-accent-500/30 transition hover:bg-accent-500/90 active:scale-[0.98]"
          >
            Save to contacts
          </a>
        </div>
      </div>
    </main>
  );
}
