import { MailIcon, PhoneIcon } from "@/app/dashboard/icons";
import type { TemplateProps } from "../templates";
import { MessageIcon } from "./icons";
import { ActionItemContent, actionItemClass, type ActionVariant } from "./ios";
import { ShareAction } from "./share-sheet";

// Call · Message · Email · Share, as in the iOS contact card. Actions for
// missing fields drop out; Share is always there.
export function ActionBar({
  variant,
  profile,
  profileUrl,
  qrSvg,
  dict,
  className = "",
}: Pick<TemplateProps, "profile" | "profileUrl" | "qrSvg" | "dict"> & {
  variant: ActionVariant;
  className?: string;
}) {
  const icon = "h-5 w-5";
  const item = actionItemClass(variant);

  return (
    <nav aria-label={dict.contactSection} className={`flex gap-2 ${className}`}>
      {profile.phone && (
        <a href={`tel:${profile.phone}`} className={item}>
          <ActionItemContent variant={variant} icon={<PhoneIcon className={icon} />} label={dict.call} />
        </a>
      )}
      {profile.phone && (
        <a href={`sms:${profile.phone}`} className={item}>
          <ActionItemContent
            variant={variant}
            icon={<MessageIcon className={icon} />}
            label={dict.message}
          />
        </a>
      )}
      {profile.email && (
        <a href={`mailto:${profile.email}`} className={item}>
          <ActionItemContent variant={variant} icon={<MailIcon className={icon} />} label={dict.email} />
        </a>
      )}
      <ShareAction
        variant={variant}
        profileUrl={profileUrl}
        qrSvg={qrSvg}
        name={profile.full_name ?? "Konek+"}
        avatarUrl={profile.avatar_url}
        dict={dict}
      />
    </nav>
  );
}
