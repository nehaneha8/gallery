// Environment textures (wallpaper/floor) sourced from references/ — these
// were mood-boards only in the original plan, but are now used directly as
// tiling material textures per the user's request for a less "flat/2D" look.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('public/textures');
await mkdir(OUT_DIR, { recursive: true });

const jobs = [
  { src: 'references/wallpaper/wallpaper.jpg', out: 'wallpaper.webp', width: 512 },
  { src: 'references/hallway/floor.jpg', out: 'floor.webp', width: 512 },
];

for (const job of jobs) {
  await sharp(path.resolve(job.src))
    .resize({ width: job.width })
    .webp({ quality: 82 })
    .toFile(path.join(OUT_DIR, job.out));
  console.log(`wrote ${job.out}`);
}

// Soft radial glow sprite (white -> transparent) used for flame glows, the
// floor waypoint markers, and the painting halo — tinted per-use via the
// material's color, since none of the reference photos have a usable glow
// asset on their own.
const glowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="256" height="256" fill="url(#g)" />
</svg>`;
await sharp(Buffer.from(glowSvg)).webp({ quality: 90 }).toFile(path.join(OUT_DIR, 'glow.webp'));
console.log('wrote glow.webp');
