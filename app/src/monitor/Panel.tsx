import { C } from '../../../shared/theme';
import MiniPiece from '../common/MiniPiece';

interface Props {
  player: 1 | 2;
  score: number;
  bandIndex: number;
  nextPiece: [number, number][];
  active: boolean;
  piecesRemaining?: number;
  timeRemaining?: string;
}

export default function Panel({ player, score, bandIndex, nextPiece, active, piecesRemaining, timeRemaining }: Props) {
  const col = player === 1 ? C.p1 : C.p2;
  const brt = player === 1 ? C.p1b : C.p2b;

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
        <div style={{
          color: col,
          fontFamily: "'Courier New', monospace",
          fontSize: 24, fontWeight: 900, letterSpacing: -1,
          textShadow: active
            ? `0 0 18px ${col}99, 0 0 32px ${col}44`
            : `0 0 6px ${col}33`,
          transition: 'text-shadow 0.4s',
        }}>{bandIndex + 1}/7</div>
      </div>

      {/* Pieces remaining (hundred mode) */}
      {piecesRemaining !== undefined && (
        <div>
          <div style={{
            color: C.dim, fontFamily: 'monospace',
            fontSize: 8, letterSpacing: 3, marginBottom: 5,
          }}>LEFT</div>
          <div style={{
            color: piecesRemaining <= 10 ? '#ff4466' : C.white,
            fontFamily: "'Courier New', monospace",
            fontSize: 20, fontWeight: 900,
            textShadow: piecesRemaining <= 10 ? '0 0 12px #ff446688' : 'none',
          }}>{piecesRemaining}</div>
        </div>
      )}

      {/* Timer (five-minute mode) */}
      {timeRemaining !== undefined && (
        <div>
          <div style={{
            color: C.dim, fontFamily: 'monospace',
            fontSize: 8, letterSpacing: 3, marginBottom: 5,
          }}>TIME</div>
          <div style={{
            color: C.white,
            fontFamily: "'Courier New', monospace",
            fontSize: 18, fontWeight: 900,
          }}>{timeRemaining}</div>
        </div>
      )}

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
