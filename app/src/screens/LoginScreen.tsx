import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import { APP_VERSION } from '../../../shared/version';

const W = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
const H = CONFIG.ROWS * CONFIG.CELL_SIZE + 80;

interface Props {
  onSignIn: () => void;
  authError?: string | null;
  isMobile?: boolean;
}

export default function LoginScreen({ onSignIn, authError, isMobile }: Props) {
  return (
    <div style={{
      width: isMobile ? '100vw' : W,
      height: isMobile ? '100dvh' : H,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.bg, gap: 32,
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
          fontSize: isMobile ? 42 : 58, fontWeight: 900, letterSpacing: -2,
          background: `linear-gradient(130deg, ${C.p1} 0%, ${C.p1b} 40%, ${C.p2b} 70%, ${C.p2} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: `drop-shadow(0 0 28px ${C.p1}66) drop-shadow(0 0 56px ${C.p2}33)`,
          lineHeight: 1,
        }}>CHESTET</div>
        <div style={{
          fontFamily: 'monospace', fontSize: 9, letterSpacing: 3,
          color: C.text, opacity: 0.7, marginTop: 8,
        }}>v{APP_VERSION}</div>
      </div>

      {/* Google Sign-In button */}
      <button onClick={onSignIn} style={{
        zIndex: 1,
        padding: '14px 36px',
        background: C.bg,
        border: `2px solid rgba(255,200,140,0.45)`,
        borderRadius: 5,
        fontFamily: 'monospace', fontSize: 13, fontWeight: 900,
        letterSpacing: 3, color: C.white, cursor: 'pointer',
        boxShadow: `0 0 7px rgba(255,180,100,0.4), 0 0 12px rgba(255,150,60,0.15), inset 0 0 8px rgba(255,180,100,0.06)`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <GoogleIcon />
        SIGN IN WITH GOOGLE
      </button>

      {authError && (
        <div style={{
          zIndex: 1, fontFamily: 'monospace', fontSize: 10,
          color: '#ff6b6b', textAlign: 'center', maxWidth: 300,
          lineHeight: 1.4,
        }}>
          {authError}
        </div>
      )}

      <div style={{
        zIndex: 1, fontFamily: 'monospace', fontSize: 8,
        letterSpacing: 3, color: C.text, opacity: 0.7, textAlign: 'center',
      }}>
        COMPETITIVE TETRIS · RANKED MATCHES · LEADERBOARDS
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
