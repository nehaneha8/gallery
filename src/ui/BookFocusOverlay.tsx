import { useEffect, type CSSProperties } from 'react';
import { useSceneStore } from '../store/useSceneStore';
import { waypointById, waypointPose } from '../data/waypoints';
import { getSpreads } from '../data/sketchbook';

export default function BookFocusOverlay() {
  const cameraMode = useSceneStore((s) => s.cameraMode);
  const bookState = useSceneStore((s) => s.bookState);
  const currentSpread = useSceneStore((s) => s.currentSpread);
  const flipDirection = useSceneStore((s) => s.flipDirection);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (useSceneStore.getState().cameraMode !== 'VIEWING_BOOK') return;
      returnToHallway();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function returnToHallway() {
    const state = useSceneStore.getState();
    const wp = waypointById.get(state.activeWaypointId);
    if (!wp) return;
    state.returnFromBook(waypointPose(wp));
  }

  function handleBackgroundClick() {
    if (bookState === 'CLOSED') {
      useSceneStore.getState().openBook();
    } else {
      returnToHallway();
    }
  }

  if (cameraMode !== 'VIEWING_BOOK') return null;

  const spreads = getSpreads();
  const canGoPrev = currentSpread > 0 && !flipDirection;
  const canGoNext = currentSpread < spreads.length - 1 && !flipDirection;

  const arrowButtonStyle = (enabled: boolean): CSSProperties => ({
    border: 'none',
    background: 'none',
    padding: '4px 20px',
    fontSize: 40,
    fontWeight: 200,
    lineHeight: 1,
    color: '#ffffff',
    textShadow: enabled
      ? '0 0 8px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.65)'
      : '0 0 4px rgba(255,255,255,0.3)',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.3,
    transition: 'opacity 0.15s ease, text-shadow 0.15s ease',
  });

  return (
    <div
      onClick={handleBackgroundClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        background:
          'radial-gradient(ellipse at center, rgba(10,6,3,0) 35%, rgba(8,5,3,0.72) 100%)',
        cursor: 'pointer',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 36,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#f0e6d8',
          fontSize: 20,
          letterSpacing: 1,
        }}
      >
        Sketches
      </div>

      {bookState === 'OPEN' && (
        <div
          style={{
            position: 'fixed',
            top: '82%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 56,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (canGoPrev) useSceneStore.getState().requestPageFlip('prev');
            }}
            style={arrowButtonStyle(canGoPrev)}
            aria-label="Previous page"
          >
            ⟵
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (canGoNext) useSceneStore.getState().requestPageFlip('next');
            }}
            style={arrowButtonStyle(canGoNext)}
            aria-label="Next page"
          >
            ⟶
          </button>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
        }}
      >
        {bookState === 'CLOSED' && (
          <div style={{ color: 'rgba(240,230,216,0.6)', fontSize: 13, marginBottom: 10 }}>
            click the book to open it
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            returnToHallway();
          }}
          style={{
            padding: '6px 16px',
            borderRadius: 4,
            border: '1px solid rgba(255,176,102,0.4)',
            background: 'rgba(20,13,9,0.85)',
            color: '#ffb066',
            fontFamily: 'inherit',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ← Return to the hallway
        </button>
      </div>
    </div>
  );
}
