import {
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/app/dashboard/icons";
import type { Socials } from "@/lib/types";

const SOCIAL_ORDER = [
  "linkedin",
  "instagram",
  "facebook",
  "tiktok",
  "whatsapp",
  "youtube",
  "website",
] as const;

const SOCIAL_ICONS: Record<string, typeof GlobeIcon> = {
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  whatsapp: WhatsAppIcon,
  youtube: YouTubeIcon,
  website: GlobeIcon,
};

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  website: "Website",
};

export function getOrderedSocials(socials: Socials | null) {
  const all = socials ?? {};
  return [
    ...SOCIAL_ORDER.map((key) => [key, all[key]] as const),
    ...Object.entries(all).filter(
      ([key]) => !(SOCIAL_ORDER as readonly string[]).includes(key),
    ),
  ]
    .filter(([, url]) => url)
    .map(([key, url]) => ({
      key,
      url,
      Icon: SOCIAL_ICONS[key] ?? GlobeIcon,
      label: SOCIAL_LABELS[key] ?? key,
    }));
}
