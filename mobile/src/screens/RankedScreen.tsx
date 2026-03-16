import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../../../shared/theme';
import type { MatchPhase } from '../hooks/useMultiplayer';
import { getLeaderboard, getMatchHistory, type UserProfile, type MatchRecord } from '../firestore';

const SERVER_URL = 'https://tetchess-server.alex-lisitzky.workers.dev';

type Tab = 'leaderboard' | 'history';

interface Props {
  userId: string;
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
}

export default function RankedScreen({
  userId, elo, wins, losses, draws, gamesPlayed, matchPhase, queueSize,
  opponentName, error, onFindMatch, onCancelSearch, onBack, onEnterLobby, onLeaveLobby,
}: Props) {
  const insets = useSafeAreaInsets();
  const [lobbyCount, setLobbyCount] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('leaderboard');
  const rankCol = getRankColor(elo);
  const rankLabel = getRankLabel(elo);

  const isSearching = matchPhase === 'queuing';
  const isConnecting = matchPhase === 'connecting';
  const isInQueue = isSearching || isConnecting;

  useEffect(() => {
    onEnterLobby();
    return () => onLeaveLobby();
  }, []);

  useEffect(() => {
    let active = true;
    async function fetchLobby() {
      try {
        const res = await fetch(`${SERVER_URL}/api/lobby`);
        if (res.ok && active) {
          const data = await res.json();
          setLobbyCount(data.count);
        }
      } catch {}
    }
    fetchLobby();
    const interval = setInterval(fetchLobby, 3000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (isInQueue) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.glow} />
        {isConnecting ? (
          <>
            <Text style={[styles.searchTitle, { color: C.p2 }]}>MATCH FOUND</Text>
            <Text style={styles.opponentName}>{opponentName}</Text>
            <Text style={styles.connectingText}>CONNECTING...</Text>
          </>
        ) : (
          <>
            <Text style={styles.searchTitle}>SEARCHING</Text>
            <SearchTimer />
            <View style={styles.queueRow}>
              <View style={styles.queueDot} />
              <Text style={styles.queueText}>{queueSize} in queue</Text>
            </View>
            <TouchableOpacity onPress={onCancelSearch} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  const rankIcon = getRankIcon(elo);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom }]}>
      <TouchableOpacity onPress={onBack} style={[styles.backBtn, { top: insets.top + 16 }]}>
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>

      <View style={styles.glow} />

      {/* Spacer */}
      <View style={{ height: 32 }} />

      {/* Stats card */}
      <View style={styles.statsCard}>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.statsLabel}>MODE:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Text style={{ fontSize: 14 }}>{rankIcon}</Text>
            <Text style={[styles.statsRank, { color: rankCol }]}>{rankLabel}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.statsLabel}>ELO:</Text>
          <Text style={styles.statsElo}>{elo}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.statsLabel}>GAMES:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            <Text style={styles.statsElo}>{gamesPlayed}</Text>
            <Text style={{ fontFamily: 'Courier', fontSize: 9, color: C.text }}>
              (<Text style={{ color: '#22cc44' }}>{wins}W</Text> <Text style={{ color: '#ff4466' }}>{losses}L</Text>)
            </Text>
          </View>
        </View>
      </View>

      {/* Find Match button */}
      <TouchableOpacity onPress={onFindMatch} style={styles.findBtn}>
        <Text style={styles.findText}>FIND MATCH</Text>
      </TouchableOpacity>

      {/* Lobby count */}
      <View style={styles.queueRow}>
        <View style={[styles.queueDot, {
          backgroundColor: lobbyCount && lobbyCount > 0 ? '#22cc44' : C.text,
        }]} />
        <Text style={styles.queueText}>
          {lobbyCount !== null ? `${lobbyCount} online` : 'connecting...'}
        </Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['leaderboard', 'history'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={styles.tabContent}>
        {tab === 'leaderboard' ? <LeaderboardTab /> : <HistoryTab userId={userId} />}
      </View>
    </View>
  );
}

function SearchTimer() {
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <Text style={styles.timerText}>{mins}:{secs.toString().padStart(2, '0')}</Text>
  );
}

