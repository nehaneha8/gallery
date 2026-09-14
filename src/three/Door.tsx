import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { useSceneStore } from '../store/useSceneStore';
import { waypointById, waypointPose } from '../data/waypoints';
import { HALL_BACK_Z, DOORWAY_HALF_WIDTH, DOORWAY_HEIGHT } from './hallwayLayout';

const OPEN_ANGLE = -1.7; // swings away, into the room beyond
const SWING_DURATION = 1.5;
// The panel used to be sized smaller than the doorway opening it seals
// (1.9x/0.98x the half-width/height instead of matching it exactly), which
// left a visible gap around the edges when closed — the brighter room
// beyond showed through as a thin rim. Now sized to fully cover the
// opening plus a small overlap on every edge so there's no seam.
const EDGE_OVERLAP = 0.02;

// The door is a checkpoint, not an entrance (per user request): clicking it
// toggles open/closed, and opening it also walks the camera to a spot right
// at the threshold so you can see through — it never proceeds past the door.
export default function Door() {
  const pivot = useRef<THREE.Group>(null);
  const progress = useRef(0); // 0 = closed, 1 = open
  const hasTriggeredCheckpoint = useRef(false);

  useFrame((_, delta) => {
    const doorState = useSceneStore.getState().doorState;
    if (doorState === 'OPENING') {
      progress.current = Math.min(1, progress.current + delta / SWING_DURATION);
      if (pivot.current) pivot.current.rotation.y = OPEN_ANGLE * easeOutCubic(progress.current);
      if (progress.current >= 1) {
        useSceneStore.getState().setDoorState('OPEN');
        if (!hasTriggeredCheckpoint.current) {
          hasTriggeredCheckpoint.current = true;
          const wp = waypointById.get('door-checkpoint');
          if (wp) useSceneStore.getState().goToWaypoint(wp.id, waypointPose(wp));
        }
      }
    } else if (doorState === 'CLOSING') {
      progress.current = Math.max(0, progress.current - delta / SWING_DURATION);
      if (pivot.current) pivot.current.rotation.y = OPEN_ANGLE * easeOutCubic(progress.current);
      if (progress.current <= 0) {
        useSceneStore.getState().setDoorState('CLOSED');
        hasTriggeredCheckpoint.current = false;
      }
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const state = useSceneStore.getState();
    if (state.doorState === 'OPENING' || state.doorState === 'CLOSING') return;
    if (state.doorState === 'CLOSED') useTexture.preload('/bedroom/graffiti-wall.webp');
    state.toggleDoor();
  };

  return (
    <group
      ref={pivot}
      position={[-DOORWAY_HALF_WIDTH, 0, HALL_BACK_Z + 0.03]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[DOORWAY_HALF_WIDTH, DOORWAY_HEIGHT / 2, 0]}>
        <boxGeometry
          args={[DOORWAY_HALF_WIDTH * 2 + EDGE_OVERLAP * 2, DOORWAY_HEIGHT + EDGE_OVERLAP * 2, 0.06]}
        />
        <meshStandardMaterial color="#3a2617" roughness={0.7} />
      </mesh>
      {/* Simple panel/handle detailing */}
      <mesh position={[DOORWAY_HALF_WIDTH * 1.7, DOORWAY_HEIGHT / 2, 0.04]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color="#c9a15a" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
