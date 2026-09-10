import Image from "next/image";
import Link from "next/link";
import {
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/app/dashboard/icons";
import { PROFILE_BANNER_URL } from "@/lib/constants";
import type { Profile } from "@/lib/types";

const SOCIAL_ORDER = [
  "linkedin",
  "instagram",
  "facebook",
  "tiktok",
  "whatsapp",
  "youtube",
  "website",
] as const;

const SOCIAL_ICONS: Record<string, typeof GlobeIcon> = {
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  whatsapp: WhatsAppIcon,
  youtube: YouTubeIcon,
  website: GlobeIcon,
};

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  website: "Website",
};

export function PublicProfile({
  profile,
  tagId,
  isOwner,
}: {
  profile: Profile;
  tagId: string;
  isOwner: boolean;
}) {
  const allSocials = profile.socials ?? {};
  const socials = [
    ...SOCIAL_ORDER.map((key) => [key, allSocials[key]] as const),
    ...Object.entries(allSocials).filter(
      ([key]) => !(SOCIAL_ORDER as readonly string[]).includes(key),
    ),
  ].filter(([, url]) => url);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.18)]">
        <div className="relative h-40 sm:h-48">
          <div
            className="absolute inset-0 bg-slate-200 bg-cover bg-center"
            style={{ backgroundImage: `url(${PROFILE_BANNER_URL})` }}
          />
          {isOwner && (
            <Link
              href="/dashboard"
              className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-brand-700 shadow-sm backdrop-blur transition hover:bg-white"
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
          <h1 className="mt-4 text-2xl font-bold text-brand-900">
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
                className="rounded-2xl border-2 border-slate-200 px-4 py-3.5 text-center font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                Call {profile.phone}
              </a>
            )}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="rounded-2xl border-2 border-slate-200 px-4 py-3.5 text-center font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                Email {profile.email}
              </a>
            )}
            <a
              href={`/t/${tagId}/vcard`}
              className="rounded-2xl bg-brand-600 px-4 py-3.5 text-center font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              Save to contacts
            </a>
          </div>

          {socials.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {socials.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key] ?? GlobeIcon;
                const label = SOCIAL_LABELS[key] ?? key;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-brand-700"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
