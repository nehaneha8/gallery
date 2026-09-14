import { Suspense, lazy, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import CameraRig from './three/CameraRig';
import Lighting from './three/Lighting';
import Hallway from './three/Hallway';
import HallwayDecor from './three/HallwayDecor';
import PaintingWall from './three/PaintingWall';
import FloorGlowPoints from './three/FloorGlowPoints';
import Door from './three/Door';
import Podium from './three/Podium';
import Atmosphere from './three/Atmosphere';
import KeyboardNav from './three/KeyboardNav';
import LoadingScreen from './ui/LoadingScreen';
import TitleCard from './ui/TitleCard';
import PaintingFocusOverlay from './ui/PaintingFocusOverlay';
import BookFocusOverlay from './ui/BookFocusOverlay';
import MinimalUI from './ui/MinimalUI';
import ReturnHomeButton from './ui/ReturnHomeButton';
import AccessibleListFallback, { hasWebGL2 } from './ui/AccessibleListFallback';
import { useSceneStore } from './store/useSceneStore';

const Bedroom = lazy(() => import('./three/Bedroom'));

export default function App() {
  const webgl2 = useMemo(hasWebGL2, []);
  const showListFallback = useSceneStore((s) => s.showListFallback);

  if (!webgl2) {
    return <AccessibleListFallback forced />;
  }

  return (
    <>
      <Canvas
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.35 }}
        camera={{ fov: 60, near: 0.1, far: 50, position: [0, 1.6, 1] }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <CameraRig />
          <Lighting />
          <Hallway />
          <HallwayDecor />
          <PaintingWall />
          <FloorGlowPoints />
          <Door />
          <Podium />
          <Atmosphere />
          <KeyboardNav />
          <Suspense fallback={null}>
            <Bedroom />
          </Suspense>
        </Suspense>
      </Canvas>
      <LoadingScreen />
      <TitleCard />
      <PaintingFocusOverlay />
      <BookFocusOverlay />
      <MinimalUI />
      <ReturnHomeButton />
      {showListFallback && <AccessibleListFallback forced={false} />}
    </>
  );
}
