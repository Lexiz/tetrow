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

const difficulties: { key: AiDifficulty; label: string; desc: string }[] = [
  { key: 'easy', label: 'EASY', desc: 'Relaxed pace, learns the basics' },
  { key: 'medium', label: 'MEDIUM', desc: 'Balanced challenge' },
  { key: 'hard', label: 'HARD', desc: 'Fast and strategic' },
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
      padding: isMobile ? '16px' : 0,
      boxSizing: 'border-box',
    }}>
      {/* Back button */}
      <button onClick={onBack} style={{
        position: 'absolute', top: 16, left: 16, zIndex: 2,
        background: 'none', border: `1px solid ${C.border}`,
        borderRadius: 3, padding: '4px 10px', cursor: 'pointer',
        fontFamily: 'monospace', fontSize: 9, color: C.white, letterSpacing: 1,
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
        gap: 12, width: isMobile ? '100%' : 320,
        maxWidth: 360, padding: '0 24px', boxSizing: 'border-box',
      }}>
        {difficulties.map(({ key, label, desc }) => (
          <button key={key} onClick={() => onSelect(key)} style={{
            padding: '20px 24px',
            background: '#080812',
            border: `1.5px solid ${C.p1}44`,
            borderRadius: 6, cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: `0 0 10px ${C.p1}08`,
          }}>
            <div>
              <div style={{
                fontFamily: 'monospace', fontSize: 13, fontWeight: 900,
                letterSpacing: 3, color: C.p1, textAlign: 'left',
              }}>{label}</div>
              <div style={{
                fontFamily: 'monospace', fontSize: 9, color: C.text, opacity: 0.5,
                marginTop: 4, textAlign: 'left',
              }}>{desc}</div>
            </div>
            <div style={{
              fontFamily: 'monospace', fontSize: 14, color: C.p1, opacity: 0.4,
            }}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
}
