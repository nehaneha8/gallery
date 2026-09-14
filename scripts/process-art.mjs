// One-time/rerunnable asset pipeline (ARCHITECTURE.md §13).
// Perspective correction/cropping is done by hand before this runs.
// This script only resizes + compresses already-rectified images to WebP.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC_DIR = path.resolve('my_art');
const OUT_DIR = path.resolve('public/art');
const MAX_EDGE = 1600;
const QUALITY = 82;

// rotationDeg corrects source photos whose pixel data doesn't match the
// artwork's real orientation (see ARCHITECTURE.md Artwork.imageRotationDeg).
const ARTWORKS = [
  { id: 'italy', file: 'italy.jpg' },
  { id: 'womanbaby', file: 'womanbaby.jpg', rotationDeg: 90 },
  { id: 'abstact', file: 'abstact.jpg' },
  { id: 'scream', file: 'scream.JPG' },
  { id: 'spider', file: 'spider.jpg' },
  { id: 'snake', file: 'snake.jpg' },
  { id: 'curler', file: 'curler.jpg' },
  { id: 'hands', file: 'hands.jpg' },
  { id: 'flower', file: 'flower.jpg' },
  { id: 'flower2', file: 'flower2.jpg' },
  { id: 'sunset', file: 'sunset.jpg' },
  { id: 'skull', file: 'skull.jpg' },
  { id: 'curtain', file: 'curtain.jpg' },
  { id: 'suits', file: 'suits.jpg' },
  { id: 'gm', file: 'gm.jpg' },
];

await mkdir(OUT_DIR, { recursive: true });

for (const art of ARTWORKS) {
  const srcPath = path.join(SRC_DIR, art.file);
  const outPath = path.join(OUT_DIR, `${art.id}.webp`);
  let pipeline = sharp(srcPath);
  if (art.rotationDeg) pipeline = pipeline.rotate(art.rotationDeg);
  const meta = await pipeline.metadata();
  const w = meta.width ?? MAX_EDGE;
  const h = meta.height ?? MAX_EDGE;
  const longEdge = Math.max(w, h);
  if (longEdge > MAX_EDGE) {
    pipeline = pipeline.resize({
      width: w >= h ? MAX_EDGE : undefined,
      height: h > w ? MAX_EDGE : undefined,
      fit: 'inside',
    });
  }
  await pipeline.webp({ quality: QUALITY }).toFile(outPath);
  const finalMeta = await sharp(outPath).metadata();
  console.log(
    `${art.id}: ${w}x${h} -> ${finalMeta.width}x${finalMeta.height} ` +
      `aspect=${(finalMeta.width / finalMeta.height).toFixed(4)}`,
  );
}
