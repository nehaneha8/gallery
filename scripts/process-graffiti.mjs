// Bedroom graffiti wall (ARCHITECTURE.md §12). The source is now a clean,
// hand-straightened/cropped photo of just the wall (with a white margin
// from export) — just trim the margin and compress.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = path.resolve('my_art/graffiti.png');
const OUT_DIR = path.resolve('public/bedroom');
const OUT = path.join(OUT_DIR, 'graffiti-wall.webp');
const MAX_EDGE = 2048;

await mkdir(OUT_DIR, { recursive: true });

await sharp(SRC)
  .trim({ threshold: 30 })
  .resize({ width: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 84 })
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`graffiti-wall: ${meta.width}x${meta.height} aspect=${(meta.width / meta.height).toFixed(4)}`);
