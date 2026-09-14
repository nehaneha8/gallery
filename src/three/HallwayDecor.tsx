import Lantern from './Lantern';
import Candle from './Candle';
import { HALL_HALF_WIDTH, HALL_HEIGHT, HALL_FRONT_Z, HALL_BACK_Z } from './hallwayLayout';

function Plant({ position }: { position: [number, number, number] }) {
  const leafColors = ['#3c5a34', '#4d6e3f', '#33492c'];
  return (
    <group position={position}>
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.22, 14]} />
        <meshStandardMaterial color="#5a4632" roughness={0.9} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const r = 0.06 + (i % 2) * 0.03;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r, 0.3 + (i % 3) * 0.06, Math.sin(a) * r]}
            rotation={[a * 0.3, a, 0.3]}
          >
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshStandardMaterial color={leafColors[i % leafColors.length]} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

// Trailing ivy draped from a wall-mounted point — several drooping strands
// of small leaf blobs, thinning out toward the bottom.
function HangingVine({
  position,
  rotationY = 0,
  length = 0.9,
}: {
  position: [number, number, number];
  rotationY?: number;
  length?: number;
}) {
  const strands = 3;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: strands }).map((_, s) => {
        const xOff = (s - (strands - 1) / 2) * 0.09;
        const strandLen = length * (0.75 + 0.25 * Math.sin(s * 2.1));
        const leafCount = Math.round(strandLen * 9);
        return (
          <group key={s} position={[xOff, 0, 0]}>
            {Array.from({ length: leafCount }).map((_, i) => {
              const t = i / leafCount;
              const sway = Math.sin(t * 5 + s) * 0.03 * t;
              return (
                <mesh key={i} position={[sway, -t * strandLen, 0.02 + t * 0.03]}>
                  <sphereGeometry args={[0.028 * (1 - t * 0.4), 6, 6]} />
                  <meshStandardMaterial color={i % 2 === 0 ? '#3c5a34' : '#4d6e3f'} roughness={1} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

function ConsoleVignette() {
  // Small entrance nook echoing references/hallway/hlway1.jpg — console,
  // mirror, candles, trailing ivy — reimagined simply rather than copied.
  return (
    <group position={[1.1, 0, 1.3]}>
      <mesh position={[0, 0.375, 0]}>
        <boxGeometry args={[0.55, 0.75, 0.32]} />
        <meshStandardMaterial color="#3a2b20" roughness={0.75} />
      </mesh>
      <Candle position={[-0.12, 0.75, 0.05]} height={0.14} />
      <Candle position={[0.12, 0.75, -0.03]} height={0.1} />
      {/* Mirror on the wall above */}
      <group position={[0.19, 1.55, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <circleGeometry args={[0.32, 28]} />
          <meshStandardMaterial color="#241a10" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.27, 28]} />
          <meshStandardMaterial color="#9fb0b8" roughness={0.2} metalness={0.5} />
        </mesh>
      </group>
      <HangingVine position={[-0.28, 1.9, 0.15]} rotationY={Math.PI * 0.15} length={0.7} />
    </group>
  );
}

// A smaller side table for a candle, tucked along the wall.
function SideTable({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.56, 8]} />
        <meshStandardMaterial color="#2c2016" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.57, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.03, 20]} />
        <meshStandardMaterial color="#4a3626" roughness={0.6} />
      </mesh>
      <Candle position={[0, 0.585, 0]} height={0.13} />
    </group>
  );
}

// A small decorative filler portrait — generic, not part of the curated
// artwork collection, just wall dressing between the real pieces.
function SmallPortrait({
  position,
  rotationY,
  color,
}: {
  position: [number, number, number];
  rotationY: number;
  color: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.015]}>
        <boxGeometry args={[0.34, 0.44, 0.04]} />
        <meshStandardMaterial color="#241811" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <planeGeometry args={[0.26, 0.36]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

function PendantLight({ z }: { z: number }) {
  return (
    <group position={[0, HALL_HEIGHT, z]}>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.4, 8]} />
        <meshStandardMaterial color="#1c140d" />
      </mesh>
      <mesh position={[0, -0.44, 0]}>
        <coneGeometry args={[0.16, 0.16, 16, 1, true]} />
        <meshStandardMaterial color="#3a2a1c" roughness={0.6} side={2} />
      </mesh>
      <pointLight position={[0, -0.46, 0]} color="#ffcf9a" intensity={2.4} distance={3} decay={2} />
    </group>
  );
}

export default function HallwayDecor() {
  return (
    <group>
      {/* Baseboard trim */}
      <mesh position={[-HALL_HALF_WIDTH + 0.02, 0.05, (HALL_FRONT_Z + HALL_BACK_Z) / 2]}>
        <boxGeometry args={[0.04, 0.1, HALL_FRONT_Z - HALL_BACK_Z]} />
        <meshStandardMaterial color="#231810" roughness={0.8} />
      </mesh>
      <mesh position={[HALL_HALF_WIDTH - 0.02, 0.05, (HALL_FRONT_Z + HALL_BACK_Z) / 2]}>
        <boxGeometry args={[0.04, 0.1, HALL_FRONT_Z - HALL_BACK_Z]} />
        <meshStandardMaterial color="#231810" roughness={0.8} />
      </mesh>
      {/* Crown molding */}
      <mesh
        position={[-HALL_HALF_WIDTH + 0.03, HALL_HEIGHT - 0.06, (HALL_FRONT_Z + HALL_BACK_Z) / 2]}
      >
        <boxGeometry args={[0.06, 0.09, HALL_FRONT_Z - HALL_BACK_Z]} />
        <meshStandardMaterial color="#1c1410" roughness={0.9} />
      </mesh>
      <mesh
        position={[HALL_HALF_WIDTH - 0.03, HALL_HEIGHT - 0.06, (HALL_FRONT_Z + HALL_BACK_Z) / 2]}
      >
        <boxGeometry args={[0.06, 0.09, HALL_FRONT_Z - HALL_BACK_Z]} />
        <meshStandardMaterial color="#1c1410" roughness={0.9} />
      </mesh>

      {/* Wall sconces — real flickering light sources */}
      <Lantern position={[HALL_HALF_WIDTH, 2.15, -2]} rotationY={-Math.PI / 2} />
      <Lantern position={[-HALL_HALF_WIDTH, 2.15, -7]} rotationY={Math.PI / 2} />
      <Lantern position={[HALL_HALF_WIDTH, 2.15, -12]} rotationY={-Math.PI / 2} />
      <Lantern position={[-HALL_HALF_WIDTH, 2.15, -17.3]} rotationY={Math.PI / 2} />

      <ConsoleVignette />
      <SideTable position={[-1.13, 0, -7.6]} rotationY={Math.PI / 2} />
      <SideTable position={[1.13, 0, -13.4]} rotationY={-Math.PI / 2} />
      <PendantLight z={-4.2} />
      <PendantLight z={-11.8} />

      <SmallPortrait position={[HALL_HALF_WIDTH - 0.01, 1.7, -3.3]} rotationY={-Math.PI / 2} color="#7a5a3c" />
      <SmallPortrait position={[-HALL_HALF_WIDTH + 0.01, 1.7, -9.7]} rotationY={Math.PI / 2} color="#4c5a3a" />
      <SmallPortrait position={[HALL_HALF_WIDTH - 0.01, 1.7, -15.9]} rotationY={-Math.PI / 2} color="#6a3c3c" />

      <HangingVine position={[-HALL_HALF_WIDTH + 0.02, 2.55, -6]} rotationY={Math.PI / 2} length={0.8} />
      <HangingVine position={[HALL_HALF_WIDTH - 0.02, 2.55, -11.5]} rotationY={-Math.PI / 2} length={0.65} />

      <Plant position={[-1.15, 0, 1.3]} />
      <Plant position={[1.15, 0, -4.2]} />
      <Plant position={[-1.15, 0, -10.8]} />
      <Plant position={[1.15, 0, -15]} />
    </group>
  );
}
