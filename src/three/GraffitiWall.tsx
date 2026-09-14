import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

const ASPECT = 1.6805; // scripts/process-graffiti.mjs output
const MURAL_HEIGHT = 2.4;
const MURAL_WIDTH = MURAL_HEIGHT * ASPECT;

export default function GraffitiWall({ position }: { position: [number, number, number] }) {
  const texture = useTexture('/bedroom/graffiti-wall.webp');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  return (
    <mesh position={[position[0], position[1], position[2]]}>
      <planeGeometry args={[MURAL_WIDTH, MURAL_HEIGHT]} />
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  );
}
