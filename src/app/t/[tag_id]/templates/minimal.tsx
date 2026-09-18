import Image from "next/image";
import Link from "next/link";
import { PhoneIcon, MailIcon } from "@/app/dashboard/icons";
import type { Profile } from "@/lib/types";
import { getOrderedSocials } from "./social-list";

function BadgeCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 1.5l2.4 1.4 2.7-.3 1.3 2.4 2.4 1.3-.3 2.7 1.4 2.4-1.4 2.4.3 2.7-2.4 1.3-1.3 2.4-2.7-.3L12 22.5l-2.4-1.4-2.7.3-1.3-2.4-2.4-1.3.3-2.7L2.1 12.6l1.4-2.4-.3-2.7 2.4-1.3 1.3-2.4 2.7.3z" />
      <path
        d="M8.5 12.3l2.2 2.2 4.8-4.8"
        fill="none"
        stroke="white"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAction({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      aria-label={label}
      title={label}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-300 hover:text-brand-700 active:scale-95"
    >
      {children}
    </a>
  );
}

export function MinimalTemplate({
  profile,
  tagId,
  isOwner,
}: {
  profile: Profile;
  tagId: string;
  isOwner: boolean;
}) {
  const socials = getOrderedSocials(profile.socials);
  const tagline = [profile.job_title, profile.company].filter(Boolean).join(" · ");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="fade-up relative overflow-hidden rounded-[2.5rem] bg-white px-6 pb-9 pt-12 text-center shadow-[0_8px_40px_-12px_rgba(15,23,42,0.14)]">
        {isOwner && (
          <Link
            href="/dashboard"
            className="absolute right-4 top-4 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-500 transition hover:border-brand-300 hover:text-brand-700 active:scale-95"
          >
            Edit
          </Link>
        )}

        <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full bg-brand-100 ring-1 ring-slate-100">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? "Profile photo"}
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand-700">
              {(profile.full_name ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          <h1 className="text-xl font-bold tracking-tight text-brand-900">
            {profile.full_name}
          </h1>
          <BadgeCheckIcon className="h-[18px] w-[18px] text-brand-600" />
        </div>
        {tagline && <p className="mt-0.5 text-sm text-slate-400">{tagline}</p>}

        <a
          href={`/t/${tagId}/vcard`}
          className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 active:scale-[0.98]"
        >
          Save to contacts
        </a>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {profile.phone && (
            <IconAction href={`tel:${profile.phone}`} label="Call">
              <PhoneIcon className="h-[18px] w-[18px]" />
            </IconAction>
          )}
          {profile.email && (
            <IconAction href={`mailto:${profile.email}`} label="Email">
              <MailIcon className="h-[18px] w-[18px]" />
            </IconAction>
          )}
          {socials.map(({ key, url, Icon, label }) => (
            <IconAction key={key} href={url} label={label}>
              <Icon className="h-[18px] w-[18px]" />
            </IconAction>
          ))}
        </div>
      </div>
    </main>
  );
}
