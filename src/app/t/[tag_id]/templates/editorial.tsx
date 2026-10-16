import Image from "next/image";
import type { TemplateProps } from "./index";
import { ActionBar } from "../ui/action-bar";
import { HeroChips, ProfileBody } from "../ui/profile-body";

// iOS Contact Poster: full-bleed photo, large name over a soft blurred
// fade, and a frosted action bar floating on the photo's bottom edge.
export function EditorialTemplate(props: TemplateProps) {
  const { profile, preview } = props;
  const roleLine = [profile.job_title, profile.company].filter(Boolean).join(" · ");

  return (
    <main className="profile-ui flex-1 bg-ios-bg text-ios-label">
      <div className="fade-up mx-auto w-full max-w-md">
        <header
          className={`relative overflow-hidden bg-brand-900 sm:mt-6 sm:rounded-4xl ${
            preview ? "h-140" : "h-[64svh] max-h-170 min-h-110"
          }`}
        >
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? "Profile photo"}
              fill
              priority={!preview}
              sizes="(min-width: 640px) 448px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-linear-to-br from-brand-600 to-brand-900 text-9xl font-bold text-white/20">
              {(profile.full_name ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}

          {/* Top scrim for the chips, bottom progressive blur + scrim for the text. */}
          <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 backdrop-blur-xl mask-[linear-gradient(to_top,black_35%,transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/75 via-black/30 to-transparent" />

          <HeroChips
            {...props}
            tone="photo"
            className="absolute inset-x-0 top-0 p-4 pt-[max(1rem,env(safe-area-inset-top))]"
          />

          <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
            <h1 className="px-1 text-[34px] font-bold leading-[1.08] tracking-[-0.02em] text-white">
              {profile.full_name}
            </h1>
            {roleLine && <p className="mt-1 px-1 text-[15px] font-medium text-white/80">{roleLine}</p>}
            {profile.tagline && (
              <p className="mt-0.5 px-1 text-[15px] text-white/65">{profile.tagline}</p>
            )}
            <ActionBar {...props} variant="glass" className="mt-4" />
          </div>
        </header>

        <ProfileBody {...props} />
      </div>
    </main>
  );
}
