import { useState, useEffect, useMemo } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { Owner } from '../../../shared/types';

const { COLS } = CONFIG;

interface Props {
  rows: number[];
  player: Owner;
  cellSize?: number;
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

export default function LineClearEffect({ rows, player, cellSize: cellSizeProp }: Props) {
  const S = cellSizeProp ?? CONFIG.CELL_SIZE;
  const [phase, setPhase] = useState<'highlight' | 'flash' | 'explode' | 'done'>('highlight');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('flash'), 500);
    const t2 = setTimeout(() => setPhase('explode'), 700);
    const t3 = setTimeout(() => setPhase('done'), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const col = player === 1 ? C.p1 : C.p2;
  const colB = player === 1 ? C.p1b : C.p2b;

  // Bounding box for the cleared rows
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const borderTop = minRow * S;
  const borderHeight = (maxRow - minRow + 1) * S;

  // Generate block-shaped explosion particles (one per cell in each cleared row)
  const particles = useMemo(() => {
    const p: Particle[] = [];
    for (const row of rows) {
      for (let c = 0; c < COLS; c++) {
        const cx = c * S;
        const cy = row * S;
        p.push({
          x: cx,
          y: cy,
          dx: (Math.random() - 0.5) * 160,
          dy: (Math.random() - 0.5) * 100 - 30,
          w: S * (0.4 + Math.random() * 0.5),
          h: S * (0.3 + Math.random() * 0.4),
          color: Math.random() > 0.4 ? col : colB,
          rot: (Math.random() - 0.5) * 180,
        });
      }
      // Extra small debris
      for (let i = 0; i < 8; i++) {
        p.push({
          x: Math.random() * COLS * S,
          y: row * S + Math.random() * S,
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
  }, [rows, col, colB, S]);

  if (phase === 'done') return null;

  const showSolid = phase === 'highlight' || phase === 'flash' || phase === 'explode';
  const fadingOut = phase === 'explode';

  return (
    <div style={{
      position: 'absolute',
      top: 2, // inside board border
      left: 2,
      width: COLS * S,
      height: CONFIG.ROWS * S,
      pointerEvents: 'none',
      zIndex: 4,
      overflow: 'hidden',
    }}>
      {/* Solid filled cells to mask the already-cleared board */}
      {showSolid && rows.map(row =>
        Array.from({ length: COLS }).map((_, c) => (
          <div
            key={`fill-${row}-${c}`}
            style={{
              position: 'absolute',
              top: row * S,
              left: c * S,
              width: S,
              height: S,
              background: fadingOut
                ? col
                : phase === 'flash'
                  ? `${C.white}cc`
                  : col,
              opacity: fadingOut ? 0 : phase === 'flash' ? 1 : 0.85,
              border: `1px solid ${phase === 'flash' ? C.white : col}44`,
              boxSizing: 'border-box',
              transition: fadingOut
                ? 'opacity 0.5s ease-out'
                : 'background 0.15s ease-out, opacity 0.15s ease-out',
            }}
          />
        ))
      )}

      {/* Highlight border around all clearing rows */}
      {showSolid && !fadingOut && (
        <div style={{
          position: 'absolute',
          top: borderTop - 2,
          left: -2,
          width: COLS * S + 4,
          height: borderHeight + 4,
          border: `2px solid ${phase === 'flash' ? C.white : col}`,
          borderRadius: 2,
          boxShadow: phase === 'flash'
            ? `0 0 30px ${col}, 0 0 60px ${col}88, inset 0 0 20px ${col}44`
            : `0 0 12px ${col}88, 0 0 24px ${col}44`,
          transition: 'box-shadow 0.2s ease-out',
          pointerEvents: 'none',
        }} />
      )}

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
            transform: 'translate(0px, 0px) rotate(0deg)',
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
    </div>
  );
}
