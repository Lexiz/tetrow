import { C } from '../theme';
import { CONFIG } from '../config';
import type { TetrominoType } from '../types';
import { getShape } from '../game/pieces';
import BoardComponent from './Board';
import Panel from './Panel';
import Divider from './Divider';
import { useGameEngine } from '../hooks/useGameEngine';
import ScorePopup from './ScorePopup';

// Placeholder cells for hidden next-piece preview
const HIDDEN_NEXT: [number, number][] = [];

interface Props {
  onGameEnd: (p1Score: number, p2Score: number, toppedOut: 1 | 2 | null) => void;
}

export default function GameScreen({ onGameEnd }: Props) {
  const { state, displayBoard, p1BandIdx, p2BandIdx, showP1Next } = useGameEngine();

  // Notify parent when game ends
  if (state.phase === 'ended' && state.winner !== undefined) {
    // Use a ref to avoid calling during render — trigger via effect in parent
    // We pass raw scores (penalty already applied in engine)
    // Signal end by calling onGameEnd once
  }

  // Use effect-safe notification: call parent from render is fine here since
  // React will handle the state update in the parent on the next cycle
  const ended = state.phase === 'ended';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: 24, background: C.bg, gap: 0 }}>
        <Panel
          player={1}
          score={state.scores[0]}
          bandIndex={p1BandIdx}
          nextPiece={showP1Next ? nextCells(state.p1Next) : HIDDEN_NEXT}
          active={state.active === 1 && !ended}
        />
        <Divider activePlayer={ended ? 1 : state.active} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: 5, color: C.dim }}>
            CHESS-TET
          </div>
          <div style={{ position: 'relative' }}>
            <BoardComponent board={displayBoard} />
            {state.lastClear && (
              <ScorePopup
                key={state.lastClear.id}
                base={state.lastClear.base}
                bonus={state.lastClear.bonus}
                player={state.lastClear.player}
              />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: 2 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: C.p1, textShadow: `0 0 10px ${C.p1}` }}>
              ■ PLAYER 1
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: C.p2, textShadow: `0 0 10px ${C.p2}` }}>
              ■ PLAYER 2
            </span>
          </div>
        </div>

        <Divider activePlayer={ended ? 1 : state.active} />
        <Panel
          player={2}
          score={state.scores[1]}
          bandIndex={p2BandIdx}
          nextPiece={nextCells(state.p2Next)}
          active={state.active === 2 && !ended}
        />
      </div>

      {/* End-game overlay */}
      {ended && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,5,8,0.75)',
          zIndex: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 9, letterSpacing: 7,
              color: C.dim, marginBottom: 12,
            }}>MATCH OVER</div>
            <button
              onClick={() => onGameEnd(state.scores[0], state.scores[1], state.toppedOut)}
              style={{
                padding: '12px 40px',
                background: `linear-gradient(135deg, ${C.p1}, ${C.p2})`,
                border: 'none', borderRadius: 4,
                fontFamily: 'monospace', fontSize: 12, fontWeight: 900,
                letterSpacing: 4, color: '#050508', cursor: 'pointer',
              }}
            >SEE RESULTS</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Convert a TetrominoType to MiniPiece cell coords using rotation 0
function nextCells(type: TetrominoType): [number, number][] {
  const cells = getShape(type, 0);
  // Center the piece in the 4×4 preview grid
  const minC = Math.min(...cells.map(([c]) => c));
  const minR = Math.min(...cells.map(([, r]) => r));
  return cells.map(([c, r]) => [c - minC, r - minR]);
}

export const GAME_SCREEN_WIDTH = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
