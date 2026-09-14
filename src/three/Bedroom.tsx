import { useWallpaperTexture } from './wallpaperTexture';
import GraffitiWall from './GraffitiWall';
import Candle from './Candle';
import { HALL_HALF_WIDTH, HALL_HEIGHT, HALL_BACK_Z } from './hallwayLayout';

// Room is wider than the hallway so the mural fits at a believable size —
// stepped out via a short jog rather than an angled flare (keeps every
// wall an axis-aligned plane, simpler and still reads fine at this
// stylized/cartoony fidelity level). Kept shallow per feedback — the wall
// should feel close to the door, not like a deep separate room.
const STEP_Z = HALL_BACK_Z - 0.4;
const ROOM_HALF_WIDTH = 2.2;
const ROOM_BACK_Z = STEP_Z - 3;
const WALL_TINT = '#9aa080';
const ROOM_WIDTH = ROOM_HALF_WIDTH * 2;
const STEP_SEG_WIDTH = ROOM_HALF_WIDTH - HALL_HALF_WIDTH;

export default function Bedroom() {
  const narrowCenterZ = (HALL_BACK_Z + STEP_Z) / 2;
  const narrowLen = HALL_BACK_Z - STEP_Z;
  const wideCenterZ = (STEP_Z + ROOM_BACK_Z) / 2;
  const wideLen = STEP_Z - ROOM_BACK_Z;

  // Each matches the plane it's applied to, so the pattern scale stays
  // consistent (and undistorted) across every differently-sized segment.
  const narrowWallTex = useWallpaperTexture(narrowLen, HALL_HEIGHT);
  const stepWallTex = useWallpaperTexture(STEP_SEG_WIDTH, HALL_HEIGHT);
  const wideWallTex = useWallpaperTexture(wideLen, HALL_HEIGHT);
  const backWallTex = useWallpaperTexture(ROOM_WIDTH, HALL_HEIGHT);

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, narrowCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HALL_HALF_WIDTH * 2, narrowLen]} />
        <meshStandardMaterial color="#3a2418" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0, wideCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_HALF_WIDTH * 2, wideLen]} />
        <meshStandardMaterial color="#3a2418" roughness={0.85} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, HALL_HEIGHT, narrowCenterZ]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HALL_HALF_WIDTH * 2, narrowLen]} />
        <meshStandardMaterial color="#8a8c76" roughness={1} />
      </mesh>
      <mesh position={[0, HALL_HEIGHT, wideCenterZ]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_HALF_WIDTH * 2, wideLen]} />
        <meshStandardMaterial color="#8a8c76" roughness={1} />
      </mesh>

      {/* Narrow (hallway-width) side walls just past the door */}
      <mesh
        position={[-HALL_HALF_WIDTH, HALL_HEIGHT / 2, narrowCenterZ]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[narrowLen, HALL_HEIGHT]} />
        <meshStandardMaterial map={narrowWallTex} color={WALL_TINT} roughness={0.95} />
      </mesh>
      <mesh
        position={[HALL_HALF_WIDTH, HALL_HEIGHT / 2, narrowCenterZ]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[narrowLen, HALL_HEIGHT]} />
        <meshStandardMaterial map={narrowWallTex} color={WALL_TINT} roughness={0.95} />
      </mesh>

      {/* Step jog outward */}
      <mesh position={[-(HALL_HALF_WIDTH + ROOM_HALF_WIDTH) / 2, HALL_HEIGHT / 2, STEP_Z]}>
        <planeGeometry args={[STEP_SEG_WIDTH, HALL_HEIGHT]} />
        <meshStandardMaterial map={stepWallTex} color={WALL_TINT} roughness={0.95} />
      </mesh>
      <mesh position={[(HALL_HALF_WIDTH + ROOM_HALF_WIDTH) / 2, HALL_HEIGHT / 2, STEP_Z]}>
        <planeGeometry args={[STEP_SEG_WIDTH, HALL_HEIGHT]} />
        <meshStandardMaterial map={stepWallTex} color={WALL_TINT} roughness={0.95} />
      </mesh>

      {/* Wide (bedroom-width) side walls */}
      <mesh
        position={[-ROOM_HALF_WIDTH, HALL_HEIGHT / 2, wideCenterZ]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[wideLen, HALL_HEIGHT]} />
        <meshStandardMaterial map={wideWallTex} color={WALL_TINT} roughness={0.95} />
      </mesh>
      <mesh
        position={[ROOM_HALF_WIDTH, HALL_HEIGHT / 2, wideCenterZ]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[wideLen, HALL_HEIGHT]} />
        <meshStandardMaterial map={wideWallTex} color={WALL_TINT} roughness={0.95} />
      </mesh>

      {/* Far wall backdrop + mural */}
      <mesh position={[0, HALL_HEIGHT / 2, ROOM_BACK_Z]}>
        <planeGeometry args={[ROOM_WIDTH, HALL_HEIGHT]} />
        <meshStandardMaterial map={backWallTex} color={WALL_TINT} roughness={0.95} />
      </mesh>
      <GraffitiWall position={[0, 1.35, ROOM_BACK_Z + 0.01]} />

      {/* A couple of warm accents so it doesn't feel like a bare box */}
      <Candle position={[-1.9, 0, ROOM_BACK_Z + 0.6]} height={0.16} />
      <pointLight
        position={[0, 1.5, ROOM_BACK_Z + 1.3]}
        color="#ffdcb0"
        intensity={3.5}
        distance={5}
        decay={2}
      />
    </group>
  );
}
