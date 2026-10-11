// Inserts Cloudinary's auto-format (AVIF/WebP), auto-quality and resize
// transforms into a delivery URL. The originals are 0.6–2 MB PNG/JPG
// renders; this serves them at ~1–5% of that size.
export function cloudinary(url: string, width: number): string {
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width}/`);
}
