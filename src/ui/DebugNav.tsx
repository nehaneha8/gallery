// Throwaway M2 navigation UI — replaced by real FloorGlowPoint markers in M7.
import { waypoints } from '../data/waypoints';
import { useSceneStore } from '../store/useSceneStore';

export default function DebugNav() {
  const goToWaypoint = useSceneStore((s) => s.goToWaypoint);
  const activeWaypointId = useSceneStore((s) => s.activeWaypointId);
  const cameraMode = useSceneStore((s) => s.cameraMode);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 8,
        zIndex: 10,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {waypoints.map((wp) => (
        <button
          key={wp.id}
          onClick={() => goToWaypoint(wp.id)}
          disabled={cameraMode === 'MOVING'}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            background: wp.id === activeWaypointId ? '#ffb066' : 'rgba(255,255,255,0.15)',
            color: wp.id === activeWaypointId ? '#241811' : '#f0e6d8',
            cursor: cameraMode === 'MOVING' ? 'default' : 'pointer',
            fontSize: 13,
          }}
        >
          {wp.id}
        </button>
      ))}
    </div>
  );
}
