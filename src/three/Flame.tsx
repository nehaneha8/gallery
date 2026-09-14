import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Smooth, irregular flicker built from a few offset sine waves rather than
// per-frame randomness — organic-looking without ever looking chaotic.
function flicker(t: number, seed: number) {
  return (
    0.85 +
    0.1 * Math.sin(t * 13 + seed) +
    0.05 * Math.sin(t * 7.3 + seed * 2.1) +
    0.03 * Math.sin(t * 23 + seed * 0.7)
  );
}

interface FlameProps {
  withLight?: boolean;
  lightIntensity?: number;
  lightDistance?: number;
  lightColor?: string;
  scale?: number;
}

// A soft billboarded glow sprite instead of hard cone geometry — reads as
// a warm blur rather than a "geometric" shape, and makes the light source
// visually obvious even before the real PointLight's illumination is
// noticed on nearby surfaces.
export default function Flame({
  withLight = false,
  lightIntensity = 5,
  lightDistance = 4,
  lightColor = '#ffb066',
  scale = 1,
}: FlameProps) {
  const glowTex = useTexture('/textures/glow.webp');
  const seed = useMemo(() => Math.random() * 100, []);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const f = flicker(state.clock.elapsedTime, seed);
    if (haloMat.current) haloMat.current.opacity = 0.5 * f;
    if (coreMat.current) coreMat.current.opacity = 0.95 * f;
    if (light.current) light.current.intensity = lightIntensity * f;
  });

  return (
    <group>
      <Billboard position={[0, 0.09, 0]}>
        <mesh scale={0.42 * scale}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={haloMat}
            map={glowTex}
            color="#ff9d4d"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh scale={0.14 * scale} position={[0, 0, 0.001]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={coreMat}
            map={glowTex}
            color="#fff2c8"
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </Billboard>
      {withLight && (
        <pointLight
          ref={light}
          position={[0, 0.12, 0]}
          color={lightColor}
          intensity={lightIntensity}
          distance={lightDistance}
          decay={2}
        />
      )}
    </group>
  );
}
