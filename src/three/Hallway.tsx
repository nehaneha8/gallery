// Static, stylized, cartoony hallway shell (ARCHITECTURE.md §1/§7/§14).
// Flat colors, merged-as-possible simple geometry — no photoreal PBR/textures.
const HALL_HALF_WIDTH = 1.3;
const HALL_HEIGHT = 2.6;
const HALL_FRONT_Z = 2;
const HALL_BACK_Z = -19;
const HALL_LENGTH = HALL_FRONT_Z - HALL_BACK_Z;
const HALL_CENTER_Z = (HALL_FRONT_Z + HALL_BACK_Z) / 2;

export default function Hallway() {
  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, HALL_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HALL_HALF_WIDTH * 2, HALL_LENGTH]} />
        <meshStandardMaterial color="#4a2f1c" roughness={0.85} metalness={0} />
      </mesh>

      {/* Ceiling */}
      <mesh
        position={[0, HALL_HEIGHT, HALL_CENTER_Z]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[HALL_HALF_WIDTH * 2, HALL_LENGTH]} />
        <meshStandardMaterial color="#1c1410" roughness={1} />
      </mesh>

      {/* Left wall (normal points +X, into the hallway) */}
      <mesh
        position={[-HALL_HALF_WIDTH, HALL_HEIGHT / 2, HALL_CENTER_Z]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[HALL_LENGTH, HALL_HEIGHT]} />
        <meshStandardMaterial color="#6b4a34" roughness={0.9} />
      </mesh>

      {/* Right wall (normal points -X, into the hallway) */}
      <mesh
        position={[HALL_HALF_WIDTH, HALL_HEIGHT / 2, HALL_CENTER_Z]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[HALL_LENGTH, HALL_HEIGHT]} />
        <meshStandardMaterial color="#6b4a34" roughness={0.9} />
      </mesh>

      {/* Back wall behind the entrance */}
      <mesh position={[0, HALL_HEIGHT / 2, HALL_FRONT_Z]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[HALL_HALF_WIDTH * 2, HALL_HEIGHT]} />
        <meshStandardMaterial color="#5c3e2c" roughness={0.9} />
      </mesh>

      {/* Placeholder end wall — replaced by the real Door in M8 */}
      <mesh position={[0, HALL_HEIGHT / 2, HALL_BACK_Z]}>
        <planeGeometry args={[HALL_HALF_WIDTH * 2, HALL_HEIGHT]} />
        <meshStandardMaterial color="#2a1c12" roughness={1} />
      </mesh>
    </group>
  );
}
