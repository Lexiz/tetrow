import { useState, useEffect, useRef } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { TetrominoType, Owner, GameMode } from '../../../shared/types';
import type { PlayerStats } from '../../../shared/game/engine';
import { getShape } from '../../../shared/game/pieces';
import BoardComponent from '../common/Board';
import ScorePopup from '../common/ScorePopup';
import LineClearEffect from '../common/LineClearEffect';
import GamePauseOverlay from '../common/GamePauseOverlay';
import MiniPiece from '../common/MiniPiece';
import { useGameEngine } from '../hooks/useGameEngine';
import { useTouchInput } from '../hooks/useTouchInput';
import type { AiDifficulty } from '../../../shared/game/ai';
import { useLineClearEvents } from '../hooks/useLineClearEvents';

const HIDDEN_NEXT: [number, number][] = [];
const BAR_HEIGHT = 64;

interface Props {
  onGameEnd: (p1Score: number, p2Score: number, toppedOut: [boolean, boolean], stats: [PlayerStats, PlayerStats]) => void;
  aiDifficulty?: AiDifficulty;
  gameMode?: GameMode;
  onQuit?: () => void;
}

function getVisibleHeight(): number {
  if (window.visualViewport) return window.visualViewport.height;
  return window.innerHeight;
}

function calcCellSize(): number {
  const availH = getVisibleHeight() - BAR_HEIGHT - 8;
  const fromW = Math.floor((window.innerWidth - 12) / CONFIG.COLS);
  const fromH = Math.floor(availH / CONFIG.ROWS);
  return Math.min(fromW, fromH, 36);
}

function useMobileCellSize(): number {
  const [size, setSize] = useState(calcCellSize);

  useEffect(() => {
    function handleResize() { setSize(calcCellSize()); }
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}

export default function MobileGameScreen({ onGameEnd, aiDifficulty, gameMode, onQuit }: Props) {
  const { state, displayBoard, p1BandIdx, p2BandIdx, showP1Next, handleAction } = useGameEngine(
    aiDifficulty ? { aiPlayer: 2, aiDifficulty, gameMode } : { gameMode },
  );
  const cellSize = useMobileCellSize();
  const boardRef = useRef<HTMLDivElement>(null);
  const [showPause, setShowPause] = useState(false);
  useTouchInput(state.active, handleAction, boardRef, aiDifficulty ? (1 as Owner) : undefined);
  const clearEvents = useLineClearEvents(state.lastClear, state.clearedRows);
  const ended = state.phase === 'ended';
  const p1Active = state.active === 1 && !ended;
  const p2Active = state.active === 2 && !ended;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100dvh',
      width: '100%',
      boxSizing: 'border-box',
      justifyContent: 'space-between',
      padding: '0',
      background: '#030306',
      overflow: 'hidden',
    }}>
      {/* Board area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}>
        <div style={{ position: 'relative' }}>
          <div ref={boardRef} style={{ position: 'relative', touchAction: 'none' }}>
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
                cellSize={cellSize}
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
        </div>
      </div>

      {/* Bottom bar — P1 left, pause center, P2 right */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        gap: 10,
        padding: '6px 10px',
        boxSizing: 'border-box',
      }}>
        {/* P1 */}
        <PlayerHalf
          player={1}
          score={state.scores[0]}
          bandIndex={p1BandIdx}
          active={p1Active}
          nextPiece={showP1Next ? nextCells(state.p1Next) : HIDDEN_NEXT}
        />

        {/* Pause button */}
        <button
          onClick={onQuit && !ended ? () => setShowPause(true) : undefined}
          style={{
            background: C.panel, border: `1.5px solid ${C.border}`,
            borderRadius: 6, padding: '10px 12px', cursor: onQuit ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: 'monospace', fontSize: 16, color: C.white, lineHeight: 1 }}>⏸</span>
        </button>

        {/* P2 */}
        <PlayerHalf
          player={2}
          score={state.scores[1]}
          bandIndex={p2BandIdx}
          active={p2Active}
          nextPiece={nextCells(state.p2Next)}
        />
      </div>

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

// ── Player half of the bottom bar ────────────────────────────────────────────

interface PlayerHalfProps {
  player: 1 | 2;
  score: number;
  bandIndex: number;
  active: boolean;
  nextPiece: [number, number][];
}

function PlayerHalf({ player, score, bandIndex, active, nextPiece }: PlayerHalfProps) {
  const col = player === 1 ? C.p1 : C.p2;

  const scoreSpeedItem = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <span style={{
        fontFamily: 'monospace', fontSize: 5, letterSpacing: 1,
        color: C.white, opacity: 0.5,
      }}>SCORE</span>
      <span style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 13, fontWeight: 900, color: C.white,
        textShadow: active ? `0 0 8px ${col}55` : 'none',
      }}>{score.toLocaleString()}</span>
      <span style={{
        fontFamily: 'monospace', fontSize: 5, letterSpacing: 1,
        color: C.white, opacity: 0.5, marginTop: 1,
      }}>SPEED</span>
      <span style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 11, fontWeight: 900, color: col,
        textShadow: `0 0 6px ${col}66`,
      }}>{bandIndex + 1}/7</span>
    </div>
  );

  const nextItem = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{
        fontFamily: 'monospace', fontSize: 5, letterSpacing: 1,
        color: C.white, opacity: 0.5,
      }}>NEXT</span>
      <div style={{ marginTop: 1, transform: 'scale(0.7)', transformOrigin: 'top center' }}>
        <MiniPiece cells={nextPiece} player={player} />
      </div>
    </div>
  );

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: player === 1 ? 'flex-end' : 'flex-start',
      gap: 8,
      padding: '4px 6px',
      background: active ? `${col}0c` : C.panel,
      border: `1.5px solid ${active ? col + '88' : C.border}`,
      borderRadius: 6,
      boxShadow: active ? `0 0 12px ${col}22, inset 0 0 12px ${col}10` : 'none',
      transition: 'all 0.3s',
    }}>
      {player === 1
        ? <>{scoreSpeedItem}{nextItem}</>
        : <>{nextItem}{scoreSpeedItem}</>
      }
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function nextCells(type: TetrominoType): [number, number][] {
  const cells = getShape(type, 0);
  const minC = Math.min(...cells.map(([c]) => c));
  const minR = Math.min(...cells.map(([, r]) => r));
  return cells.map(([c, r]) => [c - minC, r - minR]);
}
