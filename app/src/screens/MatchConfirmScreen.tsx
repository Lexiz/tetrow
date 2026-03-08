import { useState, useEffect } from 'react';
import { C } from '../../../shared/theme';
import type { Owner } from '../../../shared/types';

interface ConfirmInfo {
  p1Name: string;
  p2Name: string;
  myPlayer: Owner;
  timeoutMs: number;
  p1Confirmed: boolean;
  p2Confirmed: boolean;
}

interface CountdownInfo {
  myPlayer: Owner;
  p1Name: string;
  p2Name: string;
  count: number;
}

interface Props {
  confirmInfo: ConfirmInfo | null;
  countdownInfo: CountdownInfo | null;
  phase: 'confirming' | 'countdown' | 'confirm_timeout';
  onConfirm: () => void;
  onBack: () => void;
  isMobile?: boolean;
}

export default function MatchConfirmScreen({ confirmInfo, countdownInfo, phase, onConfirm, onBack, isMobile }: Props) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  // Countdown timer for confirmation
  useEffect(() => {
    if (phase !== 'confirming') return;
    setTimeLeft(Math.ceil((confirmInfo?.timeoutMs ?? 15000) / 1000));
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, confirmInfo?.timeoutMs]);

  function handleConfirm() {
    if (hasConfirmed) return;
    setHasConfirmed(true);
    onConfirm();
  }

  // Timeout screen
  if (phase === 'confirm_timeout') {
    return (
      <div style={{
        width: isMobile ? '100vw' : 600,
        height: isMobile ? '100dvh' : 500,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: C.bg, gap: 20,
      }}>
        <div style={{
          fontFamily: 'monospace', fontSize: 14, fontWeight: 900,
          color: '#ff4466', letterSpacing: 3,
        }}>MATCH CANCELLED</div>
        <div style={{
          fontFamily: 'monospace', fontSize: 10, color: C.text, opacity: 0.7,
        }}>A player did not confirm in time</div>
        <button onClick={onBack} style={{
          marginTop: 16, padding: '12px 36px',
          background: C.bg, border: `2px solid ${C.p2}`,
          borderRadius: 5, cursor: 'pointer',
          fontFamily: 'monospace', fontSize: 11, fontWeight: 900,
          letterSpacing: 3, color: C.white,
        }}>BACK TO RANKED</button>
      </div>
    );
  }

  // Countdown screen (both confirmed → color reveal + 3,2,1)
  if (phase === 'countdown' && countdownInfo) {
    const myColor = countdownInfo.myPlayer === 1 ? C.p1 : C.p2;
    const myColorName = countdownInfo.myPlayer === 1 ? 'ORANGE' : 'CYAN';
    const myName = countdownInfo.myPlayer === 1 ? countdownInfo.p1Name : countdownInfo.p2Name;

    return (
      <div style={{
        width: isMobile ? '100vw' : 600,
        height: isMobile ? '100dvh' : 500,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: C.bg, gap: 16, position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, ${myColor}20 0%, transparent 60%)`,
          filter: 'blur(50px)',
        }} />

        {/* Color assignment */}
        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <div style={{
            fontFamily: 'monospace', fontSize: 10, letterSpacing: 4,
            color: C.text, marginBottom: 8,
          }}>{myName}</div>
          <div style={{
            fontFamily: "'Courier New', monospace", fontSize: 28, fontWeight: 900,
            color: myColor, letterSpacing: 3,
          }}>YOU ARE {myColorName}</div>
        </div>

        {/* Who goes first */}
        <div style={{
          zIndex: 1, fontFamily: 'monospace', fontSize: 11, letterSpacing: 3,
          color: C.p1, marginTop: 8,
        }}>
          {countdownInfo.myPlayer === 1 ? 'YOU GO FIRST' : `${countdownInfo.p1Name.toUpperCase()} GOES FIRST`}
        </div>

        {/* Countdown number */}
        {countdownInfo.count > 0 && (
          <div style={{
            zIndex: 1, fontFamily: "'Courier New', monospace",
            fontSize: 72, fontWeight: 900,
            color: C.white, marginTop: 16,
            textShadow: `0 0 30px ${myColor}88`,
          }}>{countdownInfo.count}</div>
        )}

        {/* VS display */}
        <div style={{
          zIndex: 1, display: 'flex', alignItems: 'center', gap: 24, marginTop: 8,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
              color: C.p1, letterSpacing: 2,
            }}>{countdownInfo.p1Name}</div>
            <div style={{
              fontFamily: 'monospace', fontSize: 8, color: C.p1, opacity: 0.6,
            }}>ORANGE</div>
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: 12, fontWeight: 900,
            color: C.text, opacity: 0.4,
          }}>VS</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
              color: C.p2, letterSpacing: 2,
            }}>{countdownInfo.p2Name}</div>
            <div style={{
              fontFamily: 'monospace', fontSize: 8, color: C.p2, opacity: 0.6,
            }}>CYAN</div>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation screen
  const p1Confirmed = confirmInfo?.p1Confirmed ?? false;
  const p2Confirmed = confirmInfo?.p2Confirmed ?? false;
  const p1Name = confirmInfo?.p1Name ?? '???';
  const p2Name = confirmInfo?.p2Name ?? '???';
  const myPlayer = confirmInfo?.myPlayer ?? 1;

  return (
    <div style={{
      width: isMobile ? '100vw' : 600,
      height: isMobile ? '100dvh' : 500,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.bg, gap: 20, position: 'relative', overflow: 'hidden',
      padding: isMobile ? 16 : 0, boxSizing: 'border-box',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 300, height: 300, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.p2}18 0%, transparent 65%)`,
        filter: 'blur(40px)',
      }} />

      {/* Title */}
      <div style={{
        zIndex: 1, fontFamily: 'monospace', fontSize: 12, fontWeight: 900,
        letterSpacing: 4, color: C.white,
      }}>MATCH FOUND</div>

      {/* Timer */}
      <div style={{
        zIndex: 1, fontFamily: "'Courier New', monospace",
        fontSize: 28, fontWeight: 900,
        color: timeLeft <= 5 ? '#ff4466' : C.white,
        textShadow: timeLeft <= 5 ? '0 0 10px #ff446688' : 'none',
      }}>{timeLeft}s</div>

      {/* Player slots */}
      <div style={{
        zIndex: 1, display: 'flex', alignItems: 'center', gap: isMobile ? 24 : 48,
      }}>
        {/* Player 1 slot */}
        <PlayerSlot
          name={p1Name}
          confirmed={p1Confirmed}
          color={C.p1}
          colorName="ORANGE"
          isMobile={isMobile}
        />

        <div style={{
          fontFamily: 'monospace', fontSize: 14, fontWeight: 900,
          color: C.text, opacity: 0.3,
        }}>VS</div>

        {/* Player 2 slot */}
        <PlayerSlot
          name={p2Name}
          confirmed={p2Confirmed}
          color={C.p2}
          colorName="CYAN"
          isMobile={isMobile}
        />
      </div>

      {/* Lock In button */}
      {!hasConfirmed ? (
        <button onClick={handleConfirm} style={{
          zIndex: 1, padding: '16px 48px', marginTop: 12,
          background: C.bg,
          border: `2px solid ${myPlayer === 1 ? C.p1 : C.p2}`,
          borderRadius: 5, cursor: 'pointer',
          fontFamily: 'monospace', fontSize: 14, fontWeight: 900,
          letterSpacing: 4, color: C.white,
          boxShadow: `0 0 16px ${myPlayer === 1 ? C.p1 : C.p2}44`,
        }}>LOCK IN</button>
      ) : (
        <div style={{
          zIndex: 1, fontFamily: 'monospace', fontSize: 11, letterSpacing: 3,
          color: '#22cc44', marginTop: 12,
        }}>LOCKED IN — WAITING FOR OPPONENT</div>
      )}
    </div>
  );
}

