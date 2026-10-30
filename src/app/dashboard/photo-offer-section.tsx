import { getLocale } from "@/lib/i18n/locale";
import { PHOTO_FREEBIE } from "@/lib/photo-freebie";
import { createClient } from "@/lib/supabase/server";
import { PhotoOffer } from "./photo-offer";

// The dashboard's "photo with your card" card. Nobody is offered (or promised)
// anything until PHOTO_FREEBIE.offerToCustomers is switched on; a photo the
// owner already sent always shows its status, with a way to remove it.
export async function PhotoOfferSection() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_photo_offer");
  const row = data?.[0];
  if (!row) return null;

  const photo =
    row.photo_id && row.status && row.freebie_status
      ? { id: row.photo_id, status: row.status, freebieStatus: row.freebie_status }
      : null;
  const eligible = PHOTO_FREEBIE.offerToCustomers && row.eligible;
  if (!photo && !eligible) return null;

  return (
    <PhotoOffer
      eligible={eligible}
      photo={photo}
      customerText={PHOTO_FREEBIE.customerText}
      defaultLocale={await getLocale()}
    />
  );
}
