import { useState, useEffect, useRef, useMemo } from 'react';
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
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rot: number;
  rotSpeed: number;
  opacity: number;
  life: number;     // 0..1 remaining
  decay: number;    // how fast life drains per frame
  glow: number;     // glow intensity multiplier
}

const GRAVITY = 420;        // px/s² downward pull
const EXPLODE_DURATION = 900; // ms for explosion phase

export default function LineClearEffect({ rows, player, cellSize: cellSizeProp }: Props) {
  const S = cellSizeProp ?? CONFIG.CELL_SIZE;
  const [phase, setPhase] = useState<'highlight' | 'flash' | 'explode' | 'done'>('highlight');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('flash'), 500);
    const t2 = setTimeout(() => setPhase('explode'), 700);
    const t3 = setTimeout(() => setPhase('done'), 700 + EXPLODE_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const col = player === 1 ? C.p1 : C.p2;
  const colB = player === 1 ? C.p1b : C.p2b;

  // Bounding box for the cleared rows
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const borderTop = minRow * S;
  const borderHeight = (maxRow - minRow + 1) * S;

  const boardW = COLS * S;
  const boardH = CONFIG.ROWS * S;

  // Generate particles on mount
  useMemo(() => {
    const p: Particle[] = [];
    for (const row of rows) {
      // Block shards — 2 per cell for denser feel
      for (let c = 0; c < COLS; c++) {
        const cx = c * S + S / 2;
        const cy = row * S + S / 2;
        for (let f = 0; f < 2; f++) {
          const angle = (Math.random() - 0.5) * Math.PI; // upward-biased spread
          const speed = 120 + Math.random() * 180;
          p.push({
            x: cx + (Math.random() - 0.5) * S * 0.6,
            y: cy + (Math.random() - 0.5) * S * 0.4,
            vx: Math.cos(angle) * speed * (0.6 + Math.random() * 0.8),
            vy: -Math.abs(Math.sin(angle)) * speed * (0.5 + Math.random()) - 40,
            w: S * (0.25 + Math.random() * 0.4),
            h: S * (0.2 + Math.random() * 0.35),
            color: Math.random() > 0.35 ? col : colB,
            rot: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 600,
            opacity: 0.9 + Math.random() * 0.1,
            life: 1,
            decay: 0.7 + Math.random() * 0.6,
            glow: 0.8 + Math.random() * 0.4,
          });
        }
      }

      // Small sparks / debris — 20 per row
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 250;
        p.push({
          x: Math.random() * boardW,
          y: row * S + Math.random() * S,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 60,
          w: 1.5 + Math.random() * 2.5,
          h: 1.5 + Math.random() * 2.5,
          color: Math.random() > 0.4 ? col : (Math.random() > 0.5 ? colB : C.white),
          rot: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 900,
          opacity: 1,
          life: 1,
          decay: 1.0 + Math.random() * 1.0,
          glow: 1.2 + Math.random() * 0.6,
        });
      }

      // Bright hot sparks — 6 per row, fast and bright
      for (let i = 0; i < 6; i++) {
        const angle = (Math.random() - 0.5) * Math.PI * 0.8;
        const speed = 200 + Math.random() * 200;
        p.push({
          x: Math.random() * boardW,
          y: row * S + S / 2,
          vx: Math.cos(angle) * speed,
          vy: -Math.abs(Math.sin(angle)) * speed - 80,
          w: 2 + Math.random() * 2,
          h: 1 + Math.random() * 1.5,
          color: C.white,
          rot: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 1200,
          opacity: 1,
          life: 1,
          decay: 1.5 + Math.random() * 1.0,
          glow: 2.0,
        });
      }
    }
    particlesRef.current = p;
  }, [rows, col, colB, S, boardW]);

  // Canvas-based physics animation
  useEffect(() => {
    if (phase !== 'explode') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    function tick(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
      lastTime = now;

      ctx!.clearRect(0, 0, boardW, boardH);

      let alive = 0;
      for (const p of particlesRef.current) {
        if (p.life <= 0) continue;

        // Physics
        p.vx *= 0.98; // air resistance
        p.vy += GRAVITY * dt;
        p.vy *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.rotSpeed * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) { p.life = 0; continue; }

        alive++;
        const alpha = Math.min(1, p.life * 2) * p.opacity; // fade in last half of life

        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rot * Math.PI) / 180);

        // Glow layer
        if (p.glow > 0.5 && alpha > 0.3) {
          ctx!.shadowColor = p.color;
          ctx!.shadowBlur = p.w * p.glow * 2;
        }

        ctx!.fillStyle = p.color;
        if (p.w > 4) {
          // Block shard — rounded rect approximation
          ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          // Tiny spark — circle
          ctx!.beginPath();
          ctx!.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx!.fill();
        }

        ctx!.restore();
      }

      if (alive > 0) {
        animRef.current = requestAnimationFrame(tick);
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, boardW, boardH]);

  if (phase === 'done') return null;

  const showSolid = phase === 'highlight' || phase === 'flash' || phase === 'explode';
  const fadingOut = phase === 'explode';

  return (
    <div style={{
      position: 'absolute',
      top: 2, // inside board border
      left: 2,
      width: boardW,
      height: boardH,
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
                ? 'opacity 0.4s ease-out'
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
          width: boardW + 4,
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

      {/* Canvas for physics-based particle explosion */}
      {phase === 'explode' && (
        <canvas
          ref={canvasRef}
          width={boardW}
          height={boardH}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: boardW,
            height: boardH,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
