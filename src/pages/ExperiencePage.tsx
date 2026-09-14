import type { CSSProperties } from 'react';
import { navigate } from '../routes/router';

// Placeholder content only — sections/copy to be filled in later. Kept
// deliberately plain (system font, generous whitespace, no 3D/glow
// treatment) so it reads as a distinct, minimalist "resume" register next
// to the gallery's ornate one.
const SECTIONS = [
  {
    id: 'work',
    title: 'Work',
    blurb: 'Placeholder — roles, companies, and dates go here.',
  },
  {
    id: 'volunteer',
    title: 'Volunteer',
    blurb: 'Placeholder — volunteer positions and organizations go here.',
  },
  {
    id: 'projects',
    title: 'Projects',
    blurb: 'Placeholder — personal or side projects go here.',
  },
] as const;

const backLinkStyle: CSSProperties = {
  position: 'fixed',
  top: 24,
  left: 24,
  color: '#888888',
  fontSize: 13,
  letterSpacing: '0.5px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export default function ExperiencePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0b0b0b',
        color: '#f2f2f2',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <button style={backLinkStyle} onClick={() => navigate('/')}>
        ← back
      </button>

      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '120px 24px 160px',
          display: 'flex',
          flexDirection: 'column',
          gap: 96,
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 300,
            letterSpacing: '1px',
            margin: 0,
          }}
        >
          My Experience
        </h1>

        {SECTIONS.map((section) => (
          <section key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: '0.5px',
                margin: 0,
                paddingBottom: 8,
                borderBottom: '1px solid #2a2a2a',
              }}
            >
              {section.title}
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#9a9a9a', margin: 0 }}>
              {section.blurb}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
