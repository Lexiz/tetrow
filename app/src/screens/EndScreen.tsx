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
  stats: [PlayerStats, PlayerStats];
  onPlayAgain: () => void;
  onHome: () => void;
}

export default function EndScreen({ p1Score, p2Score, p1ToppedOut, p2ToppedOut, stats, onPlayAgain, onHome }: Props) {
  const penalty1 = p1ToppedOut ? CONFIG.TOPOUT_PENALTY : 0;
  const penalty2 = p2ToppedOut ? CONFIG.TOPOUT_PENALTY : 0;
  const finalP1 = p1Score;
  const finalP2 = p2Score;
  const winner: 1 | 2 | null = finalP1 > finalP2 ? 1 : finalP2 > finalP1 ? 2 : null;
  const winCol = winner === 1 ? C.p1 : winner === 2 ? C.p2 : C.text;

  const players = [
    { n: 1 as const, final: finalP1, penalty: penalty1, topped: p1ToppedOut, win: winner === 1, col: C.p1, brt: C.p1b, stat: stats[0] },
    { n: 2 as const, final: finalP2, penalty: penalty2, topped: p2ToppedOut, win: winner === 2, col: C.p2, brt: C.p2b, stat: stats[1] },
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
      }}>
        {winner ? `PLAYER ${winner} WINS` : 'DRAW'}
      </div>

      {/* Score cards */}
      <div style={{ display: 'flex', gap: 24, zIndex: 1 }}>
        {players.map(({ n, final, penalty, topped, win, col, brt, stat }) => {
          const opCol = n === 1 ? C.p2 : C.p1;
          return (
            <div key={n} style={{
              background: win
                ? `linear-gradient(150deg, ${col}18 0%, ${C.panel} 55%)`
                : C.panel,
              border: `1.5px solid ${win ? col : '#1a1a2c'}`,
              borderRadius: 8, padding: '18px 24px', minWidth: 180,
              display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
              boxShadow: win
                ? `0 0 30px ${col}55, 0 0 60px ${col}22, inset 0 0 24px ${col}0c`
                : 'none',
            }}>
              <div style={{
                fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, color: col,
                textShadow: win ? `0 0 12px ${col}` : 'none',
              }}>PLAYER {n}</div>

              {/* Final score */}
              <div style={{
                fontFamily: "'Courier New', monospace", fontSize: 30, fontWeight: 900,
                color: C.white, textShadow: win ? `0 0 16px ${col}88` : 'none',
              }}>{final.toLocaleString()}</div>

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
                    const count = stat.clears[3 - i]; // [singles, doubles, triples, quads] → show quads first
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

      <div style={{ display: 'flex', gap: 16, marginTop: 8, zIndex: 1 }}>
        <button onClick={onPlayAgain} style={{
          padding: '12px 36px',
          background: 'transparent',
          border: `1.5px solid ${C.p1}`,
          borderRadius: 4,
          fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
          letterSpacing: 4, color: C.p1, cursor: 'pointer',
          boxShadow: `0 0 16px ${C.p1}55, 0 0 32px ${C.p1}22`,
        }}>PLAY AGAIN</button>
        <button onClick={onHome} style={{
          padding: '12px 36px',
          background: 'transparent',
          border: `1.5px solid ${C.border}`,
          borderRadius: 4,
          fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
          letterSpacing: 4, color: C.text, opacity: 0.7, cursor: 'pointer',
        }}>HOME</button>
      </div>
    </div>
  );
}
