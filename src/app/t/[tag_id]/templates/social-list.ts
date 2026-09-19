import {
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  PinterestIcon,
  ThreadsIcon,
  TikTokIcon,
  WhatsAppIcon,
  XIcon,
  YouTubeIcon,
} from "@/app/dashboard/icons";
import type { Socials } from "@/lib/types";

const SOCIAL_ORDER = [
  "linkedin",
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "threads",
  "pinterest",
  "whatsapp",
  "youtube",
] as const;

const SOCIAL_ICONS: Record<string, typeof GlobeIcon> = {
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  x: XIcon,
  threads: ThreadsIcon,
  pinterest: PinterestIcon,
  whatsapp: WhatsAppIcon,
  youtube: YouTubeIcon,
};

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
  threads: "Threads",
  pinterest: "Pinterest",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
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
