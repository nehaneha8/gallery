import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';
import { waypointById } from '../data/waypoints';
import { clamp, damp, easeInOutCubic } from '../lib/easing';

const MAX_YAW = THREE.MathUtils.degToRad(50);
const MAX_PITCH = THREE.MathUtils.degToRad(20);
const YAW_PER_PIXEL = 0.0035;
const PITCH_PER_PIXEL = 0.0035;
const LOOK_DAMP_LAMBDA = 10;
const BASE_MOVE_DURATION = 1.2;
const MOVE_DURATION_PER_METER = 0.12;
const MAX_MOVE_DURATION = 2.4;

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
  const previousWaypointId = useSceneStore((s) => s.previousWaypointId);
  const arrivedAtWaypoint = useSceneStore((s) => s.arrivedAtWaypoint);

  // Base look direction (no drag offset) per current waypoint, in yaw/pitch.
  const baseYawPitch = useRef({ yaw: 0, pitch: 0 });
  // Drag-look offsets, clamped, damped toward their drag target.
  const dragTarget = useRef({ yaw: 0, pitch: 0 });
  const dragCurrent = useRef({ yaw: 0, pitch: 0 });

  // MOVING-state tween bookkeeping.
  const move = useRef<{
    startPos: THREE.Vector3;
    startLook: THREE.Vector3;
    targetPos: THREE.Vector3;
    targetLook: THREE.Vector3;
    elapsed: number;
    duration: number;
  } | null>(null);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, yaw: 0, pitch: 0 });

  // Kick off a MOVING tween whenever we enter that mode for a new waypoint.
  useEffect(() => {
    if (cameraMode !== 'MOVING') return;
    const from = previousWaypointId ? waypointById.get(previousWaypointId) : null;
    const to = waypointById.get(activeWaypointId);
    if (!to) return;

    const startPos = camera.position.clone();
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const startLook = startPos.clone().add(forward.multiplyScalar(5));

    const targetPos = new THREE.Vector3(...to.position);
    const targetLook = new THREE.Vector3(...to.lookAt);

    const distance = from
      ? new THREE.Vector3(...from.position).distanceTo(targetPos)
      : startPos.distanceTo(targetPos);
    const duration = Math.min(
      MAX_MOVE_DURATION,
      BASE_MOVE_DURATION + distance * MOVE_DURATION_PER_METER,
    );

    move.current = { startPos, startLook, targetPos, targetLook, elapsed: 0, duration };
    // Reset drag-look offsets: the new waypoint has its own base look direction.
    dragTarget.current = { yaw: 0, pitch: 0 };
    dragCurrent.current = { yaw: 0, pitch: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraMode, activeWaypointId]);

  // Recompute base look direction whenever we settle on a waypoint.
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
    const mode = useSceneStore.getState().cameraMode;

    if (mode === 'MOVING' && move.current) {
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
        arrivedAtWaypoint(activeWaypointId);
      }
      return;
    }

    if (mode === 'IDLE') {
      const wp = waypointById.get(activeWaypointId);
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

    // VIEWING_PAINTING and DOOR_TRANSITION are implemented in later milestones
    // (M4 and M8/M11 respectively) — intentionally a no-op here for now.
  });

  return null;
}
