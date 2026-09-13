export interface Waypoint {
  id: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  showGlow: boolean;
  connectsTo: string[];
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
];

export const waypointById = new Map(waypoints.map((w) => [w.id, w]));
