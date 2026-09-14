import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';

interface FirefliesProps {
  count: number;
  color: string;
  size: number;
  speed: number;
  amplitude: number;
  bounds: { x: number; yMin: number; yMax: number; zMin: number; zMax: number };
}

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uSpeed;
  attribute float aPhase;
  attribute float aSize;
  varying float vTwinkle;
  void main() {
    vec3 pos = position;
    float t = uTime * uSpeed + aPhase;
    pos.x += sin(t) * uAmplitude;
    pos.y += cos(t * 0.7) * uAmplitude * 0.6;
    pos.z += sin(t * 0.5 + aPhase) * uAmplitude;
    vTwinkle = 0.6 + 0.4 * sin(t * 2.3);
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    // Guard against particles passing very close to (or behind) the camera
    // during a fast camera tween — without the max(), -mvPosition.z can hit
    // zero or negative there, sending gl_PointSize haywire (the "flickering,
    // pixelated" glow during painting zoom-ins).
    float safeDist = max(-mvPosition.z, 0.4);
    gl_PointSize = clamp(aSize * (7.0 / safeDist), 0.0, 18.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uColor;
  varying float vTwinkle;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float alpha = (1.0 - smoothstep(0.0, 0.5, d)) * vTwinkle;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export default function Fireflies({ count, color, size, speed, amplitude, bounds }: FirefliesProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);

  const { positions, phases, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() * 2 - 1) * bounds.x;
      positions[i * 3 + 1] = bounds.yMin + Math.random() * (bounds.yMax - bounds.yMin);
      positions[i * 3 + 2] = bounds.zMin + Math.random() * (bounds.zMax - bounds.zMin);
      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = size * (0.6 + Math.random() * 0.8);
    }
    return { positions, phases, sizes };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: amplitude },
      uSpeed: { value: speed },
      uColor: { value: new THREE.Color(color) },
    }),
    [amplitude, speed, color],
  );

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta * (reducedMotion ? 0.15 : 1);
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
