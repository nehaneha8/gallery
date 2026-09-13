// Baseline lighting so the hallway and paintings are visible.
// This is intentionally minimal — the warm pooled candle/lantern lighting
// system (ARCHITECTURE.md §7/§9) replaces/extends this in M5.
export default function Lighting() {
  return (
    <>
      <hemisphereLight args={['#4a3a2c', '#0c0906', 0.55]} />
      <ambientLight intensity={0.12} color="#3a2a1c" />
      <fogExp2 attach="fog" args={['#120c08', 0.045]} />
      <pointLight position={[0, 2.3, -2]} color="#ffb066" intensity={6} distance={5} decay={2} />
      <pointLight position={[0, 2.3, -6.4]} color="#ffb066" intensity={6} distance={5} decay={2} />
      <pointLight position={[0, 2.3, -10.8]} color="#ffb066" intensity={6} distance={5} decay={2} />
      <pointLight position={[0, 2.3, -15]} color="#ffb066" intensity={6} distance={5} decay={2} />
    </>
  );
}
