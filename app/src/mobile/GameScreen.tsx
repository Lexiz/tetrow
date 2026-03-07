import { useState, useEffect } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { TetrominoType } from '../../../shared/types';
import type { PlayerStats } from '../../../shared/game/engine';
import { getShape } from '../../../shared/game/pieces';
import BoardComponent from '../common/Board';
import ScorePopup from '../common/ScorePopup';
import LineClearEffect from '../common/LineClearEffect';
import PlayerBar from './PlayerBar';
import { useGameEngine } from '../hooks/useGameEngine';

const HIDDEN_NEXT: [number, number][] = [];

interface Props {
  onGameEnd: (p1Score: number, p2Score: number, toppedOut: 1 | 2 | null, stats: [PlayerStats, PlayerStats]) => void;
}

function useMobileCellSize(): number {
  const [size, setSize] = useState(() => Math.floor((window.innerWidth - 20) / CONFIG.COLS));

  useEffect(() => {
    function handleResize() {
      setSize(Math.floor((window.innerWidth - 20) / CONFIG.COLS));
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return Math.min(size, 36); // cap at 36px for larger phones
}

export default function MobileGameScreen({ onGameEnd }: Props) {
  const { state, displayBoard, p1BandIdx, p2BandIdx, showP1Next } = useGameEngine();
  const cellSize = useMobileCellSize();
  const ended = state.phase === 'ended';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      padding: '8px 8px',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {/* P1 bar — top */}
      <PlayerBar
        player={1}
        score={state.scores[0]}
        bandIndex={p1BandIdx}
        nextPiece={showP1Next ? nextCells(state.p1Next) : HIDDEN_NEXT}
        active={state.active === 1 && !ended}
      />

      {/* Board */}
      <div style={{ position: 'relative' }}>
        <BoardComponent board={displayBoard} cellSize={cellSize} />
        {state.lastClear && (
          <ScorePopup
            key={state.lastClear.id}
            base={state.lastClear.base}
            bonus={state.lastClear.bonus}
            player={state.lastClear.player}
          />
        )}
        {state.lastClear && state.clearedRows.length > 0 && (
          <LineClearEffect
            key={`clear-${state.lastClear.id}`}
            rows={state.clearedRows}
            player={state.lastClear.player}
          />
        )}
      </div>

      {/* P2 bar — bottom */}
      <PlayerBar
        player={2}
        score={state.scores[1]}
        bandIndex={p2BandIdx}
        nextPiece={nextCells(state.p2Next)}
        active={state.active === 2 && !ended}
      />

      {/* End-game overlay */}
      {ended && (
        <div style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,5,8,0.85)',
          zIndex: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 9, letterSpacing: 7,
              color: C.dim, marginBottom: 12,
            }}>MATCH OVER</div>
            <button
              onClick={() => onGameEnd(state.scores[0], state.scores[1], state.toppedOut, state.stats)}
              style={{
                padding: '14px 48px',
                background: C.bg,
                border: '2px solid rgba(255,200,140,0.45)',
                borderRadius: 5,
                fontFamily: 'monospace', fontSize: 13, fontWeight: 900,
                letterSpacing: 4, color: C.white, cursor: 'pointer',
                boxShadow: '0 0 7px rgba(255,180,100,0.4), 0 0 12px rgba(255,150,60,0.15)',
              }}
            >SEE RESULTS</button>
          </div>
        </div>
      )}
    </div>
  );
}

function nextCells(type: TetrominoType): [number, number][] {
  const cells = getShape(type, 0);
  const minC = Math.min(...cells.map(([c]) => c));
  const minR = Math.min(...cells.map(([, r]) => r));
  return cells.map(([c, r]) => [c - minC, r - minR]);
}
