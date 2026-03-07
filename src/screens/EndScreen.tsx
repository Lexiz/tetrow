import { C } from '../theme';
import { CONFIG } from '../config';

const W = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
const H = CONFIG.ROWS * CONFIG.CELL_SIZE + 80;

interface Props {
  p1Score: number;
  p2Score: number;
  p1ToppedOut: boolean;
  p2ToppedOut: boolean;
  onPlayAgain: () => void;
}

export default function EndScreen({ p1Score, p2Score, p1ToppedOut, p2ToppedOut, onPlayAgain }: Props) {
  const finalP1 = p1Score - (p1ToppedOut ? CONFIG.TOPOUT_PENALTY : 0);
  const finalP2 = p2Score - (p2ToppedOut ? CONFIG.TOPOUT_PENALTY : 0);
  const winner: 1 | 2 | null = finalP1 > finalP2 ? 1 : finalP2 > finalP1 ? 2 : null;
  const winCol = winner === 1 ? C.p1 : winner === 2 ? C.p2 : C.text;

  const players = [
    { n: 1 as const, final: finalP1, topped: p1ToppedOut, win: winner === 1, col: C.p1, brt: C.p1b },
    { n: 2 as const, final: finalP2, topped: p2ToppedOut, win: winner === 2, col: C.p2, brt: C.p2b },
  ];

  return (
    <div style={{
      width: W, height: H,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.bg, gap: 22,
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
        {players.map(({ n, final, topped, win, col, brt }) => (
          <div key={n} style={{
            background: win
              ? `linear-gradient(150deg, ${col}18 0%, ${C.panel} 55%)`
              : C.panel,
            border: `1.5px solid ${win ? col : '#1a1a2c'}`,
            borderRadius: 8, padding: 22, minWidth: 150,
            display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
            boxShadow: win
              ? `0 0 30px ${col}55, 0 0 60px ${col}22, inset 0 0 24px ${col}0c`
              : 'none',
          }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, color: col,
              textShadow: win ? `0 0 12px ${col}` : 'none',
            }}>PLAYER {n}</div>
            <div style={{
              fontFamily: "'Courier New', monospace", fontSize: 30, fontWeight: 900,
              color: C.white, textShadow: win ? `0 0 16px ${col}88` : 'none',
            }}>{final.toLocaleString()}</div>
            {topped && (
              <div style={{
                fontFamily: 'monospace', fontSize: 10, color: C.p2,
                textShadow: `0 0 8px ${C.p2}`,
              }}>TOP-OUT −{CONFIG.TOPOUT_PENALTY}</div>
            )}
            {win && (
              <div style={{
                fontFamily: 'monospace', fontSize: 8, letterSpacing: 3,
                color: brt, textShadow: `0 0 10px ${col}`,
              }}>★ WINNER</div>
            )}
          </div>
        ))}
      </div>

      <button onClick={onPlayAgain} style={{
        marginTop: 8, zIndex: 1,
        padding: '12px 44px',
        background: 'transparent',
        border: `1.5px solid ${C.p1}`,
        borderRadius: 4,
        fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
        letterSpacing: 4, color: C.p1, cursor: 'pointer',
        boxShadow: `0 0 16px ${C.p1}55, 0 0 32px ${C.p1}22`,
      }}>PLAY AGAIN</button>
    </div>
  );
}
