import { useState } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import { APP_VERSION } from '../../../shared/version';
import type { User } from 'firebase/auth';

const W = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
const H = CONFIG.ROWS * CONFIG.CELL_SIZE + 80;

interface Props {
  user: User;
  elo: number;
  onWarmUp: () => void;
  onRanked: () => void;
  onSignOut: () => void;
  isMobile?: boolean;
}

export default function MainMenu({ user, elo, onWarmUp, onRanked, onSignOut, isMobile }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = user.displayName || 'Player';
  const photoURL = user.photoURL;
  const rank = getRankLabel(elo);
  const rankCol = getRankColor(elo);

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
        ['20%', '15%', C.p1, 200],
        ['70%', '65%', C.p2, 180],
      ] as [string, string, string, number][]).map(([t, l, col, s], i) => (
        <div key={i} style={{
          position: 'absolute', top: t, left: l,
          width: s, height: s, borderRadius: '50%',
          background: `radial-gradient(circle, ${col}22 0%, transparent 70%)`,
          filter: 'blur(36px)',
        }} />
      ))}

      {/* Account menu (top-right) */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          background: 'none', border: `1px solid ${C.border}`,
          borderRadius: 4, padding: '5px 10px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {photoURL && (
            <img src={photoURL} alt="" style={{
              width: 22, height: 22, borderRadius: '50%',
              border: `1px solid ${C.border}`,
            }} referrerPolicy="no-referrer" />
          )}
          <span style={{
            fontFamily: 'monospace', fontSize: 10, color: C.text, fontWeight: 700,
          }}>{displayName}</span>
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4,
            background: C.panel, border: `1px solid ${C.border}`,
            borderRadius: 4, overflow: 'hidden', minWidth: 140,
          }}>
            {/* ELO info */}
            <div style={{
              padding: '10px 14px',
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{
                fontFamily: 'monospace', fontSize: 9, color: rankCol,
                letterSpacing: 2, fontWeight: 900,
              }}>{rank}</div>
              <div style={{
                fontFamily: 'monospace', fontSize: 10, color: C.text, opacity: 0.6,
              }}>{elo} ELO</div>
            </div>
            <button onClick={onSignOut} style={{
              width: '100%', padding: '10px 14px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'monospace', fontSize: 9, color: C.dim,
              letterSpacing: 1, textAlign: 'left',
            }}>SIGN OUT</button>
          </div>
        )}
      </div>

      {/* Title */}
      <div style={{ zIndex: 1, textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Courier New', monospace",
          fontSize: isMobile ? 42 : 56, fontWeight: 900, letterSpacing: -2,
          background: `linear-gradient(130deg, ${C.p1} 0%, ${C.p1b} 40%, ${C.p2b} 70%, ${C.p2} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: `drop-shadow(0 0 20px ${C.p1}44) drop-shadow(0 0 40px ${C.p2}22)`,
          lineHeight: 1,
        }}>CHESTET</div>
        <div style={{
          fontFamily: 'monospace', fontSize: 9, letterSpacing: 5,
          color: C.text, opacity: 0.5, marginTop: 8,
        }}>COMPETITIVE TETRIS</div>
      </div>

      {/* Two big buttons */}
      <div style={{
        zIndex: 1, display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 16, width: isMobile ? '100%' : 'auto',
        maxWidth: 420, padding: '0 24px', boxSizing: 'border-box',
      }}>
        <button onClick={onWarmUp} style={{
          flex: 1, minWidth: isMobile ? 'auto' : 180,
          padding: '28px 24px',
          background: '#080812',
          border: `2px solid ${C.p1}44`,
          borderRadius: 8, cursor: 'pointer',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 8,
          boxShadow: `0 0 20px ${C.p1}11`,
        }}>
          <div style={{
            fontFamily: 'monospace', fontSize: 14, fontWeight: 900,
            letterSpacing: 3, color: C.p1,
          }}>WARM UP</div>
          <div style={{
            fontFamily: 'monospace', fontSize: 9, color: C.text, opacity: 0.5,
            lineHeight: 1.5, textAlign: 'center',
          }}>Practice against AI</div>
        </button>

        <button onClick={onRanked} style={{
          flex: 1, minWidth: isMobile ? 'auto' : 180,
          padding: '28px 24px',
          background: '#080812',
          border: `2px solid ${C.p2}44`,
          borderRadius: 8, cursor: 'pointer',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 8,
          boxShadow: `0 0 20px ${C.p2}11`,
        }}>
          <div style={{
            fontFamily: 'monospace', fontSize: 14, fontWeight: 900,
            letterSpacing: 3, color: C.p2,
          }}>PLAY RANKED</div>
          <div style={{
            fontFamily: 'monospace', fontSize: 9, color: C.text, opacity: 0.5,
            lineHeight: 1.5, textAlign: 'center',
          }}>Compete for ELO</div>
        </button>
      </div>

      {/* Footer */}
      <div style={{
        zIndex: 1, fontFamily: 'monospace', fontSize: 8,
        letterSpacing: 3, color: C.dim,
      }}>
        CHESTET · v{APP_VERSION}
      </div>
    </div>
  );
}

function getRankLabel(elo: number): string {
  if (elo >= 2200) return 'DIAMOND';
  if (elo >= 1800) return 'PLATINUM';
  if (elo >= 1400) return 'GOLD';
  if (elo >= 1000) return 'SILVER';
  return 'BRONZE';
}

function getRankColor(elo: number): string {
  if (elo >= 2200) return '#b9f2ff';
  if (elo >= 1800) return '#e5e4e2';
  if (elo >= 1400) return '#ffd700';
  if (elo >= 1000) return '#c0c0c0';
  return '#cd7f32';
}
