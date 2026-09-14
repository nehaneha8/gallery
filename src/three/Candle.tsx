import Flame from './Flame';

// Tabletop candle — softer/rounder silhouette (more radial segments, a
// slight taper) and a real (small, short-range) light so it actually looks
// lit rather than being a decorative geometric prop.
export default function Candle({
  position,
  height = 0.16,
}: {
  position: [number, number, number];
  height?: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height * 0.32, 0]}>
        <cylinderGeometry args={[0.032, 0.036, height * 0.64, 20]} />
        <meshStandardMaterial color="#ede1c8" roughness={0.75} />
      </mesh>
      <mesh position={[0, height * 0.75, 0]}>
        <cylinderGeometry args={[0.026, 0.03, height * 0.5, 20]} />
        <meshStandardMaterial color="#f2e9d4" roughness={0.7} />
      </mesh>
      <group position={[0, height, 0]}>
        <Flame withLight lightIntensity={2.6} lightDistance={2.6} scale={0.7} />
      </group>
    </group>
  );
}
