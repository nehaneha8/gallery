import type { CSSProperties } from 'react';

// Shared with TitleCard's "Welcome to Neha's Gallery" so every glowing
// headline across the site (landing page included) reads as the same
// typographic voice, not a close approximation.
export const GLOW_TEXT_STYLE: CSSProperties = {
  fontFamily: '"Cinzel Decorative", Georgia, serif',
  fontWeight: 700,
  letterSpacing: '3px',
  color: '#ffffff',
  textShadow: '0 0 10px rgba(255,255,255,0.9), 0 0 26px rgba(255,255,255,0.6), 0 0 54px rgba(255,205,150,0.35)',
};
