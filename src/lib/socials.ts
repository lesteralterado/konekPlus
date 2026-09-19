// Lets people type a bare handle (or paste a full profile URL — either is
// accepted) instead of having to construct the link themselves. Builders
// always produce a canonical URL; extractors reverse that for prefilling the
// edit form, falling back to the raw stored value when it doesn't match the
// expected shape (e.g. a Facebook profile.php?id= link, which has no clean
// handle to show).

function isFullUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function bareHandle(value: string): string {
  return value.trim().replace(/^@/, "").replace(/^\/+|\/+$/g, "");
}

export function buildLinkedInUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (isFullUrl(trimmed)) return trimmed;
  return `https://www.linkedin.com/in/${bareHandle(trimmed)}`;
}

export function buildInstagramUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (isFullUrl(trimmed)) return trimmed;
  return `https://www.instagram.com/${bareHandle(trimmed)}`;
}

export function buildFacebookUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (isFullUrl(trimmed)) return trimmed;
  return `https://www.facebook.com/${bareHandle(trimmed)}`;
}

export function buildTikTokUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (isFullUrl(trimmed)) return trimmed;
  return `https://www.tiktok.com/@${bareHandle(trimmed)}`;
}

export function buildWhatsAppUrl(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}

export function buildXUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (isFullUrl(trimmed)) return trimmed;
  return `https://x.com/${bareHandle(trimmed)}`;
}

export function buildThreadsUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (isFullUrl(trimmed)) return trimmed;
  return `https://www.threads.net/@${bareHandle(trimmed)}`;
}

export function buildPinterestUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (isFullUrl(trimmed)) return trimmed;
  return `https://www.pinterest.com/${bareHandle(trimmed)}/`;
}

export function buildWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return isFullUrl(trimmed) ? trimmed : `https://${trimmed}`;
}

const HANDLE_PATTERNS = {
  linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/([^/?#]+)/i,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/([^/?#]+)/i,
  facebook: /^https?:\/\/(www\.)?facebook\.com\/([^/?#]+)/i,
  tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@?([^/?#]+)/i,
  x: /^https?:\/\/(www\.)?(?:x|twitter)\.com\/([^/?#]+)/i,
  threads: /^https?:\/\/(www\.)?threads\.net\/@?([^/?#]+)/i,
  pinterest: /^https?:\/\/(www\.)?pinterest\.[a-z.]+\/([^/?#]+)/i,
} as const;

export function extractHandle(
  platform: keyof typeof HANDLE_PATTERNS,
  url: string,
): string {
  if (!url) return "";
  if (platform === "facebook" && /\/profile\.php\?/i.test(url)) return url;
  const match = url.match(HANDLE_PATTERNS[platform]);
  return match ? match[2] : url;
}

export function extractWhatsAppNumber(url: string): string {
  const match = url.match(/^https?:\/\/(www\.)?wa\.me\/(\d+)/i);
  return match ? match[2] : url;
}
