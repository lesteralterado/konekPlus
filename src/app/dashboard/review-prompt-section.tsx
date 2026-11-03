import { getLocale } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { ReviewPrompt } from "./review-prompt";

// "Elena Marie Cruz" → "Elena C.": a safe default for the name shown with a
// review. The customer can change it in the form.
function displayNameFrom(fullName: string | null): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// The dashboard's "How's your Konek+?" review prompt. Only for owners who've
// activated a card from an order; a review already sent shows its status,
// with a way to remove it.
export async function ReviewPromptSection({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_review_prompt");
  const row = data?.[0];
  if (!row) return null;

  const review =
    row.review_id && row.status
      ? { id: row.review_id, status: row.status, published: !!row.published }
      : null;
  if (!review && !row.eligible) return null;

  return (
    <ReviewPrompt
      eligible={row.eligible}
      review={review}
      autoOpen={!profile.review_prompt_seen_at}
      defaultName={displayNameFrom(profile.full_name)}
      defaultLocale={await getLocale()}
    />
  );
}
