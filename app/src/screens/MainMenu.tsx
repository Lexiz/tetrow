import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { User } from 'firebase/auth';

const W = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
const H = CONFIG.ROWS * CONFIG.CELL_SIZE + 80;

export type AiDifficulty = 'easy' | 'medium' | 'hard';

interface Props {
  user: User;
  elo: number;
  onWarmUp: (difficulty: AiDifficulty) => void;
  onRanked: () => void;
  onSignOut: () => void;
  isMobile?: boolean;
}

export default function MainMenu({ user, elo, onWarmUp, onRanked, onSignOut, isMobile }: Props) {
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
      background: C.bg, gap: 24,
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

      {/* Profile bar */}
      <div style={{
        zIndex: 1, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {photoURL && (
          <img src={photoURL} alt="" style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `1.5px solid ${C.border}`,
          }} referrerPolicy="no-referrer" />
        )}
        <div>
          <div style={{
            fontFamily: 'monospace', fontSize: 12, color: C.white, fontWeight: 700,
          }}>{displayName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 9, color: rankCol,
              letterSpacing: 2, fontWeight: 900,
            }}>{rank}</span>
            <span style={{
              fontFamily: 'monospace', fontSize: 10, color: C.text, opacity: 0.6,
            }}>{elo}</span>
          </div>
        </div>
        <button onClick={onSignOut} style={{
          marginLeft: 12, background: 'none', border: `1px solid ${C.border}`,
          borderRadius: 3, padding: '3px 8px', cursor: 'pointer',
          fontFamily: 'monospace', fontSize: 8, color: C.dim, letterSpacing: 1,
        }}>SIGN OUT</button>
      </div>

      {/* Title */}
      <div style={{
        zIndex: 1,
        fontFamily: "'Courier New', monospace",
        fontSize: isMobile ? 36 : 48, fontWeight: 900, letterSpacing: -2,
        background: `linear-gradient(130deg, ${C.p1} 0%, ${C.p1b} 40%, ${C.p2b} 70%, ${C.p2} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: `drop-shadow(0 0 20px ${C.p1}44) drop-shadow(0 0 40px ${C.p2}22)`,
        lineHeight: 1,
      }}>CHESTET</div>

      {/* Mode cards */}
      <div style={{
        zIndex: 1, display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 16, width: isMobile ? '100%' : 'auto',
        maxWidth: 500, padding: '0 16px', boxSizing: 'border-box',
      }}>
        {/* WARM UP card */}
        <div style={{
          flex: 1, background: '#080812',
          border: `1.5px solid ${C.p1}44`,
          borderRadius: 8, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{
            fontFamily: 'monospace', fontSize: 11, fontWeight: 900,
            letterSpacing: 3, color: C.p1,
          }}>WARM UP</div>
          <div style={{
            fontFamily: 'monospace', fontSize: 9, color: C.text, opacity: 0.6,
            lineHeight: 1.5,
          }}>Play against AI to practice your skills</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['easy', 'medium', 'hard'] as AiDifficulty[]).map((d) => (
              <button key={d} onClick={() => onWarmUp(d)} style={{
                flex: 1, padding: '10px 0',
                background: C.bg,
                border: `1.5px solid ${C.p1}55`,
                borderRadius: 4, cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 9, fontWeight: 700,
                letterSpacing: 1, color: C.white,
                textTransform: 'uppercase',
                boxShadow: `0 0 6px ${C.p1}22`,
              }}>{d}</button>
            ))}
          </div>
        </div>

        {/* RANKED card */}
        <div style={{
          flex: 1, background: '#080812',
          border: `1.5px solid ${C.p2}44`,
          borderRadius: 8, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{
            fontFamily: 'monospace', fontSize: 11, fontWeight: 900,
            letterSpacing: 3, color: C.p2,
          }}>RANKED</div>
          <div style={{
            fontFamily: 'monospace', fontSize: 9, color: C.text, opacity: 0.6,
            lineHeight: 1.5,
          }}>Compete for ELO rating on the leaderboard</div>
          <button onClick={onRanked} style={{
            padding: '10px 0',
            background: C.bg,
            border: `2px solid ${C.p2}55`,
            borderRadius: 4, cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 11, fontWeight: 900,
            letterSpacing: 3, color: C.white,
            boxShadow: `0 0 8px ${C.p2}33`,
          }}>FIND MATCH</button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        zIndex: 1, fontFamily: 'monospace', fontSize: 8,
        letterSpacing: 3, color: C.dim,
      }}>
        CHESTET · v0.2
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
