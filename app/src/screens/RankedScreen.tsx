import { useState, useEffect, useRef } from 'react';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { User } from 'firebase/auth';
import type { MatchPhase } from '../hooks/useMultiplayer';
import { getLeaderboard, getMatchHistory, type UserProfile, type MatchRecord } from '../firestore';

const SERVER_URL = 'https://tetchess-server.alex-lisitzky.workers.dev';

const W = CONFIG.COLS * CONFIG.CELL_SIZE + 400;
const H = CONFIG.ROWS * CONFIG.CELL_SIZE + 80;

type Tab = 'leaderboard' | 'history';

interface Props {
  user: User;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  matchPhase: MatchPhase;
  queueSize: number;
  opponentName: string | null;
  error: string | null;
  onFindMatch: () => void;
  onCancelSearch: () => void;
  onBack: () => void;
  onEnterLobby: () => void;
  onLeaveLobby: () => void;
  isMobile?: boolean;
}

export default function RankedScreen({
  user, elo, wins, losses, draws, gamesPlayed, matchPhase, queueSize, opponentName, error,
  onFindMatch, onCancelSearch, onBack, onEnterLobby, onLeaveLobby, isMobile,
}: Props) {
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [lobbyCount, setLobbyCount] = useState<number | null>(null);
  const [showRankInfo, setShowRankInfo] = useState(false);
  const rankCol = getRankColor(elo);
  const rankLabel = getRankLabel(elo);
  const rankIcon = getRankIcon(elo);

  const isSearching = matchPhase === 'queuing';
  const isConnecting = matchPhase === 'connecting';
  const isInQueue = isSearching || isConnecting;

  // Connect presence WebSocket on mount, disconnect on unmount
  useEffect(() => {
    onEnterLobby();
    return () => onLeaveLobby();
  }, []);

  // Poll lobby count via HTTP
  useEffect(() => {
    let active = true;
    async function fetchLobby() {
      try {
        const res = await fetch(`${SERVER_URL}/api/lobby`);
        if (res.ok && active) {
          const data = await res.json();
          setLobbyCount(data.count);
        }
      } catch (err) {
        console.error('Lobby fetch failed:', err);
      }
    }
    fetchLobby();
    const interval = setInterval(fetchLobby, 3000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // If searching or connecting, show the search overlay
  if (isInQueue) {
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
        {/* Animated glow */}
        <div style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 350, height: 350, borderRadius: '50%',
          background: isConnecting
            ? `radial-gradient(circle, ${C.p2}30 0%, transparent 55%)`
            : `radial-gradient(circle, ${C.p2}18 0%, transparent 60%)`,
          filter: 'blur(50px)',
          animation: isConnecting ? 'none' : 'pulse 2s ease-in-out infinite',
        }} />

        {isConnecting ? (
          <>
            {/* Match Found state */}
            <div style={{
              zIndex: 1, fontFamily: 'monospace', fontSize: 12, fontWeight: 900,
              letterSpacing: 5, color: C.p2,
              textShadow: `0 0 16px ${C.p2}88`,
            }}>MATCH FOUND</div>
            <div style={{
              zIndex: 1, fontFamily: "'Courier New', monospace",
              fontSize: 20, fontWeight: 900, color: C.white,
              marginTop: 4,
            }}>{opponentName}</div>
            <div style={{
              zIndex: 1, fontFamily: 'monospace', fontSize: 9,
              letterSpacing: 3, color: C.text, marginTop: 8,
            }}>CONNECTING...</div>
          </>
        ) : (
          <>
            {/* Searching state */}
            <div style={{
              zIndex: 1, fontFamily: 'monospace', fontSize: 12, fontWeight: 900,
              letterSpacing: 5, color: C.white,
            }}>SEARCHING</div>

            {/* Pulsing ring animation */}
            <div style={{
              zIndex: 1, position: 'relative',
              width: 80, height: 80,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                border: `2px solid ${C.p2}44`,
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute', inset: -8,
                border: `1px solid ${C.p2}22`,
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite 0.3s',
              }} />
              <div style={{
                position: 'absolute', inset: -16,
                border: `1px solid ${C.p2}11`,
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite 0.6s',
              }} />
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: C.p2, boxShadow: `0 0 12px ${C.p2}`,
              }} />
            </div>

            {/* Wait timer */}
            <SearchTimer />

            {/* Queue size */}
            <div style={{
              zIndex: 1, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#22cc44', boxShadow: '0 0 6px #22cc44',
              }} />
              <span style={{
                fontFamily: 'monospace', fontSize: 9, color: C.text, opacity: 0.8,
              }}>{queueSize} in queue</span>
            </div>

            {/* Cancel button */}
            <button onClick={onCancelSearch} style={{
              zIndex: 1, padding: '14px 48px', marginTop: 8,
              background: C.panel,
              border: `2px solid ${C.text}44`,
              borderRadius: 5, cursor: 'pointer',
              fontFamily: 'monospace', fontSize: 13, fontWeight: 900,
              letterSpacing: 4, color: C.white,
            }}>CANCEL</button>
          </>
        )}

        {/* Error display */}
        {error && (
          <div style={{
            zIndex: 1, fontFamily: 'monospace', fontSize: 10,
            color: '#ff6b6b', textAlign: 'center', maxWidth: 300,
          }}>{error}</div>
        )}

        {/* CSS animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.05); }
          }
        `}</style>
      </div>
    );
  }

  // Normal ranked screen (not searching)
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

      {/* Header: ELO + rank (left) | stats (right) */}
      <div style={{
        zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 24, width: isMobile ? '100%' : 380, maxWidth: 420,
      }}>
        {/* Left: ELO + rank */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{
            fontFamily: 'monospace', fontSize: 9, letterSpacing: 5, color: C.white,
          }}>RANKED MODE</div>
          <div style={{
            fontFamily: "'Courier New', monospace", fontSize: 36, fontWeight: 900,
            color: C.white, marginTop: 4,
          }}>{elo}</div>
          <div
            onClick={() => setShowRankInfo(!showRankInfo)}
            style={{
              fontFamily: 'monospace', fontSize: 10, letterSpacing: 3,
              fontWeight: 900, color: rankCol, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            <span style={{ fontSize: 14 }}>{rankIcon}</span>
            {rankLabel}
          </div>

        </div>

        {/* Divider */}
        <div style={{
          width: 1, height: 50, background: `${C.border}`,
        }} />

        {/* Right: stats */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'monospace', fontSize: 9, letterSpacing: 4, color: C.text, opacity: 0.5,
          }}>GAMES</div>
          <div style={{
            fontFamily: "'Courier New', monospace", fontSize: 24, fontWeight: 900,
            color: C.white, marginTop: 2,
          }}>{gamesPlayed}</div>
          <div style={{
            fontFamily: 'monospace', fontSize: 11, color: C.text, marginTop: 4,
            display: 'flex', gap: 8, justifyContent: 'center',
          }}>
            <span style={{ color: '#22cc44' }}>{wins}W</span>
            <span style={{ color: '#ff4466' }}>{losses}L</span>
            {draws > 0 && <span style={{ color: C.text }}>{draws}D</span>}
          </div>
          {gamesPlayed > 0 && (
            <div style={{
              fontFamily: 'monospace', fontSize: 9, color: C.text, opacity: 0.4, marginTop: 2,
            }}>{Math.round((wins / gamesPlayed) * 100)}% win rate</div>
          )}
        </div>
      </div>

      {/* Find Match button */}
      <button onClick={onFindMatch} style={{
        zIndex: 1, padding: '14px 48px',
        background: C.bg,
        border: `2px solid ${C.p2}`,
        borderRadius: 5, cursor: 'pointer',
        fontFamily: 'monospace', fontSize: 13, fontWeight: 900,
        letterSpacing: 4, color: C.white,
        boxShadow: `0 0 12px ${C.p2}44, 0 0 24px ${C.p2}18`,
      }}>FIND MATCH</button>

      {/* Lobby count */}
      <div style={{
        zIndex: 1, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: lobbyCount && lobbyCount > 0 ? '#22cc44' : C.text,
          boxShadow: lobbyCount && lobbyCount > 0 ? '0 0 6px #22cc44' : 'none',
        }} />
        <span style={{
          fontFamily: 'monospace', fontSize: 9, color: C.white,
        }}>
          {lobbyCount !== null ? `${lobbyCount} online` : 'connecting...'}
        </span>
        <button onClick={() => {
          setLobbyCount(null);
          fetch(`${SERVER_URL}/api/lobby`).then(r => r.json()).then(d => setLobbyCount(d.count)).catch(() => {});
        }} style={{
          background: 'none', border: `1px solid ${C.border}`,
          borderRadius: 3, padding: '2px 8px', cursor: 'pointer',
          fontFamily: 'monospace', fontSize: 8, color: C.white, letterSpacing: 1,
          marginLeft: 4,
        }}>↻</button>
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          zIndex: 1, fontFamily: 'monospace', fontSize: 10,
          color: '#ff6b6b', textAlign: 'center', maxWidth: 300,
        }}>{error}</div>
      )}

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
        maxHeight: 260,
        overflowY: 'auto',
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: 16,
        boxSizing: 'border-box',
      }}>
        {tab === 'leaderboard' ? <LeaderboardTab /> : <HistoryTab userId={user.uid} />}
      </div>

      {/* Rank info modal */}
      {showRankInfo && (
        <div
          onClick={() => setShowRankInfo(false)}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5,5,8,0.8)',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.panel, border: `1.5px solid ${C.border}`,
              borderRadius: 8, padding: '20px 24px',
              minWidth: 220, boxShadow: '0 4px 30px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{
              fontFamily: 'monospace', fontSize: 10, letterSpacing: 4,
              color: C.white, textAlign: 'center', marginBottom: 14,
            }}>RANK TIERS</div>
            {RANK_TIERS.map((tier) => {
              const isCurrentTier = rankLabel === tier.label;
              return (
                <div key={tier.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 4px',
                  background: isCurrentTier ? `${tier.color}15` : 'transparent',
                  borderRadius: 4,
                }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{tier.icon}</span>
                  <span style={{
                    fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                    color: tier.color, letterSpacing: 2, flex: 1,
                  }}>{tier.label}</span>
                  <span style={{
                    fontFamily: 'monospace', fontSize: 11, color: C.text, opacity: 0.6,
                  }}>{tier.range}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Live search timer showing mm:ss */
function SearchTimer() {
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    setSeconds(0);
    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div style={{
      zIndex: 1, fontFamily: "'Courier New', monospace",
      fontSize: 24, fontWeight: 900,
      color: C.white, letterSpacing: 2,
    }}>{display}</div>
  );
}

function LeaderboardTab() {
  const [entries, setEntries] = useState<(UserProfile & { id: string })[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    getLeaderboard(10).then(setEntries).catch((err) => {
      console.error('Leaderboard fetch failed:', err);
      setFetchError(err?.message || String(err));
      setEntries([]);
    });
  }, []);

  if (entries === null) {
    return <div style={{ fontFamily: 'monospace', fontSize: 9, color: C.text, textAlign: 'center', padding: 20 }}>Loading...</div>;
  }

  if (entries.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 120, gap: 8,
      }}>
        {fetchError ? (
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#ff6b6b', textAlign: 'center', lineHeight: 1.6, padding: '0 8px' }}>
            Leaderboard error:<br />{fetchError}
          </div>
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.text, opacity: 0.5, textAlign: 'center', lineHeight: 1.6 }}>
            No ranked matches yet.<br />Play matches to appear here.
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {entries.map((entry, i) => {
        const rankCol = getRankColor(entry.elo);
        return (
          <div key={entry.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 8px',
            background: i === 0 ? `${C.p2}0c` : 'transparent',
            borderRadius: 4,
          }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 11, fontWeight: 900,
              color: i < 3 ? C.p2 : C.text, width: 20, textAlign: 'right',
            }}>#{i + 1}</span>
            <span style={{
              fontFamily: 'monospace', fontSize: 10, color: C.white,
              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{entry.displayName}</span>
            <span style={{
              fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: rankCol,
            }}>{entry.elo}</span>
            <span style={{
              fontFamily: 'monospace', fontSize: 8, color: C.text, opacity: 0.5,
            }}>{entry.wins}W {entry.losses}L</span>
          </div>
        );
      })}
    </div>
  );
}

