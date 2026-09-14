// Ambient/fog baseline. The wall Lanterns carry the warm point lights
// (ARCHITECTURE.md §7/§9). Brightened from the original pass — DESIGN.md
// wants "warm pools ... darker areas between," but the initial tuning read
// as just plain dark rather than moody.
export default function Lighting() {
  return (
    <>
      <hemisphereLight args={['#7a6444', '#241a12', 1.1]} />
      <ambientLight intensity={0.38} color="#4a3624" />
      <fogExp2 attach="fog" args={['#1c130c', 0.03]} />
    </>
  );
}
