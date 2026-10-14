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
  unboxing: (() => {
    const video = "https://res.cloudinary.com/dhxi75eld/video/upload";
    const clip = "v1789104655/kling_20260911_VIDEO_Create_smo_2089_0_xye0fj";
    // c_crop,h_0.9,g_north trims the bottom 10% (generator watermark).
    const crop = "c_crop,h_0.9,g_north";
    return {
      // ki_0.2 = a keyframe every 0.2s, so scroll-scrubbing (including
      // backwards) seeks smoothly instead of stuttering between the
      // default ~2s keyframes. ~1 MB vs ~0.6 MB without it.
      video: `${video}/${crop}/w_1280,q_auto,ki_0.2/${clip}.mp4`,
      firstFrame: `${video}/${crop}/so_0,w_1280,q_auto,f_auto/${clip}.jpg`,
      lastFrame: `${video}/${crop}/so_5.9,w_1280,q_auto,f_auto/${clip}.jpg`,
    };
  })(),
  // Order matches dict.home.gallery.items.
  gallery: [
    cloudinary(`${base}/v1789025285/ChatGPT_Image_Sep_10_2026_02_59_11_PM_dhpx6b.png`, 1000),
    cloudinary(`${base}/v1789025282/ChatGPT_Image_Sep_10_2026_03_00_56_PM_u31ljz.png`, 1000),
    cloudinary(`${base}/v1789025270/ChatGPT_Image_Sep_10_2026_02_57_04_PM_hwvubn.png`, 1000),
    cloudinary(`${base}/v1789025560/ChatGPT_Image_Sep_10_2026_03_31_50_PM_xcvlyr.png`, 1000),
  ],
};
