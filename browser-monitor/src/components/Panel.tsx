import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import SpeedBar from './SpeedBar';
import MiniPiece from './MiniPiece';

interface Props {
  player: 1 | 2;
  score: number;
  bandIndex: number;
  nextPiece: [number, number][];
  active: boolean;
}

export default function Panel({ player, score, bandIndex, nextPiece, active }: Props) {
  const col = player === 1 ? C.p1 : C.p2;
  const brt = player === 1 ? C.p1b : C.p2b;
  const band = CONFIG.SPEED_BANDS[bandIndex] ?? CONFIG.SPEED_BANDS[0];

  return (
    <div style={{
      width: 152,
      background: active
        ? `linear-gradient(150deg, ${col}14 0%, ${C.panel} 50%)`
        : C.panel,
      border: `1.5px solid ${active ? col + 'aa' : '#1a1a2c'}`,
      borderRadius: 8,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      boxShadow: active ? `
        0 0 24px ${col}44,
        0 0 48px ${col}22,
        0 0  8px ${col}66,
        inset 0 0 30px ${col}0a
      ` : 'none',
      transition: 'all 0.4s ease',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: col,
          boxShadow: active
            ? `0 0 10px ${col}, 0 0 20px ${col}aa, 0 0 30px ${col}55`
            : `0 0 4px ${col}66`,
          transition: 'box-shadow 0.4s',
        }} />
        <span style={{
          color: active ? brt : C.dim,
          fontFamily: "'Courier New', monospace",
          fontSize: 12, fontWeight: 700, letterSpacing: 2,
          textShadow: active ? `0 0 12px ${col}` : 'none',
          transition: 'all 0.4s',
        }}>P{player}</span>
        {active && (
          <span style={{
            marginLeft: 'auto', color: brt,
            fontFamily: 'monospace', fontSize: 8, letterSpacing: 2,
            textShadow: `0 0 10px ${col}`,
          }}>TURN</span>
        )}
      </div>

      {/* Score */}
      <div>
        <div style={{
          color: C.dim, fontFamily: 'monospace',
          fontSize: 8, letterSpacing: 3, marginBottom: 5,
        }}>SCORE</div>
        <div style={{
          color: C.white,
          fontFamily: "'Courier New', monospace",
          fontSize: 24, fontWeight: 900, letterSpacing: -1,
          textShadow: active
            ? `0 0 18px ${col}99, 0 0 32px ${col}44`
            : `0 0 6px ${col}33`,
          transition: 'text-shadow 0.4s',
        }}>{score.toLocaleString()}</div>
      </div>

      {/* Speed */}
      <div>
        <div style={{
          color: C.dim, fontFamily: 'monospace',
          fontSize: 8, letterSpacing: 3, marginBottom: 8,
        }}>SPEED</div>
        <SpeedBar band={bandIndex} player={player} />
        <div style={{
          color: col, fontFamily: 'monospace', fontSize: 10, marginTop: 5,
          textShadow: `0 0 10px ${col}88`,
        }}>{band.label} · {band.gravity}ms/cell</div>
      </div>

      {/* Next piece */}
      <div>
        <div style={{
          color: C.dim, fontFamily: 'monospace',
          fontSize: 8, letterSpacing: 3, marginBottom: 8,
        }}>NEXT</div>
        <MiniPiece cells={nextPiece} player={player} />
      </div>
    </div>
  );
}
