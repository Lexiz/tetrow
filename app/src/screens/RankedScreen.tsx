import { useState } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { User } from 'firebase/auth';

const W = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
const H = CONFIG.ROWS * CONFIG.CELL_SIZE + 80;

type Tab = 'leaderboard' | 'history';

interface Props {
  user: User;
  elo: number;
  onFindMatch: () => void;
  onBack: () => void;
  isMobile?: boolean;
}

export default function RankedScreen({ user, elo, onFindMatch, onBack, isMobile }: Props) {
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [searching, setSearching] = useState(false);
  const rankCol = getRankColor(elo);
  const rankLabel = getRankLabel(elo);

  function handleFindMatch() {
    setSearching(true);
    onFindMatch();
  }

  return (
    <div style={{
      width: isMobile ? '100vw' : W,
      height: isMobile ? '100dvh' : H,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.bg, gap: 20,
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
        width: 300, height: 300, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.p2}18 0%, transparent 65%)`,
        filter: 'blur(40px)',
      }} />

      {/* Header: ELO + rank */}
      <div style={{ zIndex: 1, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'monospace', fontSize: 9, letterSpacing: 5, color: C.white,
        }}>RANKED MODE</div>
        <div style={{
          fontFamily: "'Courier New', monospace", fontSize: 36, fontWeight: 900,
          color: C.white, marginTop: 4,
        }}>{elo}</div>
        <div style={{
          fontFamily: 'monospace', fontSize: 10, letterSpacing: 3,
          fontWeight: 900, color: rankCol,
        }}>{rankLabel}</div>
      </div>

      {/* Online players */}
      <div style={{
        zIndex: 1, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#22cc44', boxShadow: '0 0 6px #22cc44',
        }} />
        <span style={{
          fontFamily: 'monospace', fontSize: 9, color: C.text, opacity: 0.6,
        }}>0 online</span>
      </div>

      {/* Find Match button */}
      <button onClick={handleFindMatch} disabled={searching} style={{
        zIndex: 1, padding: '14px 48px',
        background: searching ? C.panel : C.bg,
        border: `2px solid ${searching ? C.dim : C.p2}`,
        borderRadius: 5, cursor: searching ? 'default' : 'pointer',
        fontFamily: 'monospace', fontSize: 13, fontWeight: 900,
        letterSpacing: 4, color: searching ? C.dim : C.white,
        boxShadow: searching ? 'none' : `0 0 12px ${C.p2}44, 0 0 24px ${C.p2}18`,
      }}>
        {searching ? 'SEARCHING...' : 'FIND MATCH'}
      </button>

      {/* Tabs */}
      <div style={{
        zIndex: 1, display: 'flex', gap: 0,
        width: isMobile ? '100%' : 380,
        maxWidth: 420,
      }}>
        {(['leaderboard', 'history'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 0',
            background: tab === t ? C.panel : 'transparent',
            border: 'none',
            borderBottom: `2px solid ${tab === t ? C.p2 : C.border}`,
            cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
            letterSpacing: 2, color: tab === t ? C.white : C.text,
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{
        zIndex: 1,
        width: isMobile ? '100%' : 380,
        maxWidth: 420,
        minHeight: 200,
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: 16,
        boxSizing: 'border-box',
      }}>
        {tab === 'leaderboard' ? (
          <LeaderboardTab />
        ) : (
          <HistoryTab />
        )}
      </div>
    </div>
  );
}

function LeaderboardTab() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 160, gap: 8,
    }}>
      <div style={{
        fontFamily: 'monospace', fontSize: 9, letterSpacing: 3,
        color: C.text, textAlign: 'center',
      }}>LEADERBOARD</div>
      <div style={{
        fontFamily: 'monospace', fontSize: 10, color: C.text, opacity: 0.5,
        textAlign: 'center', lineHeight: 1.6,
      }}>
        No ranked matches yet.<br />
        Play matches to appear here.
      </div>
    </div>
  );
}

function HistoryTab() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 160, gap: 8,
    }}>
      <div style={{
        fontFamily: 'monospace', fontSize: 9, letterSpacing: 3,
        color: C.text, textAlign: 'center',
      }}>MATCH HISTORY</div>
      <div style={{
        fontFamily: 'monospace', fontSize: 10, color: C.text, opacity: 0.5,
        textAlign: 'center', lineHeight: 1.6,
      }}>
        No matches played yet.<br />
        Find a match to get started.
      </div>
    </div>
  );
}

function getRankLabel(elo: number): string {
  if (elo >= 2200) return 'DIAMOND';
  if (elo >= 1800) return 'PLATINUM';
  if (elo >= 1400) return 'GOLD';
  if (elo >= 1000) return 'SILVER';
  return 'BRONZE';
}

function getRankColor(elo: number): string {
  if (elo >= 2200) return '#b9f2ff';
  if (elo >= 1800) return '#e5e4e2';
  if (elo >= 1400) return '#ffd700';
  if (elo >= 1000) return '#c0c0c0';
  return '#cd7f32';
}
