import Image from "next/image";
import type { ReactNode } from "react";
import { PROFILE_BANNER_URL } from "@/lib/constants";
import { extractHandle, extractWhatsAppNumber } from "@/lib/socials";
import type { Profile } from "@/lib/types";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  LinkIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PinterestIcon,
  SparkleIcon,
  ThreadsIcon,
  TikTokIcon,
  WhatsAppIcon,
  XIcon,
  YouTubeIcon,
} from "./icons";

const cardClass =
  "rounded-4xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6";
const iconChipClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700";

type HandleKey = "linkedin" | "instagram" | "facebook" | "tiktok" | "x" | "threads" | "pinterest";

// Display order for the read-only view; `handle` is how to shorten the stored
// URL (matches what the edit form prefills).
const SOCIALS: {
  key: string;
  label: string;
  icon: ReactNode;
  handle?: HandleKey;
  prefix?: string;
}[] = [
  { key: "youtube", label: "YouTube", icon: <YouTubeIcon /> },
  { key: "linkedin", label: "LinkedIn", icon: <LinkedInIcon />, handle: "linkedin" },
  { key: "instagram", label: "Instagram", icon: <InstagramIcon />, handle: "instagram", prefix: "@" },
  { key: "facebook", label: "Facebook", icon: <FacebookIcon />, handle: "facebook" },
  { key: "tiktok", label: "TikTok", icon: <TikTokIcon />, handle: "tiktok", prefix: "@" },
  { key: "whatsapp", label: "WhatsApp", icon: <WhatsAppIcon /> },
  { key: "x", label: "X (Twitter)", icon: <XIcon />, handle: "x", prefix: "@" },
  { key: "threads", label: "Threads", icon: <ThreadsIcon />, handle: "threads", prefix: "@" },
  { key: "pinterest", label: "Pinterest", icon: <PinterestIcon />, handle: "pinterest" },
];

function Row({
  icon,
  label,
  value,
  hidden = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  // Owner switched this off ("On card", 0022): kept on the account, but not
  // shown on the public card or in the saved contact.
  hidden?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className={`${iconChipClass} ${hidden ? "opacity-50" : ""}`}>{icon}</span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`truncate text-sm font-medium ${hidden ? "text-slate-400" : "text-slate-800"}`}>{value}</p>
      </div>
      {hidden && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          <EyeOffIcon className="h-3.5 w-3.5" />
          Hidden on your card
        </span>
      )}
    </div>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9.9 4.2A9.6 9.6 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.4 9.4 0 0 0 5.4-1.6" />
      <path d="M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

// Read-only preview of the profile — what the owner's contacts will see.
// The pencil switches the dashboard into edit mode.
export function ProfileSummary({
  profile,
  onEdit,
}: {
  profile: Profile;
  onEdit: () => void;
}) {
  const socials = SOCIALS.flatMap((s) => {
    const url = profile.socials?.[s.key];
    if (!url) return [];
    const value =
      s.key === "whatsapp"
        ? `+${extractWhatsAppNumber(url)}`
        : s.key === "youtube"
          ? "Connected"
          : `${s.prefix ?? ""}${extractHandle(s.handle!, url)}`;
    return [{ ...s, value }];
  });
  const hasContact = !!profile.phone || !!profile.email;
  const titleLine = [profile.job_title, profile.company].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.18)]">
        <div className="relative">
          <div
            className="h-36 bg-slate-200 bg-cover bg-center sm:h-40"
            style={{ backgroundImage: `url(${PROFILE_BANNER_URL})` }}
          />
          <button
            type="button"
            onClick={onEdit}
            className="ios-press absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-sm font-semibold text-brand-900 shadow-md backdrop-blur transition hover:bg-white"
          >
            <PencilIcon className="h-4 w-4" />
            Edit profile
          </button>
        </div>
        <div className="flex flex-col items-center px-6 pb-8 text-center">
          <div className="relative z-10 -mt-14 h-28 w-28 overflow-hidden rounded-full bg-brand-100 shadow-lg ring-4 ring-white">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt=""
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-brand-700">
                {(profile.full_name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <h2 className="mt-4 text-xl font-bold text-brand-900">{profile.full_name}</h2>
          {titleLine && <p className="mt-1 text-sm text-slate-500">{titleLine}</p>}
          {profile.tagline && (
            <p className="mt-2 max-w-xs text-sm italic text-slate-500">{profile.tagline}</p>
          )}
          {profile.bio && (
            <p className="mt-2 max-w-xs whitespace-pre-wrap text-sm text-slate-500">{profile.bio}</p>
          )}
          {!profile.job_title && !profile.tagline && !profile.bio && (
            <button
              type="button"
              onClick={onEdit}
              className="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Add your title, tagline and bio →
            </button>
          )}
        </div>
      </div>

      {hasContact && (
        <div className={cardClass}>
          <div className="flex flex-col divide-y divide-slate-100">
            {profile.phone && (
              <Row icon={<PhoneIcon />} label="Phone" value={profile.phone} hidden={profile.show_phone === false} />
            )}
            {profile.email && (
              <Row icon={<MailIcon />} label="Email" value={profile.email} hidden={profile.show_email === false} />
            )}
          </div>
        </div>
      )}

      {socials.length > 0 && (
        <div className={cardClass}>
          <h3 className="mb-3 text-sm font-semibold text-brand-900">Socials</h3>
          <div className="flex flex-col divide-y divide-slate-100">
            {socials.map((s) => (
              <Row key={s.key} icon={s.icon} label={s.label} value={s.value} />
            ))}
          </div>
        </div>
      )}

      {(profile.cta_label || profile.links.length > 0) && (
        <div className={cardClass}>
          <div className="flex flex-col divide-y divide-slate-100">
            {profile.cta_label && profile.cta_url && (
              <Row icon={<SparkleIcon />} label="Action button" value={profile.cta_label} />
            )}
            {profile.links.map((l) => (
              <Row key={`${l.label}-${l.url}`} icon={<LinkIcon />} label={l.label} value={l.url} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
