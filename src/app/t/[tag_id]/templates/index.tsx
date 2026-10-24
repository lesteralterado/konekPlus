import type { PortfolioItem, ProfileTemplate, PublicProfile, ProfileTestimonial } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import type { Locale } from "@/lib/i18n/locale";
import { ClassicTemplate } from "./classic";
import { EditorialTemplate } from "./editorial";
import { MinimalTemplate } from "./minimal";

export type TemplateProps = {
  // Public fields only (get_public_profile, 0022) — never user_id.
  profile: PublicProfile;
  tagId: string;
  isOwner: boolean;
  portfolioItems: PortfolioItem[];
  testimonials: ProfileTestimonial[];
  locale: Locale;
  dict: Dictionary["profile"];
  // Absolute URL of this profile — encoded in the share sheet QR.
  profileUrl: string;
  // Server-rendered QR SVG markup for profileUrl ("" in previews).
  qrSvg: string;
  // Rendered as a scaled thumbnail (dashboard template picker): fixed hero
  // height, no sticky bar/toasts/ids that assume a single live page.
  preview?: boolean;
};

export const TEMPLATES: Record<
  ProfileTemplate,
  (props: TemplateProps) => React.ReactElement
> = {
  classic: ClassicTemplate,
  editorial: EditorialTemplate,
  minimal: MinimalTemplate,
};

export const TEMPLATE_LABELS: Record<ProfileTemplate, string> = {
  classic: "Classic",
  editorial: "Editorial",
  minimal: "Minimal",
};

export function ProfileTemplateView(props: TemplateProps) {
  const Template = TEMPLATES[props.profile.template] ?? ClassicTemplate;
  return <Template {...props} />;
}
