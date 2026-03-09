import { useState } from 'react';
import { C } from '../../../shared/theme';
import type { Owner } from '../../../shared/types';

interface Props {
  playerName: string;
  playerNum: Owner;
  score: number;
  speedBand: string;
  eloLoss?: number;
  onBack: () => void;
  onQuit: () => void;
}

export default function GamePauseOverlay({ playerName, playerNum, score, speedBand, eloLoss, onBack, onQuit }: Props) {
  const [confirmQuit, setConfirmQuit] = useState(false);
  const col = playerNum === 1 ? C.p1 : C.p2;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onBack(); }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(5,5,8,0.85)',
        zIndex: 8,
      }}
    >
      <div style={{
        background: C.panel,
        border: `1.5px solid ${col}44`,
        borderRadius: 10,
        padding: '28px 36px',
        minWidth: 260,
        maxWidth: 340,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        boxShadow: `0 0 30px ${col}22, 0 4px 20px rgba(0,0,0,0.6)`,
      }}>
        {/* Player info */}
        <div style={{
          fontFamily: 'monospace', fontSize: 14, letterSpacing: 3,
          color: col, fontWeight: 900,
          textShadow: `0 0 10px ${col}66`,
        }}>{playerName.toUpperCase()}</div>

        <div style={{
          width: '100%', display: 'flex', flexDirection: 'column', gap: 8,
          padding: '10px 0', borderTop: `1px solid ${col}22`, borderBottom: `1px solid ${col}22`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.text, opacity: 0.5 }}>Score</span>
            <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: C.white }}>{score.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.text, opacity: 0.5 }}>Speed</span>
            <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: C.white }}>{speedBand}</span>
          </div>
        </div>

        {!confirmQuit ? (
          <>
            <button onClick={onBack} style={{
              width: '100%', padding: '12px 0',
              background: col,
              border: 'none', borderRadius: 4, cursor: 'pointer',
              fontFamily: 'monospace', fontSize: 13, fontWeight: 900,
              letterSpacing: 3, color: '#050508',
              boxShadow: `0 0 12px ${col}55`,
            }}>BACK TO GAME</button>

            <button onClick={eloLoss != null ? () => setConfirmQuit(true) : onQuit} style={{
              width: '100%', padding: '10px 0',
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 4, cursor: 'pointer',
              fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
              letterSpacing: 2, color: C.text, opacity: 0.5,
            }}>QUIT GAME</button>
          </>
        ) : (
          <>
            <div style={{
              fontFamily: 'monospace', fontSize: 12,
              color: '#ff4466', textAlign: 'center', lineHeight: 1.6,
            }}>
              Quitting will count as a loss.
              <br />
              <span style={{ fontWeight: 900, fontSize: 14 }}>You will lose {Math.abs(eloLoss!)} ELO</span>
            </div>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button onClick={() => setConfirmQuit(false)} style={{
                flex: 1, padding: '12px 0',
                background: 'transparent',
                border: `1.5px solid ${C.border}`,
                borderRadius: 4, cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                letterSpacing: 2, color: C.white,
              }}>NO</button>

              <button onClick={onQuit} style={{
                flex: 1, padding: '12px 0',
                background: '#ff446622',
                border: '1.5px solid #ff4466',
                borderRadius: 4, cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                letterSpacing: 2, color: '#ff4466',
              }}>YES, QUIT</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