function HistoryTab({ userId }: { userId: string }) {
  const [matches, setMatches] = useState<MatchRecord[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    getMatchHistory(userId, 10).then(setMatches).catch((err) => {
      console.error('History fetch failed:', err);
      setFetchError(err?.message || String(err));
      setMatches([]);
    });
  }, [userId]);

  if (matches === null) {
    return <div style={{ fontFamily: 'monospace', fontSize: 9, color: C.text, textAlign: 'center', padding: 20 }}>Loading...</div>;
  }

  if (matches.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 120, gap: 8,
      }}>
        {fetchError ? (
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#ff6b6b', textAlign: 'center', lineHeight: 1.6, padding: '0 8px' }}>
            History error:<br />{fetchError}
          </div>
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.text, opacity: 0.5, textAlign: 'center', lineHeight: 1.6 }}>
            No matches played yet.<br />Find a match to get started.
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {matches.map((m, i) => {
        const isP1 = m.p1Id === userId;
        const myScore = isP1 ? m.p1Score : m.p2Score;
        const oppScore = isP1 ? m.p2Score : m.p1Score;
        const oppName = isP1 ? m.p2Name : m.p1Name;
        const eloChange = isP1 ? m.p1EloChange : m.p2EloChange;
        const won = (isP1 && m.winner === 1) || (!isP1 && m.winner === 2);
        const lost = (isP1 && m.winner === 2) || (!isP1 && m.winner === 1);
        const resultText = won ? 'WIN' : lost ? 'LOSS' : 'DRAW';
        const resultColor = won ? '#22cc44' : lost ? '#ff4466' : C.text;

        return (
          <div key={m.id ?? i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 8px',
            borderRadius: 4,
            background: won ? '#22cc4408' : lost ? '#ff446608' : 'transparent',
          }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 9, fontWeight: 900,
              color: resultColor, width: 32,
            }}>{resultText}</span>
            <span style={{
              fontFamily: 'monospace', fontSize: 10, color: C.white,
              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>vs {oppName}</span>
            <span style={{
              fontFamily: 'monospace', fontSize: 9, color: C.text, opacity: 0.6,
            }}>{myScore}-{oppScore}</span>
            {m.durationMs != null && (
              <span style={{
                fontFamily: 'monospace', fontSize: 8, color: C.text, opacity: 0.4,
              }}>{formatDuration(m.durationMs)}</span>
            )}
            <span style={{
              fontFamily: 'monospace', fontSize: 9, fontWeight: 700,
              color: eloChange >= 0 ? '#22cc44' : '#ff4466',
            }}>{eloChange >= 0 ? '+' : ''}{eloChange}</span>
          </div>
        );
      })}
    </div>
  );
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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

function getRankIcon(elo: number): string {
  if (elo >= 2200) return '\u{1F48E}'; // 💎
  if (elo >= 1800) return '\u{2B50}';  // ⭐
  if (elo >= 1400) return '\u{1F451}'; // 👑
  if (elo >= 1000) return '\u{1F6E1}'; // 🛡
  return '\u{1F530}';                  // 🔰
}

const RANK_TIERS = [
  { label: 'DIAMOND',  icon: '\u{1F48E}', color: '#b9f2ff', range: '2200+' },
  { label: 'PLATINUM', icon: '\u{2B50}',  color: '#e5e4e2', range: '1800-2199' },
  { label: 'GOLD',     icon: '\u{1F451}', color: '#ffd700', range: '1400-1799' },
  { label: 'SILVER',   icon: '\u{1F6E1}', color: '#c0c0c0', range: '1000-1399' },
  { label: 'BRONZE',   icon: '\u{1F530}', color: '#cd7f32', range: '0-999' },
];
