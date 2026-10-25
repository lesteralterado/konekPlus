import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { PortfolioItem, ProfileTestimonial, PublicProfile } from "@/lib/types";

// Everything a visitor sees on a card page, cached on the server for 60s so
// repeat taps (and the card owner showing it around) don't hit the
// database each time. Only public data goes in: it's read with the
// cookie-free anon client through the per-card RPCs from 0022, so the cache
// can never hold anything viewer-specific.
//
// Invalidated instantly (revalidateTag) when it changes — see
// src/lib/card-cache.ts for the tags and who calls them.

export type PublicCard = {
  profile: PublicProfile;
  portfolio: PortfolioItem[];
  testimonials: ProfileTestimonial[];
};

export const cardTag = (tagId: string) => `card:${tagId}`;
export const profileTag = (profileId: string) => `profile:${profileId}`;

const CARD_TTL_SECONDS = 60;

// Which profile a card points to (null = unclaimed, switched off or unknown).
function getCardProfileId(tagId: string) {
  return unstable_cache(
    async () => {
      const { data } = await createPublicClient().rpc("get_public_profile", { p_tag_id: tagId });
      return data?.[0]?.id ?? null;
    },
    ["card-profile-id", tagId],
    { revalidate: CARD_TTL_SECONDS, tags: [cardTag(tagId)] },
  )();
}

export async function getPublicCard(tagId: string): Promise<PublicCard | null> {
  const profileId = await getCardProfileId(tagId);
  if (!profileId) return null;

  // Tagged with both the card and the profile: switching the card off clears
  // it via the card tag, an owner edit clears all their cards via the profile tag.
  return unstable_cache(
    async (): Promise<PublicCard | null> => {
      const supabase = createPublicClient();
      const [{ data: rows }, { data: portfolio }, { data: testimonials }] = await Promise.all([
        supabase.rpc("get_public_profile", { p_tag_id: tagId }),
        supabase.rpc("get_public_portfolio", { p_tag_id: tagId }),
        supabase.rpc("get_public_testimonials", { p_tag_id: tagId }),
      ]);
      const profile = rows?.[0];
      if (!profile) return null;
      return { profile, portfolio: portfolio ?? [], testimonials: testimonials ?? [] };
    },
    ["public-card", tagId],
    { revalidate: CARD_TTL_SECONDS, tags: [cardTag(tagId), profileTag(profileId)] },
  )();
}
