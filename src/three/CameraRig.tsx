import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';
import { waypointById } from '../data/waypoints';
import { getBookReadingPose } from '../data/sketchbook';
import { clamp, damp, easeInOutCubic } from '../lib/easing';

const MAX_YAW = THREE.MathUtils.degToRad(50);
const MAX_PITCH = THREE.MathUtils.degToRad(20);
const YAW_PER_PIXEL = 0.0035;
const PITCH_PER_PIXEL = 0.0035;
const LOOK_DAMP_LAMBDA = 10;
const BASE_MOVE_DURATION = 1.2;
const MOVE_DURATION_PER_METER = 0.12;
const MAX_MOVE_DURATION = 2.4;
const BOOK_FOCUS_DURATION = 0.9;

function dirToYawPitch(dir: THREE.Vector3): { yaw: number; pitch: number } {
  const pitch = Math.asin(clamp(dir.y, -1, 1));
  const yaw = Math.atan2(dir.x, dir.z);
  return { yaw, pitch };
}

function yawPitchToDir(yaw: number, pitch: number): THREE.Vector3 {
  const cp = Math.cos(pitch);
  return new THREE.Vector3(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp);
}

export default function CameraRig() {
  const { camera, gl } = useThree();

  const cameraMode = useSceneStore((s) => s.cameraMode);
  const activeWaypointId = useSceneStore((s) => s.activeWaypointId);
  const moveTarget = useSceneStore((s) => s.moveTarget);
  const bookState = useSceneStore((s) => s.bookState);

  const baseYawPitch = useRef({ yaw: 0, pitch: 0 });
  const dragTarget = useRef({ yaw: 0, pitch: 0 });
  const dragCurrent = useRef({ yaw: 0, pitch: 0 });

  const move = useRef<{
    startPos: THREE.Vector3;
    startLook: THREE.Vector3;
    targetPos: THREE.Vector3;
    targetLook: THREE.Vector3;
    elapsed: number;
    duration: number;
  } | null>(null);

  // Second click on the book (CLOSED -> OPENING) tips the camera down into
  // a closer "reading" pose, independent of the MOVING/moveTarget tween
  // above (which only fires on the first-click approach to the podium) —
  // cameraMode stays VIEWING_BOOK throughout so the overlay never unmounts.
  const bookFocus = useRef<{
    startPos: THREE.Vector3;
    startLook: THREE.Vector3;
    targetPos: THREE.Vector3;
    targetLook: THREE.Vector3;
    elapsed: number;
    duration: number;
  } | null>(null);
  const prevBookState = useRef(bookState);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, yaw: 0, pitch: 0 });

  // Kick off a MOVING tween whenever the store hands us a fresh target pose.
  // This single mechanism drives hallway walking, painting approach/return,
  // and the hallway->bedroom door transition (ARCHITECTURE.md §4/§11).
  // Deliberately a plain useEffect (runs on mount too, not just later
  // changes) — the earlier store.subscribe()-based version never fired for
  // the very first frame's setup, which left the camera looking nowhere.
  useEffect(() => {
    if (cameraMode !== 'MOVING' || !moveTarget) return;

    const startPos = camera.position.clone();
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const startLook = startPos.clone().add(forward.multiplyScalar(5));

    const targetPos = new THREE.Vector3(...moveTarget.position);
    const targetLook = new THREE.Vector3(...moveTarget.lookAt);
    const distance = startPos.distanceTo(targetPos);
    const reduced = useSceneStore.getState().reducedMotion;
    const duration = reduced
      ? 0.35
      : Math.min(MAX_MOVE_DURATION, BASE_MOVE_DURATION + distance * MOVE_DURATION_PER_METER);

    move.current = { startPos, startLook, targetPos, targetLook, elapsed: 0, duration };
    dragTarget.current = { yaw: 0, pitch: 0 };
    dragCurrent.current = { yaw: 0, pitch: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraMode, moveTarget]);

  // Fires once per book visit, exactly on the CLOSED -> OPENING edge (the
  // second click) — not on OPENING -> OPEN so it doesn't retrigger, and not
  // gated on cameraMode alone since VIEWING_BOOK also covers the moment the
  // approach tween above just finished with the book still closed.
  useEffect(() => {
    const prev = prevBookState.current;
    prevBookState.current = bookState;
    if (cameraMode !== 'VIEWING_BOOK' || prev !== 'CLOSED' || bookState !== 'OPENING') return;

    const startPos = camera.position.clone();
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const startLook = startPos.clone().add(forward.multiplyScalar(5));

    const readingPose = getBookReadingPose();
    const targetPos = new THREE.Vector3(...readingPose.position);
    const targetLook = new THREE.Vector3(...readingPose.lookAt);
    const reduced = useSceneStore.getState().reducedMotion;
    const duration = reduced ? 0.35 : BOOK_FOCUS_DURATION;

    bookFocus.current = { startPos, startLook, targetPos, targetLook, elapsed: 0, duration };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookState, cameraMode]);

  // Recompute base look direction whenever we settle into IDLE (including
  // on mount, since the entrance waypoint is IDLE from the start).
  useEffect(() => {
    if (cameraMode !== 'IDLE') return;
    const wp = waypointById.get(activeWaypointId);
    if (!wp) return;
    const dir = new THREE.Vector3(...wp.lookAt).sub(new THREE.Vector3(...wp.position)).normalize();
    baseYawPitch.current = dirToYawPitch(dir);
  }, [cameraMode, activeWaypointId]);

  // Pointer drag-to-look. Disabled outside IDLE per ARCHITECTURE.md §4.
  useEffect(() => {
    const el = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (useSceneStore.getState().cameraMode !== 'IDLE') return;
      isDragging.current = true;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        yaw: dragTarget.current.yaw,
        pitch: dragTarget.current.pitch,
      };
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      dragTarget.current = {
        yaw: clamp(dragStart.current.yaw - dx * YAW_PER_PIXEL, -MAX_YAW, MAX_YAW),
        pitch: clamp(dragStart.current.pitch - dy * PITCH_PER_PIXEL, -MAX_PITCH, MAX_PITCH),
      };
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging.current = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const state = useSceneStore.getState();

    if (state.cameraMode === 'MOVING' && move.current) {
      const m = move.current;
      m.elapsed += delta;
      const t = clamp(m.elapsed / m.duration, 0, 1);
      const eased = easeInOutCubic(t);

      camera.position.lerpVectors(m.startPos, m.targetPos, eased);
      const lookPoint = new THREE.Vector3().lerpVectors(m.startLook, m.targetLook, eased);
      camera.lookAt(lookPoint);

      if (t >= 1) {
        camera.position.copy(m.targetPos);
        camera.lookAt(m.targetLook);
        move.current = null;
        state.arrivedAtTarget();
      }
      return;
    }

    if (state.cameraMode === 'IDLE') {
      const wp = waypointById.get(state.activeWaypointId);
      if (!wp) return;
      const targetPos = new THREE.Vector3(...wp.position);
      camera.position.set(
        damp(camera.position.x, targetPos.x, LOOK_DAMP_LAMBDA, delta),
        damp(camera.position.y, targetPos.y, LOOK_DAMP_LAMBDA, delta),
        damp(camera.position.z, targetPos.z, LOOK_DAMP_LAMBDA, delta),
      );

      dragCurrent.current.yaw = damp(
        dragCurrent.current.yaw,
        dragTarget.current.yaw,
        LOOK_DAMP_LAMBDA,
        delta,
      );
      dragCurrent.current.pitch = damp(
        dragCurrent.current.pitch,
        dragTarget.current.pitch,
        LOOK_DAMP_LAMBDA,
        delta,
      );

      const yaw = baseYawPitch.current.yaw + dragCurrent.current.yaw;
      const pitch = baseYawPitch.current.pitch + dragCurrent.current.pitch;
      const dir = yawPitchToDir(yaw, pitch);
      camera.lookAt(camera.position.clone().add(dir));
    }

    if (state.cameraMode === 'VIEWING_BOOK' && bookFocus.current) {
      const bf = bookFocus.current;
      bf.elapsed += delta;
      const t = clamp(bf.elapsed / bf.duration, 0, 1);
      const eased = easeInOutCubic(t);

      camera.position.lerpVectors(bf.startPos, bf.targetPos, eased);
      const lookPoint = new THREE.Vector3().lerpVectors(bf.startLook, bf.targetLook, eased);
      camera.lookAt(lookPoint);

      if (t >= 1) {
        camera.position.copy(bf.targetPos);
        camera.lookAt(bf.targetLook);
        bookFocus.current = null;
      }
      return;
    }

    // VIEWING_PAINTING, and VIEWING_BOOK once settled: camera is already
    // parked exactly at the viewing pose from the tween above — nothing to
    // do per-frame.
  });

  return null;
}
