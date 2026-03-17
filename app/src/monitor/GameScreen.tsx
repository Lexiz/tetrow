import { useState, useEffect } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { TetrominoType, GameMode } from '../../../shared/types';
import type { PlayerStats } from '../../../shared/game/engine';
import { getShape } from '../../../shared/game/pieces';
import BoardComponent from '../common/Board';
import Panel from './Panel';
import Divider from './Divider';
import { useGameEngine } from '../hooks/useGameEngine';
import type { AiDifficulty } from '../../../shared/game/ai';
import { useLineClearEvents } from '../hooks/useLineClearEvents';
import ScorePopup from '../common/ScorePopup';
import LineClearEffect from '../common/LineClearEffect';
import GamePauseOverlay from '../common/GamePauseOverlay';

// Placeholder cells for hidden next-piece preview
const HIDDEN_NEXT: [number, number][] = [];

interface Props {
  onGameEnd: (p1Score: number, p2Score: number, toppedOut: [boolean, boolean], stats: [PlayerStats, PlayerStats]) => void;
  aiDifficulty?: AiDifficulty;
  gameMode?: GameMode;
  onQuit?: () => void;
}

export default function GameScreen({ onGameEnd, aiDifficulty, gameMode, onQuit }: Props) {
  const [showPause, setShowPause] = useState(false);
  const { state, displayBoard, p1BandIdx, p2BandIdx, showP1Next } = useGameEngine(
    aiDifficulty ? { aiPlayer: 2, aiDifficulty, gameMode } : { gameMode },
  );

  // Live timer for five-minute mode
  const [timeRemaining, setTimeRemaining] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (gameMode !== 'fivemin' || !state.gameStartTime || state.phase === 'ended') return;
    function tick() {
      const elapsed = Date.now() - state.gameStartTime!;
      const remaining = Math.max(0, 5 * 60 * 1000 - elapsed);
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gameMode, state.gameStartTime, state.phase]);

  // Compute dynamic cell size for hundred mode (board may grow)
  const boardRows = displayBoard.length;
  const baseBoardHeight = CONFIG.ROWS * CONFIG.CELL_SIZE;
  const cellSize = boardRows > CONFIG.ROWS
    ? Math.floor(baseBoardHeight / boardRows)
    : CONFIG.CELL_SIZE;

  // Notify parent when game ends
  if (state.phase === 'ended' && state.winner !== undefined) {
    // Use a ref to avoid calling during render — trigger via effect in parent
    // We pass raw scores (penalty already applied in engine)
    // Signal end by calling onGameEnd once
  }

  // Use effect-safe notification: call parent from render is fine here since
  // React will handle the state update in the parent on the next cycle
  const clearEvents = useLineClearEvents(state.lastClear, state.clearedRows);
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
          piecesRemaining={state.piecesRemaining?.[0]}
          timeRemaining={timeRemaining}
        />
        <Divider activePlayer={ended ? 1 : state.active} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: 5, color: C.dim }}>
            TETROW
          </div>
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
            {clearEvents.map(evt => (
              <LineClearEffect
                key={`clear-${evt.id}`}
                rows={evt.rows}
                player={evt.player}
              />
            ))}
            {/* Equalizer warning */}
            {state.phase === 'equalizer' && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(5,5,8,0.7)',
                zIndex: 6,
                animation: 'fadeOut 2s forwards',
              }}>
                <div style={{
                  fontFamily: 'monospace', fontSize: 9, letterSpacing: 5,
                  color: '#ff4466', marginBottom: 8,
                  textShadow: '0 0 12px #ff446688',
                }}>CEILING REACHED</div>
                <div style={{
                  fontFamily: "'Courier New', monospace", fontSize: 18, fontWeight: 900,
                  letterSpacing: 3, color: C.white,
                  textShadow: '0 0 16px rgba(255,255,255,0.5)',
                }}>LAST TURN</div>
                <style>{`
                  @keyframes fadeOut {
                    0%, 70% { opacity: 1; }
                    100% { opacity: 0; pointer-events: none; }
                  }
                `}</style>
              </div>
            )}
            {/* Pause overlay */}
            {showPause && !ended && onQuit && (
              <GamePauseOverlay
                playerName={state.active === 1 ? 'PLAYER 1' : 'PLAYER 2'}
                playerNum={state.active}
                score={state.scores[state.active - 1]}
                speedBand={CONFIG.SPEED_BANDS[state.active === 1 ? p1BandIdx : p2BandIdx]?.label ?? 'S0'}
                onBack={() => setShowPause(false)}
                onQuit={onQuit}
              />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: 2 }}>
            <span
              onClick={onQuit ? () => setShowPause(true) : undefined}
              style={{
                fontFamily: 'monospace', fontSize: 10, color: C.p1, textShadow: `0 0 10px ${C.p1}`,
                cursor: onQuit ? 'pointer' : 'default',
              }}
            >
              ■ PLAYER 1
            </span>
            <span
              onClick={onQuit ? () => setShowPause(true) : undefined}
              style={{
                fontFamily: 'monospace', fontSize: 10, color: C.p2, textShadow: `0 0 10px ${C.p2}`,
                cursor: onQuit ? 'pointer' : 'default',
              }}
            >
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
          piecesRemaining={state.piecesRemaining?.[1]}
          timeRemaining={timeRemaining}
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
              onClick={() => onGameEnd(state.scores[0], state.scores[1], state.toppedOut, state.stats)}
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
