import { useState, useEffect } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { AiDifficulty } from '../../../shared/game/ai';
import type { PlayerStats } from '../../../shared/game/engine';
import { getPracticeHistory, type PracticeRecord } from '../firestore';

const W = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
const H = CONFIG.ROWS * CONFIG.CELL_SIZE + 80;

type Tab = 'play' | 'history';

interface Props {
  userId: string;
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

export default function WarmUpScreen({ userId, onSelect, onBack, isMobile }: Props) {
  const [tab, setTab] = useState<Tab>('play');

  return (
    <div style={{
      width: isMobile ? '100vw' : W,
      height: isMobile ? '100dvh' : H,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
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

      {/* Spacer: back button (~30px tall) + 30px gap */}
      <div style={{ height: 60, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ zIndex: 1, textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Courier New', monospace", fontSize: 28, fontWeight: 900,
          letterSpacing: 2, color: C.p1,
          textShadow: `0 0 20px ${C.p1}44`,
        }}>PRACTICE</div>
      </div>

      {/* Tabs */}
      <div style={{
        zIndex: 1, display: 'flex', gap: 0,
        width: '100%', maxWidth: 380,
      }}>
        {(['play', 'history'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 0',
            background: tab === t ? C.panel : 'transparent',
            border: 'none',
            borderBottom: `2px solid ${tab === t ? C.p1 : C.border}`,
            cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
            letterSpacing: 2, color: tab === t ? C.white : C.text,
          }}>{t === 'play' ? 'PLAY' : 'HISTORY'}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'play' ? (
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
      ) : (
        <div style={{
          zIndex: 1, width: '100%', maxWidth: 380,
          flex: 1, minHeight: 0,
          overflowY: 'auto',
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          padding: 16,
          boxSizing: 'border-box',
        }}>
          <PracticeHistoryTab userId={userId} />
        </div>
      )}
    </div>
  );
}

function PracticeHistoryTab({ userId }: { userId: string }) {
  const [records, setRecords] = useState<PracticeRecord[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      getPracticeHistory(userId, 20).then(setRecords).catch(() => setRecords([]));
    }
  }, [userId]);

  if (records === null) {
    return <div style={{ fontFamily: 'monospace', fontSize: 9, color: C.text, textAlign: 'center', padding: 20 }}>Loading...</div>;
  }

  if (records.length === 0) {
    return (
      <div style={{
        fontFamily: 'monospace', fontSize: 10, color: C.text, opacity: 0.5,
        textAlign: 'center', lineHeight: 1.6, padding: 20,
      }}>
        No practice games yet.<br />Play a game to see your history.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {records.map((r, i) => {
        const rowId = r.id ?? String(i);
        const isExpanded = expandedId === rowId;
        const won = r.winner === 1;
        const lost = r.winner === 2;
        const resultText = won ? 'WIN' : lost ? 'LOSS' : 'DRAW';
        const resultColor = won ? '#22cc44' : lost ? '#ff4466' : C.text;
        const diffLabel = r.difficulty.toUpperCase();
        const diffColor = r.difficulty === 'easy' ? '#22cc44' : r.difficulty === 'medium' ? '#ffaa22' : '#ff4466';

        return (
          <div key={rowId}>
            <div
              onClick={() => setExpandedId(isExpanded ? null : rowId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px', borderRadius: 4,
                background: won ? '#22cc4408' : lost ? '#ff446608' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <span style={{
                fontFamily: 'monospace', fontSize: 8, color: C.text, opacity: 0.5,
                transition: 'transform 0.15s',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                width: 8,
              }}>{'\u25B6'}</span>
              <span style={{
                fontFamily: 'monospace', fontSize: 9, fontWeight: 900,
                color: resultColor, width: 32,
              }}>{resultText}</span>
              <span style={{
                fontFamily: 'monospace', fontSize: 8, fontWeight: 700,
                color: diffColor, width: 48,
              }}>{diffLabel}</span>
              <span style={{
                fontFamily: 'monospace', fontSize: 9, color: C.white,
                flex: 1,
              }}>{r.myScore}-{r.aiScore}</span>
              <span style={{
                fontFamily: 'monospace', fontSize: 8, color: C.text, opacity: 0.4,
              }}>{formatDuration(r.durationMs)}</span>
            </div>
            {isExpanded && (
              <PracticeMatchDetails myStats={r.myStats} aiStats={r.aiStats} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PracticeMatchDetails({ myStats, aiStats }: {
  myStats: PlayerStats;
  aiStats: PlayerStats;
}) {
  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: 8, color: C.text, opacity: 0.5, width: 52,
  };
  const valStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: 9, color: C.white, width: 36, textAlign: 'right',
  };
  const headerStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: 7, color: C.text, opacity: 0.4,
    letterSpacing: 1, width: 36, textAlign: 'right',
  };

  return (
    <div style={{
      margin: '2px 0 6px 16px', padding: '6px 10px',
      background: `${C.border}22`, borderRadius: 4,
      borderLeft: `2px solid ${C.border}`,
    }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 4, paddingLeft: 52 }}>
        <span style={headerStyle}>YOU</span>
        <span style={headerStyle}>AI</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={labelStyle}>PIECES</span>
        <span style={valStyle}>{myStats.piecesPlaced ?? '-'}</span>
        <span style={valStyle}>{aiStats.piecesPlaced ?? '-'}</span>
      </div>
      {(['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD'] as const).map((label, idx) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={labelStyle}>{label}</span>
          <span style={valStyle}>{myStats.clears[idx]}</span>
          <span style={valStyle}>{aiStats.clears[idx]}</span>
        </div>
      ))}
    </div>
  );
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
