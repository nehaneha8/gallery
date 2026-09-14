import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';
import { getNearestWaypointId } from '../data/waypoints';
import {
  PODIUM_POSITION,
  PODIUM_ROTATION_Y,
  getBookViewingPose,
  getSpreads,
  sketchPages,
} from '../data/sketchbook';

// Warm the texture cache for every sketch up front, so switching a
// PageFace's `src` (on flip completion, or on the flip-vacated slot below)
// never hits an un-cached useTexture() call mid-interaction — there'd be
// nothing to suspend on, so nothing for the old page to linger behind.
useTexture.preload(sketchPages.map((p) => p.src));

const PEDESTAL_HEIGHT = 0.95;
const TOP_Y = PEDESTAL_HEIGHT;
const BOOK_HALF_WIDTH = 0.23;
const BOOK_DEPTH = 0.32;
const PAGE_THICKNESS = 0.03;
const COVER_THICKNESS = 0.015;
// Props open near-vertical (not a full flat flip) — keeps the swing's
// footprint small so it doesn't need extra pedestal depth.
const OPEN_ANGLE = Math.PI * 0.56;
const OPEN_DURATION = 1.3;
const FLIP_DURATION = 0.85;
// A curled (non-zero) leaf bulges at its center while its edges stay
// flat — different parts of the same leaf then face different directions
// at once, so front-face/back-face culling can show BOTH sides in
// different regions of the same leaf simultaneously mid-turn (the bulge
// flips to the incoming image before the flatter edges do). From the
// steep bird's-eye reading angle that reads as the page visibly splitting
// down the middle and briefly showing the old page next to the new one.
// Kept flat (0) to rule that out structurally — a flat plane's normal is
// uniform, so it can never expose both faces at once.
const FLIP_BEND = 0;
const FLIP_SEGMENTS = 10;
const PAGE_WIDTH = BOOK_HALF_WIDTH * 0.94;
const PAGE_HEIGHT = BOOK_DEPTH * 0.9;
const PAGE_Y = TOP_Y + PAGE_THICKNESS + 0.002;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// "Contain" fit — sketches aren't all the same shape as the page slot (a
// landscape photo like a horizontal sketch vs. the portrait-ish
// PAGE_WIDTH x PAGE_HEIGHT box), so stretching every image to exactly fill
// the slot squashed anything that didn't already match its aspect ratio.
// This sizes the plane down within the box instead, on whichever axis the
// image doesn't need, preserving its real proportions.
function containSize(imageWidth: number, imageHeight: number, boxWidth: number, boxHeight: number) {
  const imageAspect = imageWidth / imageHeight;
  const boxAspect = boxWidth / boxHeight;
  return imageAspect > boxAspect
    ? { width: boxWidth, height: boxWidth / imageAspect }
    : { width: boxHeight * imageAspect, height: boxHeight };
}

