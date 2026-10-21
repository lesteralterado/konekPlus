import Link from "next/link";
import { GlobeIcon, MailIcon, PencilIcon, PhoneIcon } from "@/app/dashboard/icons";
import { LanguageSwitcher } from "@/app/language-switcher";
import type { TemplateProps } from "../templates";
import { PortfolioGrid } from "../templates/portfolio-grid";
import { getOrderedSocials } from "../templates/social-list";
import { TestimonialsSection } from "../templates/testimonials-section";
import { AboutCard } from "./about-card";
import { CopyRow } from "./copy-row";
import { ArrowUpRightIcon, UserPlusIcon } from "./icons";
import { glassChipClass, GroupedList, ListRow } from "./ios";
import { linkSubtitle, socialSubtitle } from "./link-meta";
import { StickySaveBar } from "./sticky-save-bar";
import { Toaster } from "@/components/toast";

const SAVE_ID = "save-contact";

// Language switcher + owner's Edit as glass chips in the hero's corners —
// replaces the row the switcher used to take above the card.
export function HeroChips({
  locale,
  isOwner,
  dict,
  tone,
  className = "",
}: Pick<TemplateProps, "locale" | "isOwner" | "dict"> & {
  tone: "photo" | "ios";
  className?: string;
}) {
  const chip =
    tone === "photo"
      ? `${glassChipClass} bg-black/25 text-white ring-1 ring-inset ring-white/15`
      : `${glassChipClass} bg-ios-glass text-ios-label ring-1 ring-inset ring-ios-separator`;

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className={chip}>
        <LanguageSwitcher locale={locale} variant={tone === "photo" ? "dark" : "ios"} />
      </div>
      {isOwner && (
        <Link href="/dashboard" className={`${chip} ios-press gap-1.5`}>
          <PencilIcon className="size-3.5" />
          {dict.editButton}
        </Link>
      )}
    </div>
  );
}

// Everything below the hero, shared by all three templates, ordered by what
// a visitor needs first: save → about → reach them → their work → proof.
export function ProfileBody({
  profile,
  tagId,
  portfolioItems,
  testimonials,
  dict,
  preview,
}: TemplateProps) {
  const vcardHref = `/t/${tagId}/vcard`;
  const name = profile.full_name ?? "Konek+";
  const socials = getOrderedSocials(profile.socials);
  const hasLinks = socials.length > 0 || profile.links.length > 0;

  return (
    <div className="flex flex-col gap-7 px-4 pb-10 pt-5">
      <div className="flex flex-col gap-2.5">
        <a
          id={preview ? undefined : SAVE_ID}
          href={vcardHref}
          className="ios-press flex h-13 items-center justify-center gap-2 rounded-full bg-ios-primary text-[17px] font-semibold text-ios-on-primary shadow-[0_8px_24px_-10px_rgba(11,43,60,0.55)]"
        >
          <UserPlusIcon className="size-5" />
          {dict.saveToContacts}
        </a>
        {profile.cta_label && profile.cta_url && (
          <a
            href={profile.cta_url}
            target="_blank"
            rel="noreferrer"
            className="ios-press flex h-13 items-center justify-center gap-1.5 rounded-full bg-accent-500/15 text-[17px] font-semibold text-ios-accent"
          >
            {profile.cta_label}
            <ArrowUpRightIcon className="size-4" />
          </a>
        )}
      </div>

      {profile.bio && <AboutCard heading={dict.about} bio={profile.bio} moreLabel={dict.more} />}

      {(profile.phone || profile.email) && (
        <GroupedList header={dict.contactSection}>
          {profile.phone && (
            <CopyRow
              href={`tel:${profile.phone}`}
              label={dict.phoneLabel}
              value={profile.phone}
              icon={<PhoneIcon className="size-4" />}
              iconClassName="bg-brand-600 text-white"
              copyLabel={dict.copy}
              copiedLabel={dict.copied}
            />
          )}
          {profile.email && (
            <CopyRow
              href={`mailto:${profile.email}`}
              label={dict.emailLabel}
              value={profile.email}
              icon={<MailIcon className="size-4" />}
              iconClassName="bg-accent-500 text-white"
              copyLabel={dict.copy}
              copiedLabel={dict.copied}
            />
          )}
        </GroupedList>
      )}

      {hasLinks && (
        <GroupedList header={dict.linksSection}>
          {socials.map(({ key, url, Icon, label }) => (
            <ListRow
              key={key}
              href={url}
              icon={<Icon className="size-4.5" />}
              title={label}
              subtitle={socialSubtitle(key, url)}
            />
          ))}
          {profile.links.map((link) => (
            <ListRow
              key={link.url}
              href={link.url}
              icon={<GlobeIcon className="size-4.5" />}
              title={link.label}
              subtitle={linkSubtitle(link.url)}
            />
          ))}
        </GroupedList>
      )}

      <PortfolioGrid items={portfolioItems} heading={dict.portfolioHeading} />

      <TestimonialsSection
        profileId={profile.id}
        ownerFirstName={name.split(" ")[0]}
        items={testimonials}
        dict={dict}
      />

      <Link
        href="/"
        className="mx-auto mt-2 text-[13px] font-medium text-ios-label-3 transition hover:text-ios-label-2"
      >
        {dict.madeWith}
      </Link>

      {!preview && (
        <>
          <StickySaveBar
            targetId={SAVE_ID}
            href={vcardHref}
            name={name}
            avatarUrl={profile.avatar_url}
            label={dict.saveShort}
          />
          <Toaster />
        </>
      )}
    </div>
  );
}
