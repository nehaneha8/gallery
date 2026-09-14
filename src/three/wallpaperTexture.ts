import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// references/wallpaper/wallpaper.jpg is 480x640 (portrait, aspect 0.75).
// Tiling by a fixed repeat COUNT stretched the pattern on any wall whose
// aspect ratio didn't match the source photo — this instead fixes a
// real-world tile SIZE (in meters) and derives repeat counts per plane from
// its own width/height, so the pattern scale stays consistent and
// undistorted everywhere it's used.
const NATIVE_ASPECT = 480 / 640;
const TILE_HEIGHT_M = 1.3;
const TILE_WIDTH_M = TILE_HEIGHT_M * NATIVE_ASPECT;

// planeWidth/planeHeight must match the plane's own <planeGeometry args=[w,h]>
// so repeat.x always lands on the geometry's own width axis.
export function useWallpaperTexture(planeWidth: number, planeHeight: number) {
  const base = useTexture('/textures/wallpaper.webp');
  return useMemo(() => {
    const tex = base.clone();
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(planeWidth / TILE_WIDTH_M, planeHeight / TILE_HEIGHT_M);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, planeWidth, planeHeight]);
}
