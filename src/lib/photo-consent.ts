import { LEGAL_CONTACT_EMAIL } from "@/lib/constants";

// What the customer agrees to when we take a photo with them at handover.
// Three independent choices; nothing is pre-ticked. The text deliberately
// doesn't mention the freebie, so agreeing is never worded as a trade.
//
// CONSENT_TEXT_VERSION is saved on every photo (customer_photos, 0026) so we
// always know exactly what a customer saw. Bump it whenever any wording below
// changes in meaning, and keep the privacy policy in step.
export const CONSENT_TEXT_VERSION = 1;

// Private photos are deleted after this many months (the privacy policy
// says the same). Website and social copies stay until withdrawn. The
// deletion itself is purge_old_data() in 0027_photo_retention.sql — change
// the number there too.
export const PHOTO_RETENTION_MONTHS = 12;

export type ConsentLocale = "en" | "fil";

export type ConsentText = {
  intro: string;
  // The same choices, worded for a customer sending their own photo.
  selfIntro: string;
  record: string;
  social: string;
  website: string;
  age: string;
  withdraw: string;
};

export const CONSENT_TEXT: Record<ConsentLocale, ConsentText> = {
  en: {
    intro: "Konek+ would like to take a photo of you with your purchase. You choose what it may be used for.",
    selfIntro: "You're sending Konek+ a photo of you with your purchase. You choose what it may be used for.",
    record: `Keep this photo privately as our record of your handover. We delete it after ${PHOTO_RETENTION_MONTHS} months.`,
    social: "Konek+ may post this photo on its social media pages.",
    website: "Konek+ may show this photo on its website, next to your feedback.",
    age: "I am 18 or older, or a parent or guardian has agreed.",
    withdraw: `You can change your mind any time: message us at ${LEGAL_CONTACT_EMAIL}. We'll remove the photo from our website and storage, and take down any social media post on request.`,
  },
  fil: {
    intro: "Nais ng Konek+ na kumuha ng litrato mo kasama ang binili mo. Ikaw ang pipili kung saan ito maaaring gamitin.",
    selfIntro: "Magpapadala ka sa Konek+ ng litrato mo kasama ang binili mo. Ikaw ang pipili kung saan ito maaaring gamitin.",
    record: `Itatago nang pribado ang litratong ito bilang tala ng pagkaka-abot sa iyo. Buburahin namin ito pagkalipas ng ${PHOTO_RETENTION_MONTHS} buwan.`,
    social: "Maaaring i-post ng Konek+ ang litratong ito sa mga social media page nito.",
    website: "Maaaring ipakita ng Konek+ ang litratong ito sa website nito, kasama ng iyong feedback.",
    age: "18 taong gulang pataas ako, o pumayag ang magulang o guardian ko.",
    withdraw: `Maaari kang magbago ng isip anumang oras: mag-message sa ${LEGAL_CONTACT_EMAIL}. Aalisin namin ang litrato sa aming website at storage, at ide-delete ang anumang social media post kapag hiniling.`,
  },
};
