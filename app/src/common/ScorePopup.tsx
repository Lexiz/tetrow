import { useState, useEffect } from 'react';
import { C } from '../../../shared/theme';
import type { Owner } from '../../../shared/types';

interface Props {
  base: number;
  bonus: number;
  player: Owner;
}

export default function ScorePopup({ base, bonus, player }: Props) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const id = setTimeout(() => setPhase('out'), 2600);
    return () => clearTimeout(id);
  }, []);

  const playerColor = player === 1 ? C.p1 : C.p2;
  const opponentColor = player === 1 ? C.p2 : C.p1;

  return (
    <div
      style={{
        position: 'absolute',
        top: '35%',
        left: '50%',
        transform: phase === 'in'
          ? 'translateX(-50%) scale(1)'
          : 'translateX(-50%) translateY(-40px) scale(0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        pointerEvents: 'none',
        zIndex: 5,
        opacity: phase === 'in' ? 1 : 0,
        transition: 'opacity 0.5s ease-out, transform 1.2s ease-out',
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: 2,
          color: playerColor,
          textShadow: `0 0 20px ${playerColor}, 0 0 40px ${playerColor}88`,
          WebkitTextStroke: `0.5px ${playerColor}`,
        }}
      >
        +{base}
      </span>
      {bonus > 0 && (
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 1,
            color: opponentColor,
            textShadow: `0 0 16px ${opponentColor}, 0 0 30px ${opponentColor}88`,
          }}
        >
          +{bonus}
        </span>
      )}
    </div>
  );
}
