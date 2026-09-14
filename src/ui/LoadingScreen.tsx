import { Loader } from '@react-three/drei';

// Themed progress screen (ARCHITECTURE.md §16) — Drei's useProgress plumbing,
// restyled so it doesn't read as a generic app spinner.
export default function LoadingScreen() {
  return (
    <Loader
      containerStyles={{ background: '#0b0705' }}
      innerStyles={{ width: '240px', height: '2px', background: '#3a2a1c' }}
      barStyles={{ height: '2px', background: '#ffb066' }}
      dataStyles={{
        color: '#e8cfa8',
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        marginTop: '14px',
        letterSpacing: '0.5px',
      }}
      dataInterpolation={(p) => `entering the hallway… ${p.toFixed(0)}%`}
    />
  );
}