function PageImage({ x, src }: { x: number; src: string }) {
  const texture = useTexture(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  const { width, height } = containSize(texture.image.width, texture.image.height, PAGE_WIDTH, PAGE_HEIGHT);
  return (
    <mesh position={[x, PAGE_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture} roughness={0.95} />
    </mesh>
  );
}

function BlankPage({ x }: { x: number }) {
  return (
    <mesh position={[x, PAGE_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[PAGE_WIDTH, PAGE_HEIGHT]} />
      <meshStandardMaterial color="#e8dcc0" roughness={1} />
    </mesh>
  );
}

// One mesh per slot — deliberately not "every spread pre-mounted, toggle
// visible" (that briefly put two spreads' pages at the identical position
// on screen at once during a flip, z-fighting unpredictably for a frame).
// With textures preloaded above, swapping which spread's src a single
// PageFace points at is already instant with nothing to suspend on, so
// there's no need for the extra always-mounted copies.
function PageFace({ side, src }: { side: 'left' | 'right'; src: string | null }) {
  const x = side === 'left' ? -BOOK_HALF_WIDTH / 2 : BOOK_HALF_WIDTH / 2;
  return src ? <PageImage x={x} src={src} /> : <BlankPage x={x} />;
}

// Shared by every flip-face geometry below (whatever its own size ends up
// being, from its own contain-fit) so the paper-curl bend always reads the
// same regardless of a given image's proportions.
function bendGeometry(geometry: THREE.BufferGeometry, halfSpan: number, progress: number) {
  const posAttr = geometry.attributes.position;
  const bendScale = Math.sin(progress * Math.PI) * FLIP_BEND;
  for (let i = 0; i < posAttr.count; i++) {
    const gx = posAttr.getX(i);
    const t = THREE.MathUtils.clamp((gx + halfSpan) / (2 * halfSpan), 0, 1);
    posAttr.setZ(i, Math.sin(t * Math.PI) * bendScale);
  }
  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
}

// Back faces need their U flipped: viewing the *reverse* of a plane
// through the same UV mapping used on its front always mirrors whatever
// texture is on it, so without this a back face would show its image
// mirrored left-right.
function buildFlipGeometry(width: number, height: number, side: THREE.Side) {
  const geometry = new THREE.PlaneGeometry(width, height, FLIP_SEGMENTS, 1);
  if (side === THREE.BackSide) {
    const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
  }
  return geometry;
}

// One image-bearing face of the turning leaf. Sized via the same
// contain-fit as the resting PageImage (not the fixed PAGE_WIDTH x
// PAGE_HEIGHT box) so a page doesn't visibly "pop" from stretched-while-
// turning to correctly-proportioned the instant it settles. Front and back
// get independently-sized geometries (rather than sharing one, as before)
// since the outgoing and incoming images can have different aspect ratios.
function FlipFace({
  src,
  side,
  progressRef,
}: {
  src: string;
  side: THREE.Side;
  progressRef: { current: number };
}) {
  const texture = useTexture(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  const { width, height } = containSize(texture.image.width, texture.image.height, PAGE_WIDTH, PAGE_HEIGHT);
  const halfSpan = width / 2;

  const geometry = useMemo(() => buildFlipGeometry(width, height, side), [width, height, side]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => bendGeometry(geometry, halfSpan, progressRef.current));

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial map={texture} roughness={0.95} side={side} />
    </mesh>
  );
}

function FlipFaceBlank({ side, progressRef }: { side: THREE.Side; progressRef: { current: number } }) {
  const halfSpan = PAGE_WIDTH / 2;
  const geometry = useMemo(() => buildFlipGeometry(PAGE_WIDTH, PAGE_HEIGHT, side), [side]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => bendGeometry(geometry, halfSpan, progressRef.current));

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#e8dcc0" roughness={1} side={side} />
    </mesh>
  );
}

// The animated turning page: hinged at the spine (x=0), rotates around Z
// like the cover, and (via FlipFace above) bends slightly so it reads as
// paper curling rather than a rigid flat card swinging over. Front and
// back are separate meshes — one showing the page that's leaving
// (outgoingSrc, visible for the first half of the turn), one showing the
// actual destination page (incomingSrc, revealed once the leaf rotates
// past vertical) — rather than one DoubleSide mesh, which could only ever
// show the outgoing image mirrored on the back, never the real incoming
// page unmirrored.
function FlipPage({
  direction,
  outgoingSrc,
  incomingSrc,
  onComplete,
}: {
  direction: 'next' | 'prev';
  outgoingSrc: string | null;
  incomingSrc: string | null;
  onComplete: (newSpread: number) => void;
}) {
  const pivotRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const firedRef = useRef(false);
  const meshOffsetX = direction === 'next' ? BOOK_HALF_WIDTH / 2 : -BOOK_HALF_WIDTH / 2;

  useFrame((_, delta) => {
    if (firedRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta / FLIP_DURATION);
    const p = progressRef.current;
    const angle = (direction === 'next' ? 1 : -1) * Math.PI * easeInOutQuad(p);
    if (pivotRef.current) pivotRef.current.rotation.z = angle;

    if (p >= 1) {
      // r3f's render loop can tick again before React commits the store
      // update below and unmounts this component (flipDirection -> null) —
      // without this guard that extra frame would call onComplete a second
      // time and double-advance currentSpread.
      firedRef.current = true;
      onComplete(useSceneStore.getState().currentSpread + (direction === 'next' ? 1 : -1));
    }
  });

  return (
    <group ref={pivotRef} position={[0, TOP_Y + PAGE_THICKNESS + 0.004, 0]}>
      <group position={[meshOffsetX, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {outgoingSrc ? (
          <FlipFace src={outgoingSrc} side={THREE.FrontSide} progressRef={progressRef} />
        ) : (
          <FlipFaceBlank side={THREE.FrontSide} progressRef={progressRef} />
        )}
        {incomingSrc ? (
          <FlipFace src={incomingSrc} side={THREE.BackSide} progressRef={progressRef} />
        ) : (
          <FlipFaceBlank side={THREE.BackSide} progressRef={progressRef} />
        )}
      </group>
    </group>
  );
}

// Faint light pool on the floor around the podium's base, same additive
// glow-sprite technique as the hallway's floor waypoint markers (see
// FloorGlowPoint.tsx) but dimmer and slower — a quiet ambient accent
// marking the book's spot, not a clickable "walk here" cue.
function PodiumGlow() {
  const glowTex = useTexture('/textures/glow.webp');
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);
  const haloMesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const pulse = 0.55 + Math.sin(state.clock.elapsedTime * 1.1) * 0.3;
    if (coreMat.current) coreMat.current.opacity = 0.22 * pulse;
    if (haloMat.current) haloMat.current.opacity = 0.12 * pulse;
    if (haloMesh.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.1) * 0.1;
      haloMesh.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={[0, 0.012, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial
          ref={coreMat}
          map={glowTex}
          color="#ffcf8a"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={haloMesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial
          ref={haloMat}
          map={glowTex}
          color="#ffb066"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function Podium() {
  const pivot = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const spreads = getSpreads();
  const currentSpread = useSceneStore((s) => s.currentSpread);
  const flipDirection = useSceneStore((s) => s.flipDirection);
  const spread = spreads[Math.min(currentSpread, spreads.length - 1)];
  const targetIndex =
    flipDirection === 'next' ? currentSpread + 1 : flipDirection === 'prev' ? currentSpread - 1 : null;
  const targetSpread = targetIndex !== null ? (spreads[targetIndex] ?? null) : null;
  const outgoingSrc = flipDirection === 'next' ? spread.right : flipDirection === 'prev' ? spread.left : null;
  const incomingSrc =
    flipDirection === 'next' ? (targetSpread?.left ?? null) : flipDirection === 'prev' ? (targetSpread?.right ?? null) : null;

  // The slot the flipping leaf starts on top of (right for 'next', left for
  // 'prev') is only ever occluded by the leaf itself — the viewer never
  // actually sees the old page sitting there. So that slot can switch to
  // the destination spread's image immediately, matching exactly what the
  // leaf's back face reveals once it clears, instead of waiting for
  // completion and risking a stale frame in between.
  const leftSrc = flipDirection === 'prev' && targetSpread ? targetSpread.left : spread.left;
  const rightSrc = flipDirection === 'next' && targetSpread ? targetSpread.right : spread.right;

  useFrame((_, delta) => {
    const bookState = useSceneStore.getState().bookState;
    if (bookState === 'OPENING') {
      progress.current = Math.min(1, progress.current + delta / OPEN_DURATION);
      if (pivot.current) pivot.current.rotation.z = OPEN_ANGLE * easeOutCubic(progress.current);
      if (progress.current >= 1) useSceneStore.setState({ bookState: 'OPEN' });
    } else if (bookState === 'CLOSED' && progress.current > 0) {
      // Closing the book behind you (returnFromBook resets bookState
      // straight to CLOSED) only reset the logical state — the cover's
      // own rotation needs its own animation back down, otherwise it's
      // left visually open even though a re-approach shows "closed" UI.
      progress.current = Math.max(0, progress.current - delta / OPEN_DURATION);
      if (pivot.current) pivot.current.rotation.z = OPEN_ANGLE * easeOutCubic(progress.current);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const state = useSceneStore.getState();
    if (state.cameraMode === 'IDLE') {
      // Always re-approachable, whether the book is still closed or was
      // already opened on an earlier visit — it shouldn't become
      // permanently unclickable after the first time.
      state.viewBook(getBookViewingPose(), getNearestWaypointId(PODIUM_POSITION));
    } else if (state.cameraMode === 'VIEWING_BOOK' && state.bookState === 'CLOSED') {
      state.openBook();
    }
  };

  return (
    <group
      position={PODIUM_POSITION}
      rotation={[0, PODIUM_ROTATION_Y, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
      }}
    >
      <PodiumGlow />

      {/* Rustic pedestal: tapered post + wide reading surface */}
      <mesh position={[0, PEDESTAL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.1, 0.16, PEDESTAL_HEIGHT, 10]} />
        <meshStandardMaterial color="#3a2a1c" roughness={0.95} />
      </mesh>
      <mesh position={[0, TOP_Y - 0.02, 0]}>
        <boxGeometry args={[0.6, 0.04, 0.45]} />
        <meshStandardMaterial color="#4a3626" roughness={0.9} />
      </mesh>

      {/* Pages block (paper stack edge) */}
      <mesh position={[0, TOP_Y + PAGE_THICKNESS / 2, 0]}>
        <boxGeometry args={[BOOK_HALF_WIDTH * 2, PAGE_THICKNESS, BOOK_DEPTH]} />
        <meshStandardMaterial color="#e2d3a8" roughness={1} />
      </mesh>

      {/* The two open page faces — always present, just hidden under the
          closed cover until it swings away, and briefly hidden under the
          animated FlipPage while a page turn is in progress */}
      <PageFace side="left" src={leftSrc} />
      <PageFace side="right" src={rightSrc} />

      {flipDirection && (
        <FlipPage
          key={`${flipDirection}-${currentSpread}`}
          direction={flipDirection}
          outgoingSrc={outgoingSrc}
          incomingSrc={incomingSrc}
          onComplete={(newSpread) => useSceneStore.getState().completePageFlip(newSpread)}
        />
      )}

      {/* Cover, hinged at the spine (left edge) — rotates around Z like a
          real book cover: lifts up and lays over to the side. */}
      <group ref={pivot} position={[-BOOK_HALF_WIDTH, TOP_Y + PAGE_THICKNESS, 0]}>
        <mesh position={[BOOK_HALF_WIDTH, COVER_THICKNESS / 2, 0]}>
          <boxGeometry args={[BOOK_HALF_WIDTH * 2, COVER_THICKNESS, BOOK_DEPTH + 0.02]} />
          <meshStandardMaterial color="#4a2818" roughness={0.7} />
        </mesh>
        {/* Simple clasp/strap detail for a rustic, worn look */}
        <mesh position={[BOOK_HALF_WIDTH * 1.7, COVER_THICKNESS + 0.005, 0]}>
          <boxGeometry args={[0.06, 0.01, 0.1]} />
          <meshStandardMaterial color="#2a1c10" roughness={0.6} metalness={0.2} />
        </mesh>
      </group>
    </group>
  );
}
