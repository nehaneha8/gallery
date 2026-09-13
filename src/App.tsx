import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import CameraRig from './three/CameraRig';
import Lighting from './three/Lighting';
import Hallway from './three/Hallway';
import PaintingWall from './three/PaintingWall';
import DebugNav from './ui/DebugNav';

export default function App() {
  return (
    <>
      <Canvas
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        camera={{ fov: 60, near: 0.1, far: 50, position: [0, 1.6, 1] }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <CameraRig />
          <Lighting />
          <Hallway />
          <PaintingWall />
        </Suspense>
      </Canvas>
      <DebugNav />
    </>
  );
}
