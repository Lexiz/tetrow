import { useState } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { Owner } from '../../../shared/types';
import type { PlayerStats } from '../../../shared/game/engine';
import type { Action } from '../../../shared/game/engine';
import type { ClientGameState } from '../../../server/src/protocol';
import BoardComponent from '../common/Board';
import Panel from './Panel';
import Divider from './Divider';
import ScorePopup from '../common/ScorePopup';
import LineClearEffect from '../common/LineClearEffect';
import GamePauseOverlay from '../common/GamePauseOverlay';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';

interface Props {
  gameState: ClientGameState | null;
  myPlayer: Owner;
  myName: string;
  opponentName: string;
  eloLoss: number;
  sendAction: (action: Action) => void;
  onGameEnd: (p1Score: number, p2Score: number, toppedOut: Owner | null, stats: [PlayerStats, PlayerStats]) => void;
  onQuit: () => void;
}

export default function MultiplayerGameScreen({ gameState, myPlayer, myName, opponentName, eloLoss, sendAction, onGameEnd, onQuit }: Props) {
  const game = useMultiplayerGame(gameState, myPlayer, sendAction);
  const [showPause, setShowPause] = useState(false);

  if (!game) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 48, background: C.bg,
      }}>
        <div style={{
          fontFamily: 'monospace', fontSize: 11, letterSpacing: 3,
          color: C.text,
        }}>WAITING FOR GAME STATE...</div>
      </div>
    );
  }

  const myLabel = myPlayer === 1 ? 'YOU (P1)' : 'YOU (P2)';
  const oppLabel = myPlayer === 1 ? `${opponentName} (P2)` : `${opponentName} (P1)`;
  const myScore = game.scores[myPlayer - 1];
  const myBandIdx = myPlayer === 1 ? game.p1BandIdx : game.p2BandIdx;
  const speedLabel = CONFIG.SPEED_BANDS[myBandIdx]?.label ?? 'S0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: 24, background: C.bg, gap: 0 }}>
        <Panel
          player={1}
          score={game.scores[0]}
          bandIndex={game.p1BandIdx}
          nextPiece={game.p1Next}
          active={game.active === 1 && !game.ended}
        />
        <Divider activePlayer={game.ended ? 1 : game.active} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
          {/* Turn indicator */}
          <div style={{
            fontFamily: 'monospace', fontSize: 9, letterSpacing: 5,
            color: game.isMyTurn ? (myPlayer === 1 ? C.p1 : C.p2) : C.text,
            textShadow: game.isMyTurn ? `0 0 10px ${myPlayer === 1 ? C.p1 : C.p2}` : 'none',
          }}>
            {game.ended ? 'MATCH OVER' : game.isMyTurn ? 'YOUR TURN' : 'OPPONENT\'S TURN'}
          </div>

          <div style={{ position: 'relative' }}>
            <BoardComponent board={game.displayBoard} />
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
            {/* Equalizer warning */}
            {game.phase === 'equalizer' && (
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
            {showPause && !game.ended && (
              <GamePauseOverlay
                playerName={myName}
                playerNum={myPlayer}
                score={myScore}
                speedBand={speedLabel}
                eloLoss={eloLoss}
                onBack={() => setShowPause(false)}
                onQuit={onQuit}
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: 2 }}>
            <span
              onClick={myPlayer === 1 ? () => setShowPause(true) : undefined}
              style={{
                fontFamily: 'monospace', fontSize: 10,
                color: C.p1, textShadow: `0 0 10px ${C.p1}`,
                cursor: myPlayer === 1 ? 'pointer' : 'default',
              }}
            >
              ■ {myPlayer === 1 ? myLabel : oppLabel}
            </span>
            <span
              onClick={myPlayer === 2 ? () => setShowPause(true) : undefined}
              style={{
                fontFamily: 'monospace', fontSize: 10,
                color: C.p2, textShadow: `0 0 10px ${C.p2}`,
                cursor: myPlayer === 2 ? 'pointer' : 'default',
              }}
            >
              ■ {myPlayer === 2 ? myLabel : oppLabel}
            </span>
          </div>
        </div>

        <Divider activePlayer={game.ended ? 1 : game.active} />
        <Panel
          player={2}
          score={game.scores[1]}
          bandIndex={game.p2BandIdx}
          nextPiece={game.p2Next}
          active={game.active === 2 && !game.ended}
        />
      </div>

      {/* End-game overlay */}
      {game.ended && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,5,8,0.75)',
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
