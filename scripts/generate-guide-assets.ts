// Builds the web-ready unboxing-guide images in public/guide/ from the
// source leaflet render (scripts/guide-source/). The originals were
// 2 MB SVGs wrapping this same raster, so we re-crop it ourselves:
// two full halves (desktop) and six single panels (mobile carousel).
//
// Run: npx tsx scripts/generate-guide-assets.ts
import path from "node:path";
import sharp from "sharp";

const SRC = path.join(__dirname, "guide-source");
const OUT = path.join(__dirname, "..", "public", "guide");

type Rect = { left: number; top: number; width: number; height: number };

// Coordinates are in the 1536x1024 source. Panel seams sit at x≈517/1008
// (outside) and x≈530/1013 (inside); the paper is photographed with a slight
// perspective, so edges are inset a few px to avoid bleeding neighbours.
const OUTSIDE = { top: 18, height: 468 };
const INSIDE = { top: 508, height: 484 };

const crops: Record<string, Rect> = {
  "outside": { left: 104, width: 1346, ...OUTSIDE },
  "inside": { left: 84, width: 1374, ...INSIDE },
  "outside-1": { left: 104, width: 417, ...OUTSIDE },
  "outside-2": { left: 514, width: 498, ...OUTSIDE },
  "outside-3": { left: 1005, width: 445, ...OUTSIDE },
  "inside-1": { left: 84, width: 450, ...INSIDE },
  "inside-2": { left: 527, width: 490, ...INSIDE },
  "inside-3": { left: 1010, width: 448, ...INSIDE },
};

async function main() {
  // Mask is a greyscale PNG (white = paper). Interleave it as the alpha channel
  // by hand — sharp's joinChannel drops it for RGB inputs.
  const W = 1536;
  const H = 1024;
  const mask = await sharp(path.join(SRC, "leaflet-mask.png"))
    .greyscale()
    .raw()
    .toBuffer();
  const rgb = await sharp(path.join(SRC, "leaflet.png")).removeAlpha().raw().toBuffer();
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    rgba[i * 4] = rgb[i * 3];
    rgba[i * 4 + 1] = rgb[i * 3 + 1];
    rgba[i * 4 + 2] = rgb[i * 3 + 2];
    rgba[i * 4 + 3] = mask[i];
  }
  const masked = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();

  for (const [name, rect] of Object.entries(crops)) {
    const file = path.join(OUT, `${name}.webp`);
    const info = await sharp(masked).extract(rect).webp({ quality: 84, effort: 6 }).toFile(file);
    console.log(`${name}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
  }
}

main();
