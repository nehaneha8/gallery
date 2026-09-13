export interface Artwork {
  id: string;
  title: string;
  year?: string;
  medium?: string;
  blurb?: string;
  src: string;
  aspectRatio: number; // width / height, measured from the processed image — do not guess
  width: number; // meters
  height: number; // meters
  wallSide: 'left' | 'right';
  position: [number, number, number];
  rotationY: number;
  viewingOffset: number;
}

const WALL_X = 1.29;
const HANG_Y = 1.5;
const LEFT_ROTATION_Y = Math.PI / 2;
const RIGHT_ROTATION_Y = -Math.PI / 2;

// Sizing: longest edge in meters comes from the physical size category the
// artist gave us; the other edge is derived from the real measured aspect
// ratio (scripts/process-art.mjs output) so nothing gets stretched.
function sized(aspectRatio: number, longEdgeMeters: number) {
  return aspectRatio <= 1
    ? { width: longEdgeMeters * aspectRatio, height: longEdgeMeters }
    : { width: longEdgeMeters, height: longEdgeMeters / aspectRatio };
}

// NOTE: titles below are placeholders (I don't know the real names of these
// pieces) — rename them here to the actual titles whenever convenient.
// year/medium/blurb are intentionally left blank rather than invented.
const BIG = 0.9; // ~60x90cm canvases
const MEDIUM = 0.7; // ~50x70cm canvases
const SMALL = 0.5; // flower pieces
const SMALLEST = 0.35; // sunset

export const artworks: Artwork[] = [
  {
    id: 'italy',
    title: 'Italy',
    src: '/art/italy.webp',
    aspectRatio: 0.725,
    wallSide: 'left',
    position: [-WALL_X, HANG_Y, -2],
    rotationY: LEFT_ROTATION_Y,
    viewingOffset: 1.3,
    ...sized(0.725, BIG),
  },
  {
    id: 'snake',
    title: 'Medusa',
    src: '/art/snake.webp',
    aspectRatio: 0.755,
    wallSide: 'right',
    position: [WALL_X, HANG_Y, -2],
    rotationY: RIGHT_ROTATION_Y,
    viewingOffset: 1.1,
    ...sized(0.755, MEDIUM),
  },
  {
    id: 'flower',
    title: 'Bloom I',
    src: '/art/flower.webp',
    aspectRatio: 0.8069,
    wallSide: 'left',
    position: [-WALL_X, HANG_Y, -4.2],
    rotationY: LEFT_ROTATION_Y,
    viewingOffset: 0.95,
    ...sized(0.8069, SMALL),
  },
  {
    id: 'womanbaby',
    title: 'Mother and Child',
    src: '/art/womanbaby.webp',
    aspectRatio: 0.8303,
    wallSide: 'right',
    position: [WALL_X, HANG_Y, -4.2],
    rotationY: RIGHT_ROTATION_Y,
    viewingOffset: 1.3,
    ...sized(0.8303, BIG),
  },
  {
    id: 'curler',
    title: 'Vanity',
    src: '/art/curler.webp',
    aspectRatio: 0.755,
    wallSide: 'left',
    position: [-WALL_X, HANG_Y, -6.4],
    rotationY: LEFT_ROTATION_Y,
    viewingOffset: 1.1,
    ...sized(0.755, MEDIUM),
  },
  {
    id: 'sunset',
    title: 'Dusk',
    src: '/art/sunset.webp',
    aspectRatio: 1.2471,
    wallSide: 'right',
    position: [WALL_X, HANG_Y, -6.4],
    rotationY: RIGHT_ROTATION_Y,
    viewingOffset: 0.85,
    ...sized(1.2471, SMALLEST),
  },
  {
    id: 'abstact',
    title: 'Abstract Faces',
    src: '/art/abstact.webp',
    aspectRatio: 0.7412,
    wallSide: 'left',
    position: [-WALL_X, HANG_Y, -8.6],
    rotationY: LEFT_ROTATION_Y,
    viewingOffset: 1.3,
    ...sized(0.7412, BIG),
  },
  {
    id: 'flower2',
    title: 'Grow',
    src: '/art/flower2.webp',
    aspectRatio: 0.8006,
    wallSide: 'right',
    position: [WALL_X, HANG_Y, -8.6],
    rotationY: RIGHT_ROTATION_Y,
    viewingOffset: 0.95,
    ...sized(0.8006, SMALL),
  },
  {
    id: 'hands',
    title: 'Reaching',
    src: '/art/hands.webp',
    aspectRatio: 1.3758,
    wallSide: 'left',
    position: [-WALL_X, HANG_Y, -10.8],
    rotationY: LEFT_ROTATION_Y,
    viewingOffset: 1.1,
    ...sized(1.3758, MEDIUM),
  },
  {
    id: 'spider',
    title: 'Suspended',
    src: '/art/spider.webp',
    aspectRatio: 0.8281,
    wallSide: 'right',
    position: [WALL_X, HANG_Y, -10.8],
    rotationY: RIGHT_ROTATION_Y,
    viewingOffset: 1.1,
    ...sized(0.8281, MEDIUM),
  },
  {
    id: 'scream',
    title: 'Duality',
    src: '/art/scream.webp',
    aspectRatio: 0.7711,
    wallSide: 'left',
    position: [-WALL_X, HANG_Y, -13],
    rotationY: LEFT_ROTATION_Y,
    viewingOffset: 1.3,
    ...sized(0.7711, BIG),
  },
];
