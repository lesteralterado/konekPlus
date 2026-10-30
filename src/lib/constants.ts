import { cloudinary } from "./cloudinary";

// Static placeholder banner shown behind the avatar on the profile card
// (dashboard editor + public /t/[tag_id] view) — swap for a real brand
// asset or per-profile upload later.
export const PROFILE_BANNER_URL = cloudinary(
  "https://res.cloudinary.com/dhxi75eld/image/upload/v1788159282/NFC_business_card_displayed_2K_202608311454_c1ho83.jpg",
  1000,
);

// The Konek+ mark — landing nav/footer, site chrome, and favicon all
// reference this asset, preloaded in layout.tsx so it's ready by the time
// the preloader lifts.
export const LOGO_SOURCE_URL =
  "https://res.cloudinary.com/dhxi75eld/image/upload/v1788160699/Untitled_design_4_cfbrps.png";
export const LOGO_URL = cloudinary(LOGO_SOURCE_URL, 160);

// Square, opaque PNG of the mark for home-screen icons (PWA / iOS), padded
// on white so the OS icon mask doesn't crop it.
export function appIconUrl(size: number): string {
  return LOGO_SOURCE_URL.replace(
    "/image/upload/",
    `/image/upload/c_pad,b_white,w_${size},h_${size},f_png/`,
  );
}

// Placeholder support inbox referenced by the Privacy Policy and Terms of
// Service (src/app/(legal)/) — swap for a real, monitored inbox before
// launch.
export const LEGAL_CONTACT_EMAIL = "privacy@konek.plus";

// Valid destinations for the standalone feedback page (src/app/f/[slug]/),
// meant to be printed as a QR code or written to a dedicated NFC feedback
// card. One fixed slug for now — add more here (and give them their own
// admin-visible labels) if per-location/per-event tracking is ever needed;
// src/app/admin/feedback/page.tsx already surfaces page_path per submission,
// which is what actually distinguishes one slug's feedback from another's.
export const FEEDBACK_SLUGS = ["card"] as const;
