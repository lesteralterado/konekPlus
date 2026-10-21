// The exact link staff paste into NFC Tools when writing a social keychain.
// Customers paste whatever their app's "Share" button gave them, which
// usually drags tracking junk along (?igsh=…, ?mibextid=…, ?_t=…). That
// makes the chip's URL longer (small NTAG213 chips hold ~130 chars) and
// leaks share-tracking IDs, so strip it. Computed at render time — the
// customer's original stays in keychain_items.profile_url untouched.

const DROP_ALL_QUERY = /(^|\.)(instagram\.com|tiktok\.com|instagr\.am)$/i;
const FACEBOOK = /(^|\.)(facebook\.com|fb\.com|fb\.me)$/i;
const TRACKING_PARAM = /^(utm_.+|fbclid|gclid|si|igsh|igshid|mibextid|rdid|share_url|_t|_r|is_from_webapp|sender_device)$/i;

export function cleanProfileUrl(raw: string): string {
  const input = raw.trim();
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return input;
  }
  if (url.protocol === "http:") url.protocol = "https:";
  if (url.protocol !== "https:") return input;

  url.hash = "";
  const host = url.hostname;
  if (DROP_ALL_QUERY.test(host)) {
    url.search = "";
  } else if (FACEBOOK.test(host)) {
    // profile.php?id=123 is the only query Facebook links actually need.
    const id = url.searchParams.get("id");
    url.search = id ? `?id=${encodeURIComponent(id)}` : "";
  } else {
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAM.test(key)) url.searchParams.delete(key);
    }
  }

  let out = url.toString();
  // Trim a trailing slash on a path (…/share/AbC/ → …/share/AbC), never the bare host's.
  if (url.pathname.length > 1 && !url.search) out = out.replace(/\/$/, "");
  return out.replace(/\?$/, "");
}
