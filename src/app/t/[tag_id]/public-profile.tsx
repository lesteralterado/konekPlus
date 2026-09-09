import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@/lib/types";

export function PublicProfile({
  profile,
  tagId,
  isOwner,
}: {
  profile: Profile;
  tagId: string;
  isOwner: boolean;
}) {
  const socials = Object.entries(profile.socials ?? {}).filter(
    ([, url]) => url,
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
      {isOwner && (
        <Link
          href="/dashboard"
          className="mb-6 self-center rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100/80"
        >
          Edit your profile
        </Link>
      )}

      <div className="flex flex-col items-center text-center">
        <div className="h-24 w-24 overflow-hidden rounded-full bg-brand-100">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? "Profile photo"}
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-brand-700">
              {(profile.full_name ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-brand-900">
          {profile.full_name}
        </h1>
        {(profile.job_title || profile.company) && (
          <p className="mt-1 text-slate-500">
            {[profile.job_title, profile.company].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {profile.phone && (
          <a
            href={`tel:${profile.phone}`}
            className="rounded-xl border border-slate-200 px-4 py-3 text-center font-medium text-slate-700 hover:border-brand-300"
          >
            Call {profile.phone}
          </a>
        )}
        {profile.email && (
          <a
            href={`mailto:${profile.email}`}
            className="rounded-xl border border-slate-200 px-4 py-3 text-center font-medium text-slate-700 hover:border-brand-300"
          >
            Email {profile.email}
          </a>
        )}
        <a
          href={`/t/${tagId}/vcard`}
          className="rounded-xl bg-brand-600 px-4 py-3 text-center font-medium text-white hover:bg-brand-700"
        >
          Save to contacts
        </a>
      </div>

      {socials.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {socials.map(([label, url]) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium capitalize text-slate-600 hover:bg-slate-200"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
