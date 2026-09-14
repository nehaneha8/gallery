import type { Pose } from '../store/useSceneStore';

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
    id: 'scream',
    title: 'Spl it',
    src: '/art/scream.webp',
    aspectRatio: 0.7711,
    wallSide: 'left',
    position: [-WALL_X, HANG_Y, -13],
    rotationY: LEFT_ROTATION_Y,
    viewingOffset: 1.3,
    blurb: 'Acrylic on canvas',   // ← add this line
    ...sized(0.7711, BIG),
  },
  {
    id: 'curler',
    title: 'Even at 50',
    src: '/art/curler.webp',
    aspectRatio: 0.755,
    wallSide: 'left',
    position: [-WALL_X, HANG_Y, -6.4],
    rotationY: LEFT_ROTATION_Y,
    viewingOffset: 1.1,
    blurb: 'Acrylic on canvas',   // ← add this line
    ...sized(0.755, MEDIUM),
  },
  {
    id: 'italy',
    title: 'The Bluff',
    src: '/art/italy.webp',
    aspectRatio: 0.725,
    wallSide: 'left',
    position: [-WALL_X, HANG_Y, -2],
    rotationY: LEFT_ROTATION_Y,
    viewingOffset: 1.3,
    blurb: 'Acrylic on canvas',   // ← add this line
    ...sized(0.725, BIG),
  },
  {
    id: 'skull',
    title: 'In the end',
    src: '/art/skull.webp',
    aspectRatio: 0.7859,
    wallSide: 'right',
    position: [WALL_X, HANG_Y, -13],
    rotationY: RIGHT_ROTATION_Y,
    viewingOffset: 1.1,
    blurb: 'Graphite on paper',
    ...sized(0.7859, MEDIUM),
  },
  
  {
    id: 'womanbaby',
    title: 'Carry',
    src: '/art/womanbaby.webp',
    aspectRatio: 0.8303,
    wallSide: 'right',
    position: [WALL_X, HANG_Y, -4.2],
    rotationY: RIGHT_ROTATION_Y,
    viewingOffset: 1.3,
    blurb: 'Acrylic on canvas, displayed in Oakville artshow',   // ← add this line
    ...sized(0.8303, BIG),
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
    blurb: 'Largely done with pen & marker, some paint.',   // ← add this line
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
    blurb: 'Watercolor, done by 5 year old me',   // ← add this line
    ...sized(1.2471, SMALLEST),
  },
  {
    id: 'abstact',
    title: 'Just Lines',
    src: '/art/abstact.webp',
    aspectRatio: 0.7412,
    wallSide: 'left',
    position: [-WALL_X, HANG_Y, -8.6],
    rotationY: LEFT_ROTATION_Y,
    viewingOffset: 1.3,
    blurb: 'Acrylic on canvas',   // ← add this line
    ...sized(0.7412, BIG),
  },
  {
    id: 'hands',
    title: 'Never',
    src: '/art/hands.webp',
    aspectRatio: 1.3758,
    wallSide: 'left',
    position: [-WALL_X, HANG_Y, -10.8],
    rotationY: LEFT_ROTATION_Y,
    viewingOffset: 1.1,
    blurb: 'Acrylic on canvas',   // ← add this line
    ...sized(1.3758, MEDIUM),
  },
  {
    id: 'spider',
    title: 'Nonsense',
    src: '/art/spider.webp',
    aspectRatio: 0.8281,
    wallSide: 'right',
    position: [WALL_X, HANG_Y, -10.8],
    rotationY: RIGHT_ROTATION_Y,
    viewingOffset: 1.1,
    blurb: 'Myriad of mediums on canvas',   // ← add this line
    ...sized(0.8281, MEDIUM),
  },
  
  
  {
    id: 'newpiece',
    title: 'Cloth',
    src: '/art/curtain.webp',
    aspectRatio: 1.5330,        // from step 3
    wallSide: 'left',
    position: [-WALL_X, HANG_Y, -15.2],
    rotationY: LEFT_ROTATION_Y,
    viewingOffset: 1.1,         // how far back the camera stands to view it
    blurb: 'Charcoal',
    ...sized(1.5330, BIG),      // pick BIG/MEDIUM/SMALL/SMALLEST from the constants above, or a new number (longest edge in meters)
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
    blurb: 'Paint & marker on wood, 1/2',   // ← add this line
    ...sized(0.8069, SMALL),
  },
  {
    id: 'flower2',
    title: 'Bloom II',
    src: '/art/flower2.webp',
    aspectRatio: 0.8006,
    wallSide: 'right',
    position: [WALL_X, HANG_Y, -8.6],
    rotationY: RIGHT_ROTATION_Y,
    viewingOffset: 0.95,
    blurb: 'Paint & marker on wood, 2/2',   // ← add this line
    ...sized(0.8006, SMALL),
  },
  
];

export const artworkById = new Map(artworks.map((a) => [a.id, a]));

const EYE_HEIGHT = 1.6;

// Camera pose to stand directly in front of a painting (ARCHITECTURE.md §5).
export function getViewingPose(artwork: Artwork): Pose {
  const normalX = Math.sin(artwork.rotationY);
  const normalZ = Math.cos(artwork.rotationY);
  return {
    position: [
      artwork.position[0] + normalX * artwork.viewingOffset,
      EYE_HEIGHT,
      artwork.position[2] + normalZ * artwork.viewingOffset,
    ],
    lookAt: [artwork.position[0], artwork.position[1], artwork.position[2]],
  };
}
