import { useState, useEffect } from 'react';
import { C } from '../theme';
import type { Owner } from '../types';

interface Props {
  base: number;
  bonus: number;
  player: Owner;
}

export default function ScorePopup({ base, bonus, player }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const id = setTimeout(() => setVisible(false), 900);
    return () => clearTimeout(id);
  }, []);

  const playerColor = player === 1 ? C.p1 : C.p2;
  const opponentColor = player === 1 ? C.p2 : C.p1;

  return (
    <div
      style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        pointerEvents: 'none',
        zIndex: 5,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease-out, transform 0.9s ease-out',
        ...(visible ? {} : { transform: 'translateX(-50%) translateY(-30px)' }),
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 18,
          fontWeight: 900,
          color: playerColor,
          textShadow: `0 0 12px ${playerColor}`,
        }}
      >
        +{base}
      </span>
      {bonus > 0 && (
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 13,
            fontWeight: 700,
            color: opponentColor,
            textShadow: `0 0 10px ${opponentColor}`,
          }}
        >
          +{bonus}
        </span>
      )}
    </div>
  );
}
