import { useState, useEffect, useMemo } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { Owner } from '../../../shared/types';

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
  w: number;
  h: number;
  color: string;
  rot: number;
}

export default function LineClearEffect({ rows, player }: Props) {
  const [phase, setPhase] = useState<'highlight' | 'flash' | 'explode' | 'done'>('highlight');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('flash'), 500);
    const t2 = setTimeout(() => setPhase('explode'), 700);
    const t3 = setTimeout(() => setPhase('done'), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const col = player === 1 ? C.p1 : C.p2;
  const colB = player === 1 ? C.p1b : C.p2b;

  // Compute bounding box for the cleared rows
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const borderTop = minRow * CELL_SIZE - 2;
  const borderHeight = (maxRow - minRow + 1) * CELL_SIZE + 4;

  // Generate block-shaped particles
  const particles = useMemo(() => {
    const p: Particle[] = [];
    for (const row of rows) {
      const cy = row * CELL_SIZE;
      // Create block-shaped particles across the row
      for (let c = 0; c < COLS; c++) {
        const cx = c * CELL_SIZE + 2; // +2 for board border offset
        p.push({
          x: cx,
          y: cy,
          dx: (Math.random() - 0.5) * 160,
          dy: (Math.random() - 0.5) * 100 - 30,
          w: CELL_SIZE * (0.4 + Math.random() * 0.5),
          h: CELL_SIZE * (0.3 + Math.random() * 0.4),
          color: Math.random() > 0.4 ? col : colB,
          rot: (Math.random() - 0.5) * 180,
        });
      }
      // Extra small debris particles
      for (let i = 0; i < 8; i++) {
        p.push({
          x: Math.random() * BOARD_W,
          y: cy + Math.random() * CELL_SIZE,
          dx: (Math.random() - 0.5) * 200,
          dy: (Math.random() - 0.5) * 120 - 40,
          w: 2 + Math.random() * 3,
          h: 2 + Math.random() * 3,
          color: Math.random() > 0.5 ? col : C.white,
          rot: (Math.random() - 0.5) * 360,
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
      {/* Highlight border around all clearing rows */}
      {(phase === 'highlight' || phase === 'flash') && (
        <div style={{
          position: 'absolute',
          top: borderTop,
          left: -1,
          width: BOARD_W + 2,
          height: borderHeight,
          border: `2px solid ${col}`,
          borderRadius: 2,
          boxShadow: phase === 'flash'
            ? `0 0 30px ${col}, 0 0 60px ${col}88, inset 0 0 20px ${col}44`
            : `0 0 12px ${col}88, 0 0 24px ${col}44, inset 0 0 10px ${col}22`,
          transition: 'box-shadow 0.2s ease-out',
        }} />
      )}

      {/* Row highlight fills */}
      {(phase === 'highlight' || phase === 'flash') && rows.map(row => (
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
              : `${col}18`,
            boxShadow: phase === 'flash' ? `0 0 24px ${col}, 0 0 48px ${col}88` : 'none',
            transition: 'background 0.15s ease-out, box-shadow 0.15s ease-out',
          }}
        />
      ))}

      {/* Pulsing cell outlines during highlight phase */}
      {phase === 'highlight' && rows.map(row => (
        Array.from({ length: COLS }).map((_, c) => (
          <div
            key={`${row}-${c}`}
            style={{
              position: 'absolute',
              top: row * CELL_SIZE + 1,
              left: c * CELL_SIZE + 2,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              border: `1px solid ${col}55`,
              borderRadius: 1,
              animation: 'cellPulse 0.4s ease-in-out infinite alternate',
              animationDelay: `${c * 0.03}s`,
            }}
          />
        ))
      ))}

      {/* Block explosion particles */}
      {phase === 'explode' && particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.w,
            height: p.h,
            borderRadius: p.w > 4 ? 2 : '50%',
            background: p.color,
            boxShadow: `0 0 ${p.w > 4 ? 8 : 4}px ${p.color}`,
            opacity: 0,
            transform: `translate(0px, 0px) rotate(0deg)`,
            transition: 'transform 0.6s ease-out, opacity 0.6s ease-out',
          }}
          ref={el => {
            if (el) {
              requestAnimationFrame(() => {
                el.style.opacity = '0.95';
                requestAnimationFrame(() => {
                  el.style.transform = `translate(${p.dx}px, ${p.dy + 40}px) rotate(${p.rot}deg)`;
                  el.style.opacity = '0';
                });
              });
            }
          }}
        />
      ))}

      {/* CSS keyframes for cell pulse */}
      <style>{`
        @keyframes cellPulse {
          0% { border-color: ${col}33; }
          100% { border-color: ${col}88; }
        }
      `}</style>
    </div>
  );
}
