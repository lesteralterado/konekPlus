import type { Profile, ProfileTemplate } from "@/lib/types";
import { ClassicTemplate } from "./classic";
import { EditorialTemplate } from "./editorial";
import { MinimalTemplate } from "./minimal";

export const TEMPLATES: Record<
  ProfileTemplate,
  (props: { profile: Profile; tagId: string; isOwner: boolean }) => React.ReactElement
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

export function ProfileTemplateView(props: {
  profile: Profile;
  tagId: string;
  isOwner: boolean;
}) {
  const Template = TEMPLATES[props.profile.template] ?? ClassicTemplate;
  return <Template {...props} />;
}
