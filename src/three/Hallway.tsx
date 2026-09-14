// Stylized-but-textured hallway shell. Wallpaper is the actual reference
// photo (tiled at a fixed real-world scale, see wallpaperTexture.ts).
import { useWallpaperTexture } from './wallpaperTexture';
import { HALL_HALF_WIDTH, HALL_HEIGHT, HALL_FRONT_Z, HALL_BACK_Z } from './hallwayLayout';

const HALL_LENGTH = HALL_FRONT_Z - HALL_BACK_Z;
const HALL_CENTER_Z = (HALL_FRONT_Z + HALL_BACK_Z) / 2;
const HALL_WIDTH = HALL_HALF_WIDTH * 2;
const END_SEG_WIDTH = 0.7;
const HEADER_WIDTH = 1.2;
const HEADER_HEIGHT = 0.4;

export default function Hallway() {
  // Each call's (width, height) matches that mesh's own <planeGeometry
  // args={[w,h]}> so the tile scale stays correct regardless of segment size.
  const longWallTex = useWallpaperTexture(HALL_LENGTH, HALL_HEIGHT);
  const ceilingTex = useWallpaperTexture(HALL_WIDTH, HALL_LENGTH);
  const backWallTex = useWallpaperTexture(HALL_WIDTH, HALL_HEIGHT);
  const endSegTex = useWallpaperTexture(END_SEG_WIDTH, HALL_HEIGHT);
  const headerTex = useWallpaperTexture(HEADER_WIDTH, HEADER_HEIGHT);

  return (
    <group>
      {/* Floor — plain deep red */}
      <mesh position={[0, 0, HALL_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HALL_WIDTH, HALL_LENGTH]} />
        <meshStandardMaterial color="#5a1f1f" roughness={0.95} metalness={0} />
      </mesh>

      {/* Ceiling — same wallpaper texture, darkened so it reads as
          plaster-with-subtle-texture rather than a second wall */}
      <mesh
        position={[0, HALL_HEIGHT, HALL_CENTER_Z]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[HALL_WIDTH, HALL_LENGTH]} />
        <meshStandardMaterial map={ceilingTex} color="#2a2018" roughness={1} />
      </mesh>

      {/* Left wall (normal points +X, into the hallway) */}
      <mesh
        position={[-HALL_HALF_WIDTH, HALL_HEIGHT / 2, HALL_CENTER_Z]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[HALL_LENGTH, HALL_HEIGHT]} />
        <meshStandardMaterial map={longWallTex} color="#c9a578" roughness={0.95} />
      </mesh>

      {/* Right wall (normal points -X, into the hallway) */}
      <mesh
        position={[HALL_HALF_WIDTH, HALL_HEIGHT / 2, HALL_CENTER_Z]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[HALL_LENGTH, HALL_HEIGHT]} />
        <meshStandardMaterial map={longWallTex} color="#c9a578" roughness={0.95} />
      </mesh>

      {/* Back wall behind the entrance */}
      <mesh position={[0, HALL_HEIGHT / 2, HALL_FRONT_Z]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[HALL_WIDTH, HALL_HEIGHT]} />
        <meshStandardMaterial map={backWallTex} color="#c9a578" roughness={0.95} />
      </mesh>

      {/* End wall with a doorway opening for the Door */}
      <mesh position={[-0.95, HALL_HEIGHT / 2, HALL_BACK_Z]}>
        <planeGeometry args={[END_SEG_WIDTH, HALL_HEIGHT]} />
        <meshStandardMaterial map={endSegTex} color="#a8845c" roughness={0.95} />
      </mesh>
      <mesh position={[0.95, HALL_HEIGHT / 2, HALL_BACK_Z]}>
        <planeGeometry args={[END_SEG_WIDTH, HALL_HEIGHT]} />
        <meshStandardMaterial map={endSegTex} color="#a8845c" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.4, HALL_BACK_Z]}>
        <planeGeometry args={[HEADER_WIDTH, HEADER_HEIGHT]} />
        <meshStandardMaterial map={headerTex} color="#a8845c" roughness={0.95} />
      </mesh>
      {/* Door frame posts */}
      <mesh position={[-0.6, 1.1, HALL_BACK_Z + 0.03]}>
        <boxGeometry args={[0.08, 2.2, 0.1]} />
        <meshStandardMaterial color="#1c1410" roughness={0.8} />
      </mesh>
      <mesh position={[0.6, 1.1, HALL_BACK_Z + 0.03]}>
        <boxGeometry args={[0.08, 2.2, 0.1]} />
        <meshStandardMaterial color="#1c1410" roughness={0.8} />
      </mesh>
    </group>
  );
}