function LeaderboardTab() {
  const [entries, setEntries] = useState<(UserProfile & { id: string })[] | null>(null);

  useEffect(() => {
    getLeaderboard(10).then(setEntries).catch(() => setEntries([]));
  }, []);

  if (entries === null) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }
  if (entries.length === 0) {
    return <Text style={styles.emptyText}>No ranked matches yet</Text>;
  }

  return (
    <ScrollView>
      {entries.map((entry, i) => (
        <View key={entry.id} style={[styles.leaderboardRow, i === 0 && { backgroundColor: C.p2 + '0c', borderRadius: 4 }]}>
          <Text style={[styles.rank, { color: i < 3 ? C.p2 : C.text }]}>#{i + 1}</Text>
          <Text style={styles.entryName} numberOfLines={1}>{entry.displayName}</Text>
          <Text style={[styles.entryElo, { color: getRankColor(entry.elo) }]}>{entry.elo}</Text>
          <Text style={styles.entryRecord}>{entry.wins}W {entry.losses}L</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function HistoryTab({ userId }: { userId: string }) {
  const [matches, setMatches] = useState<MatchRecord[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getMatchHistory(userId, 10).then(setMatches).catch(() => setMatches([]));
  }, [userId]);

  if (matches === null) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }
  if (matches.length === 0) {
    return <Text style={styles.emptyText}>No matches played yet</Text>;
  }

  return (
    <ScrollView>
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
        const rowId = m.id ?? String(i);
        const isExpanded = expandedId === rowId;
        const myStats = isP1 ? m.p1Stats : m.p2Stats;
        const oppStats = isP1 ? m.p2Stats : m.p1Stats;
        const hasStats = myStats && oppStats;

        return (
          <View key={rowId}>
            <TouchableOpacity
              activeOpacity={hasStats ? 0.7 : 1}
              onPress={() => hasStats && setExpandedId(isExpanded ? null : rowId)}
              style={[styles.historyRow, { backgroundColor: won ? '#22cc4408' : lost ? '#ff446608' : 'transparent' }]}
            >
              <Text style={{ fontFamily: 'Courier', fontSize: 8, color: C.text, opacity: hasStats ? 0.5 : 0, width: 10 }}>
                {isExpanded ? '\u25BC' : '\u25B6'}
              </Text>
              <Text style={[styles.historyResult, { color: resultColor }]}>{resultText}</Text>
              <Text style={styles.historyOpponent} numberOfLines={1}>vs {oppName}</Text>
              <Text style={styles.historyScore}>{myScore}-{oppScore}</Text>
              {m.durationMs != null && (
                <Text style={styles.historyDuration}>{formatDuration(m.durationMs)}</Text>
              )}
              <Text style={[styles.historyElo, { color: eloChange >= 0 ? '#22cc44' : '#ff4466' }]}>
                {eloChange >= 0 ? '+' : ''}{eloChange}
              </Text>
            </TouchableOpacity>
            {isExpanded && myStats && oppStats && (
              <View style={styles.matchDetails}>
                <View style={[styles.detailHeaderRow, { paddingLeft: 56 }]}>
                  <Text style={styles.detailHeader}>YOU</Text>
                  <Text style={styles.detailHeader}>OPP</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>PIECES</Text>
                  <Text style={styles.detailVal}>{myStats.piecesPlaced ?? '-'}</Text>
                  <Text style={styles.detailVal}>{oppStats.piecesPlaced ?? '-'}</Text>
                </View>
                {(['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD'] as const).map((label, idx) => (
                  <View key={label} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{label}</Text>
                    <Text style={styles.detailVal}>{myStats.clears[idx]}</Text>
                    <Text style={styles.detailVal}>{oppStats.clears[idx]}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
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
  if (elo >= 2200) return '💎';
  if (elo >= 1800) return '⭐';
  if (elo >= 1400) return '🏆';
  if (elo >= 1000) return '🛡';
  return '🥉';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  backText: { fontFamily: 'Courier', fontSize: 11, color: C.white, letterSpacing: 1 },
  glow: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: C.p2 + '14',
  },
  statsCard: {
    zIndex: 1,
    width: '100%',
    padding: 16,
    backgroundColor: '#080812',
    borderWidth: 2,
    borderColor: C.p2 + '44',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statsLabel: { fontFamily: 'Courier', fontSize: 7, letterSpacing: 2, color: C.white, opacity: 0.5 },
  statsRank: { fontFamily: 'Courier', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  statsElo: { fontFamily: 'Courier', fontSize: 22, fontWeight: '900', color: C.white, marginTop: 2 },
  findBtn: {
    zIndex: 1,
    width: '100%',
    paddingVertical: 18,
    backgroundColor: '#080812',
    borderWidth: 2,
    borderColor: C.p1,
    borderRadius: 0,
    alignItems: 'center',
  },
  findText: { fontFamily: 'Courier', fontSize: 15, fontWeight: '900', letterSpacing: 5, color: C.white },
  queueRow: { zIndex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  queueDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22cc44' },
  queueText: { fontFamily: 'Courier', fontSize: 12, color: C.white },
  cancelBtn: {
    zIndex: 1,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: 8,
    backgroundColor: C.panel,
    borderWidth: 2,
    borderColor: C.text + '44',
    borderRadius: 5,
  },
  cancelText: { fontFamily: 'Courier', fontSize: 13, fontWeight: '900', letterSpacing: 4, color: C.white },
  searchTitle: { zIndex: 1, fontFamily: 'Courier', fontSize: 12, fontWeight: '900', letterSpacing: 5, color: C.white },
  opponentName: { zIndex: 1, fontFamily: 'Courier', fontSize: 20, fontWeight: '900', color: C.white, marginTop: 4 },
  connectingText: { zIndex: 1, fontFamily: 'Courier', fontSize: 9, letterSpacing: 3, color: C.text, marginTop: 8 },
  timerText: { zIndex: 1, fontFamily: 'Courier', fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: 2 },
  error: { zIndex: 1, fontFamily: 'Courier', fontSize: 10, color: '#ff6b6b', textAlign: 'center', maxWidth: 300 },
  tabRow: {
    zIndex: 1,
    flexDirection: 'row',
    width: '100%',
    maxWidth: 380,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: C.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: C.panel,
    borderBottomColor: C.p2,
  },
  tabText: {
    fontFamily: 'Courier',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.text,
  },
  tabTextActive: {
    color: C.white,
  },
  tabContent: {
    zIndex: 1,
    width: '100%',
    maxWidth: 380,
    minHeight: 200,
    maxHeight: 260,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 16,
  },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, paddingHorizontal: 8 },
  rank: { fontFamily: 'Courier', fontSize: 11, fontWeight: '900', width: 28, textAlign: 'right' },
  entryName: { fontFamily: 'Courier', fontSize: 10, color: C.white, flex: 1 },
  entryElo: { fontFamily: 'Courier', fontSize: 10, fontWeight: '700' },
  entryRecord: { fontFamily: 'Courier', fontSize: 8, color: C.text, opacity: 0.5 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4 },
  historyResult: { fontFamily: 'Courier', fontSize: 9, fontWeight: '900', width: 32 },
  historyOpponent: { fontFamily: 'Courier', fontSize: 10, color: C.white, flex: 1 },
  historyScore: { fontFamily: 'Courier', fontSize: 9, color: C.text, opacity: 0.6 },
  historyDuration: { fontFamily: 'Courier', fontSize: 8, color: C.text, opacity: 0.4 },
  historyElo: { fontFamily: 'Courier', fontSize: 9, fontWeight: '700' },
  matchDetails: {
    marginLeft: 16, marginBottom: 6, marginTop: 2,
    paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: C.border + '22',
    borderRadius: 4,
    borderLeftWidth: 2, borderLeftColor: C.border,
  },
  detailHeaderRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  detailHeader: { fontFamily: 'Courier', fontSize: 7, color: C.text, opacity: 0.4, letterSpacing: 1, width: 36, textAlign: 'right' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailLabel: { fontFamily: 'Courier', fontSize: 8, color: C.text, opacity: 0.5, width: 52 },
  detailVal: { fontFamily: 'Courier', fontSize: 9, color: C.white, width: 36, textAlign: 'right' },
  loadingText: { fontFamily: 'Courier', fontSize: 9, color: C.text, textAlign: 'center', padding: 20 },
  emptyText: { fontFamily: 'Courier', fontSize: 10, color: C.text, opacity: 0.5, textAlign: 'center', padding: 20 },
});