function PlayerSlot({ name, confirmed, color, colorName, isMobile }: {
  name: string;
  confirmed: boolean;
  color: string;
  colorName: string;
  isMobile?: boolean;
}) {
  const size = isMobile ? 80 : 100;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      width: size + 20,
    }}>
      {/* Silhouette / Avatar circle */}
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: confirmed ? `${color}18` : C.panel,
        border: `2px solid ${confirmed ? color : C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: confirmed ? `0 0 20px ${color}33` : 'none',
      }}>
        {confirmed ? (
          // Checkmark
          <span style={{ fontSize: 36, color }}>✓</span>
        ) : (
          // Silhouette (question mark)
          <span style={{
            fontFamily: "'Courier New', monospace", fontSize: 36, fontWeight: 900,
            color: C.text, opacity: 0.2,
          }}>?</span>
        )}
      </div>

      {/* Name */}
      <div style={{
        fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
        color: confirmed ? C.white : C.text,
        letterSpacing: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        maxWidth: size + 20, textAlign: 'center',
        transition: 'color 0.3s ease',
      }}>{confirmed ? name : '???'}</div>

      {/* Color label */}
      <div style={{
        fontFamily: 'monospace', fontSize: 8, letterSpacing: 2,
        color, opacity: 0.6,
      }}>{colorName}</div>
    </div>
  );
}
