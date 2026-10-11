import { cloudinary } from "@/lib/cloudinary";

const base = "https://res.cloudinary.com/dhxi75eld/image/upload";

// Widths are ~2x each image's largest rendered size, for retina screens.
export const images = {
  heroBackground: cloudinary(
    `${base}/v1788155374/NFC_business_cards_render_2K_202608311349_wkunuq.jpg`,
    1920,
  ),
  aboutCard: cloudinary(
    `${base}/v1788159282/NFC_business_card_displayed_2K_202608311454_c1ho83.jpg`,
    1000,
  ),
  showcase: cloudinary(
    `${base}/v1788155884/Smartphone_tapping_NFC_business___202608311357_vcyllv.jpg`,
    1920,
  ),
  // Order matches dict.home.gallery.items.
  gallery: [
    cloudinary(`${base}/v1789025285/ChatGPT_Image_Sep_10_2026_02_59_11_PM_dhpx6b.png`, 1000),
    cloudinary(`${base}/v1789025282/ChatGPT_Image_Sep_10_2026_03_00_56_PM_u31ljz.png`, 1000),
    cloudinary(`${base}/v1789025270/ChatGPT_Image_Sep_10_2026_02_57_04_PM_hwvubn.png`, 1000),
    cloudinary(`${base}/v1789025560/ChatGPT_Image_Sep_10_2026_03_31_50_PM_xcvlyr.png`, 1000),
  ],
};
