import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';
import { waypointPose, type Waypoint } from '../data/waypoints';

// Soft golden light pool on the floor — replaces the earlier hard-edged
// white circle per the user's request.
export default function FloorGlowPoint({ waypoint }: { waypoint: Waypoint }) {
  const glowTex = useTexture('/textures/glow.webp');
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);
  const haloMesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const pulse = 0.6 + Math.sin(state.clock.elapsedTime * 1.6 + waypoint.position[2]) * 0.25;
    if (coreMat.current) coreMat.current.opacity = 0.45 * pulse;
    if (haloMat.current) haloMat.current.opacity = 0.22 * pulse;
    if (haloMesh.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.6 + waypoint.position[2]) * 0.08;
      haloMesh.current.scale.set(s, s, s);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    useSceneStore.getState().goToWaypoint(waypoint.id, waypointPose(waypoint));
  };

  return (
    <group position={[waypoint.position[0], 0.012, waypoint.position[2]]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
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
        {/* Slightly oversized invisible hit target, easier to click/tap */}
        <circleGeometry args={[0.3, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.16, 0.16]} />
        <meshBasicMaterial
          ref={coreMat}
          map={glowTex}
          color="#ffcf8a"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={haloMesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[0.34, 0.34]} />
        <meshBasicMaterial
          ref={haloMat}
          map={glowTex}
          color="#ffb066"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
