import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Artwork } from '../data/artworks';

const FRAME_MARGIN = 0.05;
const FRAME_DEPTH = 0.02;

export default function Painting({ artwork }: { artwork: Artwork }) {
  const texture = useTexture(artwork.src);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  return (
    <group position={artwork.position} rotation={[0, artwork.rotationY, 0]}>
      {/* Frame */}
      <mesh position={[0, 0, -FRAME_DEPTH]}>
        <planeGeometry
          args={[artwork.width + FRAME_MARGIN * 2, artwork.height + FRAME_MARGIN * 2]}
        />
        <meshStandardMaterial color="#241811" roughness={0.7} />
      </mesh>
      {/* Canvas */}
      <mesh>
        <planeGeometry args={[artwork.width, artwork.height]} />
        <meshStandardMaterial map={texture} roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}
