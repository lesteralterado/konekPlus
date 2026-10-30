// Turns whatever a phone camera or file picker hands over (often 3–8 MB)
// into a web-sized JPEG (~250 KB at 1280px), so it fits Vercel's ~4.5 MB
// request limit and the storage budget. The sibling of crop-image.ts, which
// only makes square avatars.
//
// createImageBitmap honours the EXIF orientation, so a portrait photo from a
// phone isn't saved sideways.
export async function resizeImageToJpeg(
  file: Blob,
  maxEdge = 1280,
  quality = 0.8,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Failed to resize image."))),
        "image/jpeg",
        quality,
      );
    });
  } finally {
    bitmap.close();
  }
}
