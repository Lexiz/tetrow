import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { PlayerStats } from '../../../shared/game/engine';

const W = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
const H = CONFIG.ROWS * CONFIG.CELL_SIZE + 80;

interface Props {
  p1Score: number;
  p2Score: number;
  p1ToppedOut: boolean;
  p2ToppedOut: boolean;
  p1Name?: string;
  p2Name?: string;
  stats: [PlayerStats, PlayerStats];
  p1EloChange?: number;
  p2EloChange?: number;
  onRematch: () => void;
  onClose: () => void;
  rematchWaiting?: boolean;
  firestoreError?: string | null;
}

export default function EndScreen({ p1Score, p2Score, p1ToppedOut, p2ToppedOut, p1Name, p2Name, stats, p1EloChange, p2EloChange, onRematch, onClose, rematchWaiting, firestoreError }: Props) {
  const penalty1 = p1ToppedOut ? CONFIG.TOPOUT_PENALTY : 0;
  const penalty2 = p2ToppedOut ? CONFIG.TOPOUT_PENALTY : 0;
  const finalP1 = p1Score;
  const finalP2 = p2Score;
  const winner: 1 | 2 | null = finalP1 > finalP2 ? 1 : finalP2 > finalP1 ? 2 : null;
  const winCol = winner === 1 ? C.p1 : winner === 2 ? C.p2 : C.text;

  const name1 = p1Name || 'Player 1';
  const name2 = p2Name || 'Player 2';
  const winnerName = winner === 1 ? name1 : winner === 2 ? name2 : null;

  const players = [
    { n: 1 as const, name: name1, final: finalP1, penalty: penalty1, topped: p1ToppedOut, win: winner === 1, col: C.p1, brt: C.p1b, stat: stats[0], eloChange: p1EloChange },
    { n: 2 as const, name: name2, final: finalP2, penalty: penalty2, topped: p2ToppedOut, win: winner === 2, col: C.p2, brt: C.p2b, stat: stats[1], eloChange: p2EloChange },
  ];

  const dimText: React.CSSProperties = { fontFamily: 'monospace', fontSize: 9, color: C.text, opacity: 0.5 };
  const valText: React.CSSProperties = { fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: C.text };

  return (
    <div style={{
      width: W, height: H,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.bg, gap: 18,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Winner glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '20%',
        width: 380, height: 380, borderRadius: '50%',
        background: `radial-gradient(circle, ${winCol}14 0%, transparent 65%)`,
        filter: 'blur(40px)',
      }} />

      <div style={{
        fontFamily: 'monospace', fontSize: 9, letterSpacing: 7, color: C.dim, zIndex: 1,
      }}>MATCH OVER</div>

      <div style={{
        fontFamily: "'Courier New', monospace", fontSize: 32, fontWeight: 900,
        letterSpacing: 3, color: winCol, zIndex: 1,
        textShadow: `0 0 20px ${winCol}, 0 0 40px ${winCol}88, 0 0 70px ${winCol}33`,
        maxWidth: W - 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {winnerName ? `${winnerName.toUpperCase()} WINS` : 'DRAW'}
      </div>

      {/* Score cards */}
      <div style={{ display: 'flex', gap: 16, zIndex: 1, maxWidth: W - 40 }}>
        {players.map(({ n, name, final, penalty, topped, win, col, brt, stat, eloChange }) => {
          const opCol = n === 1 ? C.p2 : C.p1;
          return (
            <div key={n} style={{
              background: win
                ? `linear-gradient(150deg, ${col}18 0%, ${C.panel} 55%)`
                : C.panel,
              border: `1.5px solid ${win ? col : '#1a1a2c'}`,
              borderRadius: 8, padding: '14px 18px',
              width: 170, maxWidth: 170, minWidth: 0,
              display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
              boxShadow: win
                ? `0 0 30px ${col}55, 0 0 60px ${col}22, inset 0 0 24px ${col}0c`
                : 'none',
              boxSizing: 'border-box',
            }}>
              <div style={{
                fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, color: col,
                textShadow: win ? `0 0 12px ${col}` : 'none',
                width: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', textAlign: 'center',
              }}>{name.toUpperCase()}</div>

              {/* Final score */}
              <div style={{
                fontFamily: "'Courier New', monospace", fontSize: 28, fontWeight: 900,
                color: C.white, textShadow: win ? `0 0 16px ${col}88` : 'none',
              }}>{final.toLocaleString()}</div>

              {eloChange != null && (
                <div style={{
                  fontFamily: 'monospace', fontSize: 12, fontWeight: 900,
                  color: eloChange >= 0 ? '#22cc44' : '#ff4466',
                  textShadow: eloChange >= 0 ? '0 0 8px #22cc4488' : '0 0 8px #ff446688',
                }}>{eloChange >= 0 ? '+' : ''}{eloChange} ELO</div>
              )}

              {win && (
                <div style={{
                  fontFamily: 'monospace', fontSize: 8, letterSpacing: 3,
                  color: brt, textShadow: `0 0 10px ${col}`,
                  marginBottom: 4,
                }}>★ WINNER</div>
              )}

              {/* Score breakdown */}
              <div style={{
                width: '100%', borderTop: `1px solid ${col}33`,
                paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 5,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={dimText}>Clear pts</span>
                  <span style={{ ...valText, color: col }}> +{stat.basePoints}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={dimText}>Bonus pts</span>
                  <span style={{ ...valText, color: opCol }}>+{stat.bonusPoints}</span>
                </div>
                {topped && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={dimText}>Top-out</span>
                    <span style={{ ...valText, color: '#ff4466' }}>−{penalty}</span>
                  </div>
                )}
              </div>

              {/* Line clears */}
              <div style={{
                width: '100%', borderTop: `1px solid ${col}33`,
                paddingTop: 8,
              }}>
                <div style={{ ...dimText, textAlign: 'center', marginBottom: 6, letterSpacing: 3 }}>LINES CLEARED</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, textAlign: 'center' }}>
                  {(['4', '3', '2', '1'] as const).map((label, i) => {
                    const count = stat.clears[3 - i];
                    return (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 8, color: C.text, opacity: 0.4 }}>{label}L</span>
                        <span style={{
                          fontFamily: 'monospace', fontSize: 16, fontWeight: 900,
                          color: count > 0 ? col : C.dim,
                          textShadow: count > 0 ? `0 0 8px ${col}88` : 'none',
                        }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Firestore error display */}
      {firestoreError && (
        <div style={{
          zIndex: 1, fontFamily: 'monospace', fontSize: 9,
          color: '#ff6b6b', textAlign: 'center', maxWidth: 400,
          padding: '8px 16px', background: '#ff6b6b11',
          border: '1px solid #ff6b6b44', borderRadius: 4,
        }}>{firestoreError}</div>
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 8, zIndex: 1 }}>
        <button onClick={onRematch} disabled={rematchWaiting} style={{
          padding: '12px 36px',
          background: 'transparent',
          border: `1.5px solid ${C.p2}`,
          borderRadius: 4,
          fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
          letterSpacing: 4, color: C.p2, cursor: rematchWaiting ? 'default' : 'pointer',
          boxShadow: `0 0 16px ${C.p2}55, 0 0 32px ${C.p2}22`,
          opacity: rematchWaiting ? 0.6 : 1,
        }}>{rematchWaiting ? 'WAITING...' : 'REMATCH'}</button>
        <button onClick={onClose} style={{
          padding: '12px 36px',
          background: 'transparent',
          border: `1.5px solid ${C.border}`,
          borderRadius: 4,
          fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
          letterSpacing: 4, color: C.text, opacity: 0.7, cursor: 'pointer',
        }}>CLOSE</button>
      </div>
    </div>
  );
}
