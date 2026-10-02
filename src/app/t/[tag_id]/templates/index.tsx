import type { PortfolioItem, Profile, ProfileTemplate, ProfileTestimonial } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import type { Locale } from "@/lib/i18n/locale";
import { ClassicTemplate } from "./classic";
import { EditorialTemplate } from "./editorial";
import { MinimalTemplate } from "./minimal";

export type TemplateProps = {
  profile: Profile;
  tagId: string;
  isOwner: boolean;
  portfolioItems: PortfolioItem[];
  testimonials: ProfileTestimonial[];
  locale: Locale;
  dict: Dictionary["profile"];
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
