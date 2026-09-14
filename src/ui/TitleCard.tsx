import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

const FADE_SECONDS = 3;
const HOLD_SECONDS = 1;
const TITLE_TEXT = "Welcome to Neha's Gallery";

// One-shot fade in / hold / fade out, gated on drei's shared load-progress
// store rather than firing on mount — starting the moment the scene assets
// (and any lazy chunks queued at startup) are actually ready, not while the
// LoadingScreen is still covering the canvas.
export default function TitleCard() {
  const { active, progress } = useProgress();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [gone, setGone] = useState(false);

  // Split from the timer effect below on purpose: `active`/`progress` keep
  // changing for a while after the title's own sequence has already kicked
  // off (other textures — sketchbook pages, hovered paintings — preload in
  // the background), and if the timer effect depended on them directly,
  // each of those later updates would re-run it, and its cleanup would
  // cancel the already-scheduled hide/gone timers without ever
  // rescheduling them (the started-guard blocks that) — the title would
  // fade in and then just get stuck. `ready` only ever flips false -> true
  // once, so the timer effect below is immune to that churn.
  useEffect(() => {
    if (ready || active || progress < 100) return;
    setReady(true);
  }, [active, progress, ready]);

  useEffect(() => {
    if (!ready) return;

    const showFrame = requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => setVisible(false), (FADE_SECONDS + HOLD_SECONDS) * 1000);
    const goneTimer = setTimeout(() => setGone(true), (FADE_SECONDS * 2 + HOLD_SECONDS) * 1000);

    return () => {
      cancelAnimationFrame(showFrame);
      clearTimeout(hideTimer);
      clearTimeout(goneTimer);
    };
  }, [ready]);

  if (gone) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 35,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: '"Cinzel Decorative", Georgia, serif',
          fontWeight: 700,
          fontSize: 'clamp(24px, 4.2vw, 42px)',
          letterSpacing: '3px',
          textAlign: 'center',
          padding: '0 24px',
          color: '#ffffff',
          textShadow:
            '0 0 10px rgba(255,255,255,0.9), 0 0 26px rgba(255,255,255,0.6), 0 0 54px rgba(255,205,150,0.35)',
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_SECONDS}s ease-in-out`,
        }}
      >
        {TITLE_TEXT}
      </div>
    </div>
  );
}
