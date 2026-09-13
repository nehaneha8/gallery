import { create } from 'zustand';

export type CameraMode = 'IDLE' | 'MOVING' | 'VIEWING_PAINTING' | 'DOOR_TRANSITION';

interface SceneState {
  cameraMode: CameraMode;
  activeWaypointId: string;
  previousWaypointId: string | null;
  viewedArtworkId: string | null;
  doorState: 'CLOSED' | 'OPENING' | 'OPEN';
  goToWaypoint: (id: string) => void;
  arrivedAtWaypoint: (id: string) => void;
  viewArtwork: (id: string) => void;
  returnFromArtwork: () => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  cameraMode: 'IDLE',
  activeWaypointId: 'entrance',
  previousWaypointId: null,
  viewedArtworkId: null,
  doorState: 'CLOSED',

  goToWaypoint: (id) => {
    const { activeWaypointId, cameraMode } = get();
    if (cameraMode === 'MOVING' || id === activeWaypointId) return;
    set({ cameraMode: 'MOVING', previousWaypointId: activeWaypointId, activeWaypointId: id });
  },

  arrivedAtWaypoint: () => {
    set({ cameraMode: 'IDLE' });
  },

  viewArtwork: (id) => {
    const { cameraMode } = get();
    if (cameraMode !== 'IDLE') return;
    set({ cameraMode: 'VIEWING_PAINTING', viewedArtworkId: id });
  },

  returnFromArtwork: () => {
    set({ cameraMode: 'IDLE', viewedArtworkId: null });
  },
}));
