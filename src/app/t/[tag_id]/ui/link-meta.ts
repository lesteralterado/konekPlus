// Human-readable subtitles for the "Social & links" rows, so a visitor sees
// *which* account a row opens (@lester, royals.dev) instead of a bare icon.

function parse(raw: string): URL | null {
  try {
    return new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
}

function hostOf(url: URL) {
  return url.hostname.replace(/^(www|m)\./, "");
}

// Path segments that are routing, not the account name.
const GENERIC_SEGMENTS = new Set(["in", "company", "channel", "c", "user", "profile.php", "share"]);

export function socialSubtitle(key: string, raw: string): string | null {
  const url = parse(raw);
  if (!url) return null;

  if (key === "whatsapp") {
    const digits = url.pathname.replace(/\D/g, "");
    return digits ? `+${digits}` : hostOf(url);
  }

  const handle = url.pathname
    .split("/")
    .filter((s) => s && !GENERIC_SEGMENTS.has(s.toLowerCase()))
    .at(0);
  if (!handle) return hostOf(url);
  return `@${decodeURIComponent(handle).replace(/^@/, "")}`;
}

export function linkSubtitle(raw: string): string | null {
  const url = parse(raw);
  if (!url) return null;
  const path = url.pathname.replace(/\/$/, "");
  const full = `${hostOf(url)}${path}`;
  return full.length > 40 ? `${full.slice(0, 39)}…` : full;
}
