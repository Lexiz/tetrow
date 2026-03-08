import { useState, useEffect, useRef } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { Owner } from '../../../shared/types';
import type { PlayerStats, Action } from '../../../shared/game/engine';
import type { ClientGameState } from '../../../server/src/protocol';
import BoardComponent from '../common/Board';
import ScorePopup from '../common/ScorePopup';
import LineClearEffect from '../common/LineClearEffect';
import MiniPiece from '../common/MiniPiece';
import SpeedBar from '../common/SpeedBar';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';
import { useTouchInput } from '../hooks/useTouchInput';

const BAR_HEIGHT = 64;

interface Props {
  gameState: ClientGameState | null;
  myPlayer: Owner;
  opponentName: string;
  sendAction: (action: Action) => void;
  onGameEnd: (p1Score: number, p2Score: number, toppedOut: Owner | null, stats: [PlayerStats, PlayerStats]) => void;
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

export default function MobileMultiplayerGameScreen({ gameState, myPlayer, opponentName, sendAction, onGameEnd }: Props) {
  const game = useMultiplayerGame(gameState, myPlayer, sendAction);
  const cellSize = useMobileCellSize();
  const boardRef = useRef<HTMLDivElement>(null);

  // Wire touch input — use handleTouchAction from the multiplayer game hook
  useTouchInput(
    myPlayer, // always listen as our player
    game?.handleTouchAction ?? (() => {}),
    boardRef,
  );

  if (!game) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100dvh', background: '#030306',
      }}>
        <div style={{
          fontFamily: 'monospace', fontSize: 11, letterSpacing: 3,
          color: C.text,
        }}>WAITING FOR GAME...</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100dvh',
      width: '100%',
      boxSizing: 'border-box',
      justifyContent: 'space-between',
      padding: 0,
      background: '#030306',
      overflow: 'hidden',
    }}>
      {/* Turn indicator at top */}
      <div style={{
        padding: '6px 0',
        fontFamily: 'monospace', fontSize: 9, letterSpacing: 4,
        color: game.isMyTurn ? (myPlayer === 1 ? C.p1 : C.p2) : C.text,
        textShadow: game.isMyTurn ? `0 0 10px ${myPlayer === 1 ? C.p1 : C.p2}` : 'none',
        textAlign: 'center',
      }}>
        {game.ended ? 'MATCH OVER' : game.isMyTurn ? 'YOUR TURN' : `${opponentName}'S TURN`}
      </div>

      {/* Board area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div ref={boardRef} style={{ position: 'relative', touchAction: 'none' }}>
          <BoardComponent board={game.displayBoard} cellSize={cellSize} />
          {game.lastClear && (
            <ScorePopup
              key={game.lastClear.id}
              base={game.lastClear.base}
              bonus={game.lastClear.bonus}
              player={game.lastClear.player}
            />
          )}
          {game.lastClear && game.clearedRows.length > 0 && (
            <LineClearEffect
              key={`clear-${game.lastClear.id}`}
              rows={game.clearedRows}
              player={game.lastClear.player}
            />
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        width: '100%',
        height: BAR_HEIGHT,
        display: 'flex',
        background: C.panel,
        borderTop: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <PlayerHalf
          player={1}
          label={myPlayer === 1 ? 'YOU' : opponentName}
          score={game.scores[0]}
          bandIndex={game.p1BandIdx}
          nextPiece={game.p1Next}
          active={game.active === 1 && !game.ended}
        />
        <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />
        <PlayerHalf
          player={2}
          label={myPlayer === 2 ? 'YOU' : opponentName}
          score={game.scores[1]}
          bandIndex={game.p2BandIdx}
          nextPiece={game.p2Next}
          active={game.active === 2 && !game.ended}
        />
      </div>

      {/* End overlay */}
      {game.ended && (
        <div style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,5,8,0.85)',
          zIndex: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 9, letterSpacing: 7,
              color: C.white, marginBottom: 12,
            }}>MATCH OVER</div>
            <button
              onClick={() => onGameEnd(game.scores[0], game.scores[1], game.toppedOut, game.stats)}
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

interface PlayerHalfProps {
  player: 1 | 2;
  label: string;
  score: number;
  bandIndex: number;
  nextPiece: [number, number][];
  active: boolean;
}

function PlayerHalf({ player, label, score, bandIndex, nextPiece, active }: PlayerHalfProps) {
  const col = player === 1 ? C.p1 : C.p2;
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 10px',
      background: active ? `${col}0c` : 'transparent',
      boxShadow: active ? `inset 0 0 16px ${col}15` : 'none',
      transition: 'all 0.3s',
    }}>
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
          }}>{label}</span>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 16, fontWeight: 900, color: C.white,
            textShadow: active ? `0 0 8px ${col}55` : 'none',
          }}>{score.toLocaleString()}</span>
        </div>
      </div>
      <SpeedBar band={bandIndex} player={player} />
      <MiniPiece cells={nextPiece} player={player} />
    </div>
  );
}
