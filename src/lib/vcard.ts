import type { Profile } from "@/lib/types";

function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildVCard(profile: Profile): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];

  const name = profile.full_name?.trim() || "";
  lines.push(`FN:${escapeVCardValue(name)}`);
  lines.push(`N:${escapeVCardValue(name)};;;;`);

  if (profile.job_title) {
    lines.push(`TITLE:${escapeVCardValue(profile.job_title)}`);
  }
  if (profile.company) {
    lines.push(`ORG:${escapeVCardValue(profile.company)}`);
  }
  if (profile.phone) {
    lines.push(`TEL;TYPE=CELL:${escapeVCardValue(profile.phone)}`);
  }
  if (profile.email) {
    lines.push(`EMAIL:${escapeVCardValue(profile.email)}`);
  }
  for (const [label, url] of Object.entries(profile.socials ?? {})) {
    if (url) lines.push(`URL;TYPE=${escapeVCardValue(label)}:${escapeVCardValue(url)}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}
