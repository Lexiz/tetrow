import { useState, useEffect, useRef } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { TetrominoType } from '../../../shared/types';
import type { PlayerStats } from '../../../shared/game/engine';
import { getShape } from '../../../shared/game/pieces';
import BoardComponent from '../common/Board';
import ScorePopup from '../common/ScorePopup';
import LineClearEffect from '../common/LineClearEffect';
import GamePauseOverlay from '../common/GamePauseOverlay';
import MiniPiece from '../common/MiniPiece';
import SpeedBar from '../common/SpeedBar';
import { useGameEngine } from '../hooks/useGameEngine';
import { useTouchInput } from '../hooks/useTouchInput';
import type { AiDifficulty } from '../../../shared/game/ai';

const HIDDEN_NEXT: [number, number][] = [];
const BAR_HEIGHT = 64;

interface Props {
  onGameEnd: (p1Score: number, p2Score: number, toppedOut: [boolean, boolean], stats: [PlayerStats, PlayerStats]) => void;
  aiDifficulty?: AiDifficulty;
  onQuit?: () => void;
}

function getVisibleHeight(): number {
  // On iOS Safari, window.innerHeight includes area behind toolbars.
  // visualViewport gives the actual visible area.
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
    // visualViewport fires its own resize event on iOS when toolbar shows/hides
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}

export default function MobileGameScreen({ onGameEnd, aiDifficulty, onQuit }: Props) {
  const { state, displayBoard, p1BandIdx, p2BandIdx, showP1Next, handleAction } = useGameEngine(
    aiDifficulty ? { aiPlayer: 2, aiDifficulty } : undefined,
  );
  const cellSize = useMobileCellSize();
  const boardRef = useRef<HTMLDivElement>(null);
  const [showPause, setShowPause] = useState(false);
  useTouchInput(state.active, handleAction, boardRef);
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
      {/* Board area — takes remaining space, centered */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
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
          {state.lastClear && state.clearedRows.length > 0 && (
            <LineClearEffect
              key={`clear-${state.lastClear.id}`}
              rows={state.clearedRows}
              player={state.lastClear.player}
              cellSize={cellSize}
            />
          )}
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

      {/* Bottom bar — P1 left, P2 right */}
      <div style={{
        width: '100%',
        height: BAR_HEIGHT,
        display: 'flex',
        background: C.panel,
        borderTop: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        {/* P1 — left half */}
        <PlayerHalf
          player={1}
          score={state.scores[0]}
          bandIndex={p1BandIdx}
          nextPiece={showP1Next ? nextCells(state.p1Next) : HIDDEN_NEXT}
          active={p1Active}
          onClick={onQuit ? () => setShowPause(true) : undefined}
        />

        {/* Divider */}
        <div style={{
          width: 1,
          background: C.border,
          alignSelf: 'stretch',
        }} />

        {/* P2 — right half */}
        <PlayerHalf
          player={2}
          score={state.scores[1]}
          bandIndex={p2BandIdx}
          nextPiece={nextCells(state.p2Next)}
          active={p2Active}
          onClick={onQuit ? () => setShowPause(true) : undefined}
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
  nextPiece: [number, number][];
  active: boolean;
  onClick?: () => void;
}

function PlayerHalf({ player, score, bandIndex, nextPiece, active, onClick }: PlayerHalfProps) {
  const col = player === 1 ? C.p1 : C.p2;

  return (
    <div onClick={onClick} style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 10px',
      background: active ? `${col}0c` : 'transparent',
      boxShadow: active ? `inset 0 0 16px ${col}15` : 'none',
      transition: 'all 0.3s',
      cursor: onClick ? 'pointer' : 'default',
    }}>
      {/* Left: dot + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: col,
          boxShadow: active ? `0 0 8px ${col}` : 'none',
        }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 7, letterSpacing: 2,
            color: col, opacity: active ? 1 : 0.5,
          }}>P{player}</span>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 16, fontWeight: 900, color: C.white,
            textShadow: active ? `0 0 8px ${col}55` : 'none',
          }}>{score.toLocaleString()}</span>
        </div>
      </div>

      {/* Center: speed */}
      <SpeedBar band={bandIndex} player={player} />

      {/* Right: next piece */}
      <MiniPiece cells={nextPiece} player={player} />
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
