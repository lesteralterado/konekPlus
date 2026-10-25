import "server-only";
import { revalidateTag } from "next/cache";
import { cardTag, profileTag } from "@/lib/public-card";

// Clear the cached public card data (src/lib/public-card.ts) right after
// something changes it, so the next visitor sees the update immediately.
// { expire: 0 } = never serve the stale copy (see revalidateTag docs).

// An owner edited their profile, portfolio or testimonials → every card
// that shows that profile.
export function refreshProfileCards(profileId: string | null | undefined) {
  if (profileId) revalidateTag(profileTag(profileId), { expire: 0 });
}

// A card itself changed: claimed, switched on/off, or reset.
export function refreshCard(tagId: string) {
  revalidateTag(cardTag(tagId), { expire: 0 });
}
