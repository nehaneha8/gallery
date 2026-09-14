import Fireflies from './Fireflies';

// Combined firefly + dust budget stays well under the 50-visible cap from
// DESIGN.md ("never more than approximately 50 visible at once").
export default function Atmosphere() {
  return (
    <>
      <Fireflies
        count={26}
        color="#ffcf8a"
        size={6}
        speed={0.15}
        amplitude={0.35}
        bounds={{ x: 1.05, yMin: 0.4, yMax: 2.2, zMin: -18, zMax: 1 }}
      />
      <Fireflies
        count={20}
        color="#9fb3c8"
        size={3}
        speed={0.08}
        amplitude={0.2}
        bounds={{ x: 1.15, yMin: 0.15, yMax: 2.3, zMin: -18, zMax: 1 }}
      />
    </>
  );
}
