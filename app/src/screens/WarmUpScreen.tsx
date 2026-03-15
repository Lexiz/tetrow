import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { AiDifficulty } from '../../../shared/game/ai';

const W = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
const H = CONFIG.ROWS * CONFIG.CELL_SIZE + 80;

interface Props {
  onSelect: (difficulty: AiDifficulty) => void;
  onBack: () => void;
  isMobile?: boolean;
}

// Easy: single block — simple
function EasyIcon() {
  const s = 8;
  const g = 2;
  const col = C.p1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: g }}>
      <div style={{ display: 'flex', gap: g }}>
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
      </div>
      <div style={{ display: 'flex', gap: g }}>
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
      </div>
    </div>
  );
}

// Medium: L-shape — moderate complexity
function MediumIcon() {
  const s = 8;
  const g = 2;
  const col = C.p1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: g }}>
      <div style={{ display: 'flex', gap: g }}>
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
        <div style={{ width: s, height: s, opacity: 0 }} />
      </div>
      <div style={{ display: 'flex', gap: g }}>
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
        <div style={{ width: s, height: s, opacity: 0 }} />
      </div>
      <div style={{ display: 'flex', gap: g }}>
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
      </div>
    </div>
  );
}

// Hard: T-piece — advanced
function HardIcon() {
  const s = 8;
  const g = 2;
  const col = C.p1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: g }}>
      <div style={{ display: 'flex', gap: g }}>
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
      </div>
      <div style={{ display: 'flex', gap: g }}>
        <div style={{ width: s, height: s, opacity: 0 }} />
        <div style={{ width: s, height: s, background: col, borderRadius: 1, boxShadow: `0 0 4px ${col}88` }} />
        <div style={{ width: s, height: s, opacity: 0 }} />
      </div>
    </div>
  );
}

const difficulties: { key: AiDifficulty; label: string; desc: string; Icon: () => JSX.Element }[] = [
  { key: 'easy', label: 'EASY', desc: 'Relaxed pace, learns the basics', Icon: EasyIcon },
  { key: 'medium', label: 'MEDIUM', desc: 'Balanced challenge', Icon: MediumIcon },
  { key: 'hard', label: 'HARD', desc: 'Fast and strategic', Icon: HardIcon },
];

export default function WarmUpScreen({ onSelect, onBack, isMobile }: Props) {
  return (
    <div style={{
      width: isMobile ? '100vw' : W,
      height: isMobile ? '100dvh' : H,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.bg, gap: 24,
      position: 'relative', overflow: 'hidden',
      padding: isMobile ? '16px 20px' : '0',
      boxSizing: 'border-box',
    }}>
      {/* Back button */}
      <button onClick={onBack} style={{
        position: 'absolute', top: 16, left: 16, zIndex: 2,
        background: 'none', border: `1px solid ${C.border}`,
        borderRadius: 4, padding: '6px 14px', cursor: 'pointer',
        fontFamily: 'monospace', fontSize: 11, color: C.white, letterSpacing: 1,
      }}>← BACK</button>

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 280, height: 280, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.p1}18 0%, transparent 65%)`,
        filter: 'blur(40px)',
      }} />

      {/* Header */}
      <div style={{ zIndex: 1, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'monospace', fontSize: 9, letterSpacing: 5, color: C.white,
        }}>WARM UP</div>
        <div style={{
          fontFamily: "'Courier New', monospace", fontSize: 28, fontWeight: 900,
          letterSpacing: 2, color: C.p1, marginTop: 6,
          textShadow: `0 0 20px ${C.p1}44`,
        }}>SELECT DIFFICULTY</div>
      </div>

      {/* Difficulty buttons */}
      <div style={{
        zIndex: 1, display: 'flex',
        flexDirection: 'column',
        gap: 14, width: '100%',
        maxWidth: 380, boxSizing: 'border-box',
      }}>
        {difficulties.map(({ key, label, desc, Icon }) => (
          <button key={key} onClick={() => onSelect(key)} style={{
            padding: '20px 24px',
            background: '#080812',
            border: `2px solid ${C.p1}66`,
            borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 18,
            boxShadow: `0 0 16px ${C.p1}11`,
          }}>
            <Icon />
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: 'monospace', fontSize: 14, fontWeight: 900,
                letterSpacing: 3, color: C.p1,
              }}>{label}</div>
              <div style={{
                fontFamily: 'monospace', fontSize: 9, color: C.white, opacity: 0.5,
                marginTop: 4,
              }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
