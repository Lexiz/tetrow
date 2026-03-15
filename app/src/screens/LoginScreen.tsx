import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import { APP_VERSION } from '../../../shared/version';

const W = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
const H = CONFIG.ROWS * CONFIG.CELL_SIZE + 80;

interface Props {
  onSignIn: () => void;
  authError?: string | null;
  isMobile?: boolean;
  onTerms?: () => void;
  onPrivacy?: () => void;
}

function TetrowLogo({ size }: { size: number }) {
  const blockSize = Math.round(size * 0.28);
  const gap = Math.round(blockSize * 0.08);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
      <span style={{
        fontFamily: "'Courier New', monospace",
        fontSize: size, fontWeight: 900, letterSpacing: -2,
        color: C.p2,
        textShadow: `0 0 20px ${C.p2}66, 0 0 40px ${C.p2}33`,
      }}>TETR</span>
      <span style={{
        display: 'inline-grid',
        gridTemplateColumns: `${blockSize}px ${blockSize}px`,
        gap: `${gap}px`,
        margin: '0 2px',
        alignSelf: 'center',
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: blockSize, height: blockSize,
            background: `radial-gradient(ellipse at 40% 35%, ${C.p1}ff 0%, ${C.p1}cc 40%, ${C.p1}88 100%)`,
            border: `1.5px solid ${C.p1b}`,
            borderRadius: 2,
            boxShadow: `inset 0 0 4px ${C.p1}88, 0 0 6px ${C.p1}bb`,
          }} />
        ))}
      </span>
      <span style={{
        fontFamily: "'Courier New', monospace",
        fontSize: size, fontWeight: 900, letterSpacing: -2,
        color: C.p2,
        textShadow: `0 0 20px ${C.p2}66, 0 0 40px ${C.p2}33`,
      }}>W</span>
    </span>
  );
}

export default function LoginScreen({ onSignIn, authError, isMobile, onTerms, onPrivacy }: Props) {
  const logoSize = isMobile ? 42 : 58;

  return (
    <div style={{
      width: isMobile ? '100vw' : W,
      height: isMobile ? '100dvh' : H,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      background: C.bg,
      position: 'relative', overflow: 'hidden',
      padding: isMobile ? '60px 16px 24px' : '48px 0 24px',
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

      {/* Top section: Logo + subtitle */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <TetrowLogo size={logoSize} />
        <div style={{
          fontFamily: 'monospace', fontSize: isMobile ? 11 : 13,
          letterSpacing: 7, color: C.white, marginTop: 16,
        }}>
          TWO PLAYERS · ONE BOARD
        </div>
      </div>

      {/* Middle section: Sign-in button */}
      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <button onClick={onSignIn} style={{
          padding: '16px 44px',
          background: C.bg,
          border: '2px solid transparent',
          borderImage: `linear-gradient(135deg, ${C.p1}, ${C.p2}) 1`,
          borderRadius: 0,
          fontFamily: 'monospace', fontSize: 14, fontWeight: 900,
          letterSpacing: 3, color: C.white, cursor: 'pointer',
          boxShadow: `0 0 12px ${C.p1}44, 0 0 12px ${C.p2}44, inset 0 0 8px rgba(255,180,100,0.06)`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <GoogleIcon />
          SIGN IN WITH GOOGLE
        </button>

        {authError && (
          <div style={{
            fontFamily: 'monospace', fontSize: 10,
            color: '#ff6b6b', textAlign: 'center', maxWidth: 300,
            lineHeight: 1.4,
          }}>
            {authError}
          </div>
        )}
      </div>

      {/* Bottom section: tagline, legal, version */}
      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{
          fontFamily: 'monospace', fontSize: 8,
          letterSpacing: 3, color: C.white, textAlign: 'center',
        }}>
          COMPETITIVE TETROW · RANKED MATCHES · LEADERBOARDS
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: 8,
          letterSpacing: 2, color: C.white, opacity: 0.5,
          display: 'flex', gap: 8,
        }}>
          <span
            onClick={onTerms}
            style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >TERMS OF SERVICE</span>
          <span>|</span>
          <span
            onClick={onPrivacy}
            style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >PRIVACY POLICY</span>
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: 9, letterSpacing: 3,
          color: C.white, opacity: 0.35,
        }}>v{APP_VERSION}</div>
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
