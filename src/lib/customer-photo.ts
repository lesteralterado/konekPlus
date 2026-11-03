import "server-only";
import { CONSENT_TEXT_VERSION } from "@/lib/photo-consent";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// The bucket limit is 1.5 MiB; the app sends ~250 KB.
const MAX_BYTES = 1_500_000;

// A card owner's own photo: check it, put it in their own folder of the
// private bucket, and register it as awaiting review (0029). Shared by the
// "photo with your card" offer and the review form, so both apply the same
// checks. The caller has already checked consent and rate limits. Returns the
// new photo's id, or a message safe to show.
export async function storeMyPhoto(
  supabase: Supabase,
  userId: string,
  file: File,
  consent: { social: boolean; website: boolean },
): Promise<{ id: string } | { error: string }> {
  if (file.size === 0) return { error: "Choose a photo first." };
  if (file.size > MAX_BYTES) return { error: "That photo is too big — try again." };
  const head = new Uint8Array(await file.slice(0, 3).arrayBuffer());
  if (head[0] !== 0xff || head[1] !== 0xd8 || head[2] !== 0xff) {
    return { error: "The photo must be a JPEG image." };
  }

  // Own folder only: the storage policy lets owners write nowhere else.
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("customer-photos")
    .upload(path, file, { contentType: "image/jpeg" });
  if (uploadError) return { error: "We couldn't upload your photo. Please try again." };

  const { data: id, error } = await supabase.rpc("submit_customer_photo", {
    p_path: path,
    p_consent_social: consent.social,
    p_consent_website: consent.website,
    p_text_version: CONSENT_TEXT_VERSION,
  });
  if (error || !id) {
    // Not eligible (e.g. a photo is already on file for this order): don't
    // leave the file behind.
    await supabase.storage.from("customer-photos").remove([path]);
    return { error: "We couldn't save your photo. It may already be on file." };
  }

  return { id };
}
