import Image from "next/image";
import { PROFILE_BANNER_URL } from "@/lib/constants";
import type { TemplateProps } from "./index";
import { ActionBar } from "../ui/action-bar";
import { HeroChips, ProfileBody } from "../ui/profile-body";

// Banner + overlapping round portrait, name centred, then solid action tiles.
export function ClassicTemplate(props: TemplateProps) {
  const { profile } = props;
  const roleLine = [profile.job_title, profile.company].filter(Boolean).join(" · ");

  return (
    <main className="profile-ui flex-1 bg-ios-bg text-ios-label">
      <div className="fade-up mx-auto w-full max-w-md">
        <header>
          <div className="relative h-40 overflow-hidden sm:mt-6 sm:rounded-4xl">
            <div
              className="absolute inset-0 bg-slate-300 bg-cover bg-center"
              style={{ backgroundImage: `url(${PROFILE_BANNER_URL})` }}
            />
            <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/30 to-transparent" />
            <HeroChips
              {...props}
              tone="photo"
              className="absolute inset-x-0 top-0 p-4 pt-[max(1rem,env(safe-area-inset-top))]"
            />
          </div>

          <div className="flex flex-col items-center px-4 text-center">
            <div className="relative -mt-14 size-28 overflow-hidden rounded-full bg-brand-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] ring-4 ring-ios-bg">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name ?? "Profile photo"}
                  width={112}
                  height={112}
                  priority={!props.preview}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-4xl font-bold text-brand-700">
                  {(profile.full_name ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.02em]">
              {profile.full_name}
            </h1>
            {roleLine && <p className="mt-0.5 text-[15px] text-ios-label-2">{roleLine}</p>}
            {profile.tagline && <p className="mt-0.5 text-[15px] text-ios-label-2">{profile.tagline}</p>}
            <ActionBar {...props} variant="solid" className="mt-5 w-full" />
          </div>
        </header>

        <ProfileBody {...props} />
      </div>
    </main>
  );
}
