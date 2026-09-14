import type { Pose } from '../store/useSceneStore';

// Drop future sketch photos here — each entry is one page, shown two at a
// time (a left/right spread) in the order listed. Process them through
// scripts/process-art.mjs first (or a similar crop+compress pass) and point
// `src` at the resulting /art/... path, e.g.:
//   { src: '/art/sketch1.webp' },
//   { src: '/art/sketch2.webp' },
export interface SketchPage {
  src: string;
}

// TEMPORARY placeholders (reusing existing processed art) so the page-flip
// arrows have something to flip between while you test. Replace this array
// with your real sketch photos whenever you're ready — see the note above.
export const sketchPages: SketchPage[] = [
  { src: '/art/suits.webp' },
  { src: '/art/gm.webp' },
  { src: '/art/dragon.webp' },
  { src: '/art/Archie.webp' },
  { src: '/art/backpack.webp' },
  { src: '/art/pressure.webp' },
];

export interface Spread {
  left: string | null;
  right: string | null;
}

// Always at least one (blank) spread so the book has something to show
// before any sketches are added.
export function getSpreads(): Spread[] {
  if (sketchPages.length === 0) return [{ left: null, right: null }];
  const spreads: Spread[] = [];
  for (let i = 0; i < sketchPages.length; i += 2) {
    spreads.push({ left: sketchPages[i]?.src ?? null, right: sketchPages[i + 1]?.src ?? null });
  }
  return spreads;
}

// Podium placement — off the walking centerline (x=0) so the camera tween
// between hallway waypoints never passes through it, near the end of the
// hallway per the brief. Rotated perpendicular to the hallway (facing +X,
// out toward the centerline) rather than down its length.
export const PODIUM_POSITION: [number, number, number] = [-0.85, 0, -16.6];
export const PODIUM_ROTATION_Y = Math.PI / 2;
export const PODIUM_VIEWING_OFFSET = 0.95;

const EYE_HEIGHT = 1.6;
const BOOK_LOOK_HEIGHT = 1.05;

export function getBookViewingPose(): Pose {
  const normalX = Math.sin(PODIUM_ROTATION_Y);
  const normalZ = Math.cos(PODIUM_ROTATION_Y);
  return {
    position: [
      PODIUM_POSITION[0] + normalX * PODIUM_VIEWING_OFFSET,
      EYE_HEIGHT,
      PODIUM_POSITION[2] + normalZ * PODIUM_VIEWING_OFFSET,
    ],
    lookAt: [PODIUM_POSITION[0], BOOK_LOOK_HEIGHT, PODIUM_POSITION[2]],
  };
}

// Second-click pose: tips the view down toward the open pages — closer to a
// bird's-eye look-down than the more upright, stand-back framing of
// getBookViewingPose — so the sketches actually fill the frame once the
// book is open. Offset stays nonzero (never fully vertical) since
// camera.lookAt's basis gets numerically unstable as the view direction
// approaches straight down.
const READING_EYE_HEIGHT = 1.65;
const READING_OFFSET = 0.2;
const READING_SURFACE_Y = 0.98;

export function getBookReadingPose(): Pose {
  const normalX = Math.sin(PODIUM_ROTATION_Y);
  const normalZ = Math.cos(PODIUM_ROTATION_Y);
  return {
    position: [
      PODIUM_POSITION[0] + normalX * READING_OFFSET,
      READING_EYE_HEIGHT,
      PODIUM_POSITION[2] + normalZ * READING_OFFSET,
    ],
    lookAt: [PODIUM_POSITION[0], READING_SURFACE_Y, PODIUM_POSITION[2]],
  };
}
