import Image from "next/image";
import type { TemplateProps } from "./index";
import { ActionBar } from "../ui/action-bar";
import { HeroChips, ProfileBody } from "../ui/profile-body";

// Quiet, Contacts-app header: small portrait beside a left-aligned name,
// then round tinted actions. No banner, no photo hero.
export function MinimalTemplate(props: TemplateProps) {
  const { profile } = props;
  const roleLine = [profile.job_title, profile.company].filter(Boolean).join(" · ");

  return (
    <main className="profile-ui flex-1 bg-ios-bg text-ios-label">
      <div className="fade-up mx-auto w-full max-w-md">
        <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-8">
          <HeroChips {...props} tone="ios" />

          <div className="mt-7 flex items-center gap-4 px-1">
            <div className="relative size-18 shrink-0 overflow-hidden rounded-full bg-brand-100 ring-1 ring-ios-separator">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name ?? "Profile photo"}
                  width={72}
                  height={72}
                  priority={!props.preview}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-2xl font-bold text-brand-700">
                  {(profile.full_name ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">
                {profile.full_name}
              </h1>
              {roleLine && <p className="mt-0.5 text-[15px] text-ios-label-2">{roleLine}</p>}
            </div>
          </div>
          {profile.tagline && (
            <p className="mt-3 px-1 text-[15px] text-ios-label-2">{profile.tagline}</p>
          )}

          <ActionBar {...props} variant="round" className="mt-6" />
        </header>

        <ProfileBody {...props} />
      </div>
    </main>
  );
}
