import type { Pose } from '../store/useSceneStore';

export interface Waypoint {
  id: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  showGlow: boolean;
  connectsTo: string[];
  // False for special-purpose viewing spots (currently just the door
  // checkpoint) that shouldn't be picked as the "nearest checkpoint" when
  // returning from a painting/book — those should only ever fall back to a
  // normal hallway position. Defaults to true when omitted.
  isCheckpoint?: boolean;
}

export function waypointPose(wp: Waypoint): Pose {
  return { position: wp.position, lookAt: wp.lookAt };
}

// Hallway runs along -Z. x=0 is the centerline, interior walls at x=+-1.3.
// Eye height baked in at y=1.6 per DESIGN.md.
export const waypoints: Waypoint[] = [
  {
    id: 'entrance',
    position: [0, 1.6, 1],
    lookAt: [0, 1.6, -3],
    showGlow: false,
    connectsTo: ['wp1'],
  },
  {
    id: 'wp1',
    position: [0, 1.6, -3],
    lookAt: [0, 1.6, -7],
    showGlow: true,
    connectsTo: ['entrance', 'wp2'],
  },
  {
    id: 'wp2',
    position: [0, 1.6, -7],
    lookAt: [0, 1.6, -11],
    showGlow: true,
    connectsTo: ['wp1', 'wp3'],
  },
  {
    id: 'wp3',
    position: [0, 1.6, -11],
    lookAt: [0, 1.6, -15],
    showGlow: true,
    connectsTo: ['wp2', 'wp4'],
  },
  {
    id: 'wp4',
    position: [0, 1.6, -15],
    lookAt: [0, 1.6, -18],
    showGlow: true,
    connectsTo: ['wp3'],
  },
  // The door is a checkpoint, not an entrance — opening it reveals the
  // bedroom/graffiti wall beyond, but the camera stops right at the
  // threshold rather than walking through (per user request).
  {
    id: 'door-checkpoint',
    position: [0, 1.6, -17.8],
    lookAt: [0, 1.5, -22.4],
    showGlow: false, // reached via the door itself, not a floor marker
    connectsTo: ['wp4'],
    isCheckpoint: false,
  },
];

export const waypointById = new Map(waypoints.map((w) => [w.id, w]));

// Which waypoint counts as "standing next to" a given point in the hallway —
// used so viewing a painting (even reached by clicking straight from the
// entrance on first load, with no prior floor-glow navigation) still
// returns you to the checkpoint nearest that painting, not wherever you
// technically last clicked a glow point.
export function getNearestWaypointId(position: [number, number, number]): string {
  const candidates = waypoints.filter((wp) => wp.isCheckpoint !== false);
  let bestId = candidates[0].id;
  let bestDist = Infinity;
  for (const wp of candidates) {
    const dz = wp.position[2] - position[2];
    const dx = wp.position[0] - position[0];
    const dist = dx * dx + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      bestId = wp.id;
    }
  }
  return bestId;
}
