import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';

const W = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
const H = CONFIG.ROWS * CONFIG.CELL_SIZE + 80;

interface Props {
  onStart: () => void;
  isMobile?: boolean;
}

export default function StartScreen({ onStart, isMobile }: Props) {
  return (
    <div style={{
      width: isMobile ? '100vw' : W,
      height: isMobile ? '100dvh' : H,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.bg, gap: isMobile ? 22 : 28,
      position: 'relative', overflow: 'hidden',
      padding: isMobile ? '16px' : 0,
      boxSizing: 'border-box',
    }}>
      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `
          linear-gradient(${C.p1} 1px, transparent 1px),
          linear-gradient(90deg, ${C.p2} 1px, transparent 1px)
        `,
        backgroundSize: `${CONFIG.CELL_SIZE}px ${CONFIG.CELL_SIZE}px`,
      }} />

      {/* Ambient glow blobs */}
      {([
        ['24%', '18%', C.p1, 260],
        ['68%', '62%', C.p2, 220],
      ] as [string, string, string, number][]).map(([t, l, col, s], i) => (
        <div key={i} style={{
          position: 'absolute', top: t, left: l,
          width: s, height: s, borderRadius: '50%',
          background: `radial-gradient(circle, ${col}22 0%, transparent 70%)`,
          filter: 'blur(36px)',
        }} />
      ))}

      {/* Title */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{
          fontFamily: 'monospace', fontSize: 9,
          letterSpacing: 7, color: C.text, marginBottom: 10,
          opacity: 0.7,
        }}>
          TWO PLAYERS · ONE BOARD
        </div>
        <div style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 58, fontWeight: 900, letterSpacing: -2,
          background: `linear-gradient(130deg, ${C.p1} 0%, ${C.p1b} 40%, ${C.p2b} 70%, ${C.p2} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: `drop-shadow(0 0 28px ${C.p1}66) drop-shadow(0 0 56px ${C.p2}33)`,
          lineHeight: 1,
        }}>TETCHES</div>
      </div>

      {/* Start button */}
      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <button onClick={onStart} style={{
          padding: '18px 68px',
          background: C.bg,
          border: `2px solid rgba(255,200,140,0.45)`,
          borderRadius: 5,
          fontFamily: 'monospace', fontSize: 13, fontWeight: 900,
          letterSpacing: 4, color: C.white, cursor: 'pointer',
          boxShadow: `0 0 7px rgba(255,180,100,0.4), 0 0 12px rgba(255,150,60,0.15), inset 0 0 8px rgba(255,180,100,0.06)`,
        }}>START MATCH</button>
        <div style={{ color: C.text, fontFamily: 'monospace', fontSize: 8, letterSpacing: 3, opacity: 0.5 }}>
          {isMobile ? 'TOUCH GESTURES' : 'ARROWS + SPACE'}
        </div>
      </div>

      {/* Controls section header */}
      <div style={{
        zIndex: 1, fontFamily: 'monospace', fontSize: 8, letterSpacing: 4,
        color: C.text, opacity: 0.5,
      }}>
        {isMobile ? 'TOUCH CONTROLS' : 'KEYBOARD CONTROLS'}
      </div>

      {/* Controls reference — stacked vertically, columns aligned */}
      <div style={{
        zIndex: 1,
        display: 'grid',
        gridTemplateColumns: isMobile ? '90px auto' : '70px auto',
        gap: '6px 10px',
        alignItems: 'center',
      }}>
        {(isMobile ? [
          ['SWIPE ← →', 'Move'],
          ['TAP LEFT',   'Rotate CCW'],
          ['TAP RIGHT',  'Rotate CW'],
          ['DRAG ↓',     'Soft Drop'],
          ['SWIPE ↓',    'Hard Drop'],
        ] : [
          ['← →',   'Move'],
          ['↑ / Z',  'Rotate'],
          ['↓',      'Soft Drop'],
          ['SPACE',  'Hard Drop'],
        ] as [string, string][]).map(([k, a]) => ([
          <span key={k} style={{
            fontFamily: 'monospace', fontSize: isMobile ? 9 : 10, color: C.p1,
            background: '#080812', border: `1px solid ${C.p1}55`,
            padding: '2px 8px', borderRadius: 3,
            textAlign: 'center', display: 'block',
            boxShadow: `0 0 8px ${C.p1}33, inset 0 0 6px ${C.p1}11`,
          }}>{k}</span>,
          <span key={`${k}-label`} style={{
            fontFamily: 'monospace', fontSize: isMobile ? 9 : 10, color: C.text, opacity: 0.7,
          }}>{a}</span>,
        ]))}
      </div>
    </div>
  );
}
