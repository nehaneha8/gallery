import Flame from './Flame';

// Wall-mounted sconce — one of the few real light sources in the hallway
// (light-pool budget, ARCHITECTURE.md §7/§9/§14).
export default function Lantern({
  position,
  rotationY,
}: {
  position: [number, number, number];
  rotationY: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Bracket arm out from the wall */}
      <mesh position={[0, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.18, 12]} />
        <meshStandardMaterial color="#3a2c1e" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Small dish/base holding the flame */}
      <mesh position={[0, -0.02, 0.19]}>
        <cylinderGeometry args={[0.05, 0.06, 0.02, 16]} />
        <meshStandardMaterial color="#3a2c1e" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Open cage around the flame — a few thin verticals, cartoony not literal */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.05, 0.06, 0.19 + Math.sin(a) * 0.05]}>
            <cylinderGeometry args={[0.004, 0.004, 0.16, 8]} />
            <meshStandardMaterial color="#3a2c1e" roughness={0.5} metalness={0.3} />
          </mesh>
        );
      })}
      <group position={[0, -0.01, 0.19]}>
        <Flame withLight lightIntensity={11} lightDistance={7} scale={0.95} />
      </group>
    </group>
  );
}
