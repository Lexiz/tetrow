import { useState } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import { APP_VERSION } from '../../../shared/version';
import type { User } from 'firebase/auth';
import TetrowLogo from '../common/TetrowLogo';

const W = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
const H = CONFIG.ROWS * CONFIG.CELL_SIZE + 80;

interface Props {
  user: User;
  elo: number;
  onWarmUp: () => void;
  onRanked: () => void;
  onSignOut: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
  isMobile?: boolean;
}

function WarmUpIcon() {
  const s = 8;
  const g = 2;
  const col = C.p1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: g }}>
      <div style={{ display: 'flex', gap: g }}>
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
        <div style={{ width: s, height: s, opacity: 0 }} />
      </div>
      <div style={{ display: 'flex', gap: g }}>
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
        <div style={{ width: s, height: s, opacity: 0 }} />
      </div>
      <div style={{ display: 'flex', gap: g }}>
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
      </div>
    </div>
  );
}

function RankedIcon() {
  const s = 8;
  const g = 2;
  const col = C.p2;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: g, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: g }}>
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
      </div>
      <div style={{ display: 'flex', gap: g }}>
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
        <div style={{
          width: s, height: s, borderRadius: 1,
          border: `1px solid ${col}`,
          boxShadow: `0 0 4px ${col}88`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 3, height: 3, background: col, borderRadius: '50%' }} />
        </div>
      </div>
      <div style={{ width: 1, height: s, background: col, boxShadow: `0 0 4px ${col}88` }} />
    </div>
  );
}

export default function MainMenu({ user, elo, onWarmUp, onRanked, onSignOut, onTerms, onPrivacy, isMobile }: Props) {
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
      alignItems: 'center', justifyContent: 'space-between',
      background: C.bg,
      position: 'relative', overflow: 'hidden',
      padding: isMobile ? '0 20px 24px' : '0 0 24px',
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
          <>
          <div onClick={() => setMenuOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: -1,
          }} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4,
            background: C.panel, border: `1px solid ${C.border}`,
            borderRadius: 4, overflow: 'hidden', minWidth: 140,
          }}>
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
              fontFamily: 'monospace', fontSize: 9, color: C.white,
              letterSpacing: 1, textAlign: 'left',
            }}>SIGN OUT</button>
          </div>
          </>
        )}
      </div>

      {/* Logo + subtitle */}
      <div style={{ flex: 5 }} />
      <div style={{ zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <TetrowLogo size={isMobile ? 38 : 48} />
        <div style={{
          fontFamily: 'monospace', fontSize: 9, letterSpacing: 5,
          color: C.white, opacity: 0.7, marginTop: 12,
        }}>COMPETITIVE TETROW</div>
      </div>
      <div style={{ flex: 3 }} />

      {/* Buttons */}
      <div style={{
        zIndex: 1, display: 'flex', flexDirection: 'column',
        gap: 14, width: '100%',
        maxWidth: 380, boxSizing: 'border-box',
      }}>
        <button onClick={onWarmUp} style={{
          padding: '20px 24px',
          background: '#080812',
          border: `2px solid ${C.p1}66`,
          borderRadius: 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 18,
          boxShadow: `0 0 16px ${C.p1}11`,
        }}>
          <WarmUpIcon />
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 14, fontWeight: 900,
              letterSpacing: 3, color: C.p1,
            }}>PRACTICE</div>
            <div style={{
              fontFamily: 'monospace', fontSize: 9, color: C.white, opacity: 0.5,
              marginTop: 4,
            }}>Practice against AI</div>
          </div>
        </button>

        <button onClick={onRanked} style={{
          padding: '20px 24px',
          background: '#080812',
          border: `2px solid ${C.p2}66`,
          borderRadius: 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 18,
          boxShadow: `0 0 16px ${C.p2}11`,
        }}>
          <RankedIcon />
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 14, fontWeight: 900,
              letterSpacing: 3, color: C.p2,
            }}>PLAY RANKED</div>
            <div style={{
              fontFamily: 'monospace', fontSize: 9, color: C.white, opacity: 0.5,
              marginTop: 4,
            }}>Compete for ELO</div>
          </div>
        </button>
      </div>
      <div style={{ flex: 3 }} />

      {/* Footer */}
      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{
          fontFamily: 'monospace', fontSize: 8,
          letterSpacing: 2, color: C.white, opacity: 0.5,
          display: 'flex', gap: 8,
        }}>
          <span
            onClick={onTerms}
            style={{ cursor: onTerms ? 'pointer' : 'default', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >TERMS OF SERVICE</span>
          <span>|</span>
          <span
            onClick={onPrivacy}
            style={{ cursor: onPrivacy ? 'pointer' : 'default', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >PRIVACY POLICY</span>
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: 8, letterSpacing: 3,
          color: C.white,
        }}>TETROW · v{APP_VERSION}</div>
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
