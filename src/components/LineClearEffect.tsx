import { useState, useEffect, useMemo } from 'react';
import { C } from '../theme';
import { CONFIG } from '../config';
import type { Owner } from '../types';

const { CELL_SIZE, COLS } = CONFIG;
const BOARD_W = COLS * CELL_SIZE + 4; // +4 for border

interface Props {
  rows: number[];
  player: Owner;
}

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
}

export default function LineClearEffect({ rows, player }: Props) {
  const [phase, setPhase] = useState<'flash' | 'explode' | 'done'>('flash');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('explode'), 150);
    const t2 = setTimeout(() => setPhase('done'), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const col = player === 1 ? C.p1 : C.p2;
  const colB = player === 1 ? C.p1b : C.p2b;

  // Generate particles once
  const particles = useMemo(() => {
    const p: Particle[] = [];
    for (const row of rows) {
      const cy = row * CELL_SIZE + CELL_SIZE / 2;
      for (let i = 0; i < 14; i++) {
        p.push({
          x: Math.random() * BOARD_W,
          y: cy,
          dx: (Math.random() - 0.5) * 120,
          dy: (Math.random() - 0.5) * 80 - 20,
          size: 2 + Math.random() * 4,
          color: Math.random() > 0.5 ? col : colB,
        });
      }
    }
    return p;
  }, [rows, col, colB]);

  if (phase === 'done') return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 4,
      overflow: 'hidden',
    }}>
      {/* Flash overlay on cleared rows */}
      {rows.map(row => (
        <div
          key={row}
          style={{
            position: 'absolute',
            top: row * CELL_SIZE,
            left: 0,
            width: '100%',
            height: CELL_SIZE,
            background: phase === 'flash'
              ? `linear-gradient(90deg, transparent, ${col}cc, ${C.white}ee, ${col}cc, transparent)`
              : 'transparent',
            boxShadow: phase === 'flash' ? `0 0 20px ${col}, 0 0 40px ${col}88` : 'none',
            opacity: phase === 'flash' ? 1 : 0,
            transition: 'opacity 0.2s ease-out',
          }}
        />
      ))}

      {/* Particles */}
      {phase === 'explode' && particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            opacity: 0,
            transform: `translate(${p.dx}px, ${p.dy}px)`,
            transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
          }}
          ref={el => {
            if (el) {
              // Trigger animation on next frame
              requestAnimationFrame(() => {
                el.style.opacity = '0.9';
                requestAnimationFrame(() => {
                  el.style.transform = `translate(${p.dx * 2}px, ${p.dy * 2 + 30}px)`;
                  el.style.opacity = '0';
                });
              });
            }
          }}
        />
      ))}
    </div>
  );
}
