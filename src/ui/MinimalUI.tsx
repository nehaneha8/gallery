import { useSceneStore } from '../store/useSceneStore';

// Deliberately the only persistent chrome (DESIGN.md: "Traditional UI
// should be extremely minimal").
export default function MinimalUI() {
  const showListFallback = useSceneStore((s) => s.showListFallback);
  const setShowListFallback = useSceneStore((s) => s.setShowListFallback);
  const cameraMode = useSceneStore((s) => s.cameraMode);

  if (showListFallback || cameraMode === 'VIEWING_PAINTING' || cameraMode === 'VIEWING_BOOK')
    return null;

  return (
    <button
      onClick={() => setShowListFallback(true)}
      style={{
        position: 'fixed',
        top: 14,
        right: 16,
        zIndex: 15,
        background: 'transparent',
        border: 'none',
        color: 'rgba(240,230,216,0.55)',
        fontFamily: 'Georgia, serif',
        fontSize: 12,
        letterSpacing: 0.4,
        cursor: 'pointer',
        textDecoration: 'underline',
        textUnderlineOffset: 3,
      }}
    >
      view as list
    </button>
  );
}
