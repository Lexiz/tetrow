import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import MiniPiece from '../common/MiniPiece';
import SpeedBar from '../common/SpeedBar';

interface Props {
  player: 1 | 2;
  score: number;
  bandIndex: number;
  nextPiece: [number, number][];
  active: boolean;
}

export default function PlayerBar({ player, score, bandIndex, nextPiece, active }: Props) {
  const col = player === 1 ? C.p1 : C.p2;
  const brt = player === 1 ? C.p1b : C.p2b;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 12px',
      background: active ? `${col}0c` : C.panel,
      border: `1.5px solid ${active ? col : '#1a1a2c'}`,
      borderRadius: 6,
      boxShadow: active ? `0 0 12px ${col}44, inset 0 0 12px ${col}0a` : 'none',
      transition: 'all 0.3s',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Player label + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: col,
          boxShadow: active ? `0 0 8px ${col}` : 'none',
        }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 8, letterSpacing: 2,
            color: col, opacity: active ? 1 : 0.6,
          }}>P{player}</span>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 18, fontWeight: 900, color: C.white,
            textShadow: active ? `0 0 10px ${col}66` : 'none',
          }}>{score.toLocaleString()}</span>
        </div>
      </div>

      {/* Speed bar */}
      <SpeedBar band={bandIndex} player={player} />

      {/* Next piece */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 7, color: C.dim, letterSpacing: 1 }}>NEXT</span>
        <MiniPiece cells={nextPiece} player={player} />
      </div>
    </div>
  );
}
