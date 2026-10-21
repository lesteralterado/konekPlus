// The URL written onto a Konek+ NFC card: {SITE_URL}/t/{code}. Chips are
// written once and can't follow a domain change, so SITE_URL must be the
// permanent production domain before cards are written in bulk.

export function siteOrigin(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

// Pure, so client components can build links from an origin passed as a prop.
export function cardUrl(origin: string, tagId: string): string {
  return `${origin.replace(/\/+$/, "")}/t/${tagId}`;
}
