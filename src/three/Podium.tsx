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
const FLIP_BEND = 0.045;
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

function PageImage({ x, src }: { x: number; src: string }) {
  const texture = useTexture(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={[x, PAGE_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[PAGE_WIDTH, PAGE_HEIGHT]} />
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

function FlipPageMaterial({ src, side }: { src: string; side: THREE.Side }) {
  const texture = useTexture(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  return <meshStandardMaterial map={texture} roughness={0.95} side={side} />;
}

function FlipPageBlankMaterial({ side }: { side: THREE.Side }) {
  return <meshStandardMaterial color="#e8dcc0" roughness={1} side={side} />;
}

// The animated turning page: hinged at the spine (x=0), rotates around Z
// like the cover, and bends slightly (displacing along the geometry's own
// Z, which maps to world "up" once laid flat) so it reads as paper curling
// rather than a rigid flat card swinging over.
//
// Front and back are two separate meshes — one showing the page that's
// leaving (outgoingSrc, visible for the first half of the turn), one
// showing the actual destination page (incomingSrc, revealed once the
// leaf rotates past vertical) — rather than one DoubleSide mesh. They
// share a position/normal buffer (so the bend loop below updates both at
// once) but each gets its own UV attribute, with the back one's U
// flipped: viewing the *reverse* of a plane through the same UV mapping
// used on its front always mirrors whatever texture is on it, so a plain
// DoubleSide mesh could only ever show the outgoing image mirrored on the
// back — never the real incoming page unmirrored.
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
  const halfSpan = PAGE_WIDTH / 2;
  const meshOffsetX = direction === 'next' ? BOOK_HALF_WIDTH / 2 : -BOOK_HALF_WIDTH / 2;

  const { frontGeometry, backGeometry } = useMemo(() => {
    const base = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, FLIP_SEGMENTS, 1);
    const position = base.getAttribute('position');
    const normal = base.getAttribute('normal');
    const index = base.getIndex();
    const uv = base.getAttribute('uv') as THREE.BufferAttribute;

    const flippedUv = uv.clone();
    for (let i = 0; i < flippedUv.count; i++) {
      flippedUv.setX(i, 1 - flippedUv.getX(i));
    }

    const front = new THREE.BufferGeometry();
    front.setAttribute('position', position);
    front.setAttribute('normal', normal);
    front.setAttribute('uv', uv);
    if (index) front.setIndex(index);

    const back = new THREE.BufferGeometry();
    back.setAttribute('position', position); // shared — bending below updates both
    back.setAttribute('normal', normal);
    back.setAttribute('uv', flippedUv);
    if (index) back.setIndex(index);

    return { frontGeometry: front, backGeometry: back };
  }, []);

  useEffect(
    () => () => {
      frontGeometry.dispose();
      backGeometry.dispose();
    },
    [frontGeometry, backGeometry],
  );

  useFrame((_, delta) => {
    if (firedRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta / FLIP_DURATION);
    const p = progressRef.current;
    const angle = (direction === 'next' ? 1 : -1) * Math.PI * easeInOutQuad(p);
    if (pivotRef.current) pivotRef.current.rotation.z = angle;

    const posAttr = frontGeometry.attributes.position; // shared with backGeometry
    const bendScale = Math.sin(p * Math.PI) * FLIP_BEND;
    for (let i = 0; i < posAttr.count; i++) {
      const gx = posAttr.getX(i);
      const t = THREE.MathUtils.clamp((gx + halfSpan) / (2 * halfSpan), 0, 1);
      posAttr.setZ(i, Math.sin(t * Math.PI) * bendScale);
    }
    posAttr.needsUpdate = true;
    frontGeometry.computeVertexNormals();
    backGeometry.computeVertexNormals();

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
        <mesh geometry={frontGeometry}>
          {outgoingSrc ? (
            <FlipPageMaterial src={outgoingSrc} side={THREE.FrontSide} />
          ) : (
            <FlipPageBlankMaterial side={THREE.FrontSide} />
          )}
        </mesh>
        <mesh geometry={backGeometry}>
          {incomingSrc ? (
            <FlipPageMaterial src={incomingSrc} side={THREE.BackSide} />
          ) : (
            <FlipPageBlankMaterial side={THREE.BackSide} />
          )}
        </mesh>
      </group>
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
