import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AiDifficulty } from '../../../shared/game/ai';
import type { PlayerStats } from '../../../shared/game/engine';
import { C } from '../../../shared/theme';
import { getPracticeHistory, type PracticeRecord } from '../firestore';

type Tab = 'play' | 'history';

interface Props {
  userId: string;
  onSelect: (difficulty: AiDifficulty) => void;
  onBack: () => void;
}

/** Single column icon (2 blocks vertical) for EASY */
function EasyIcon() {
  const s = 6;
  const g = 1.5;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: s, height: s, backgroundColor: C.p1, borderRadius: 1 }} />
      <View style={{ width: s, height: s, backgroundColor: C.p1, borderRadius: 1, marginTop: g }} />
    </View>
  );
}

/** L-piece icon for MEDIUM */
function MediumIcon() {
  const s = 6;
  const g = 1.5;
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: g }}>
        <View style={{ width: s, height: s, backgroundColor: C.p1, borderRadius: 1 }} />
        <View style={{ width: s, height: s, opacity: 0 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: g, marginTop: g }}>
        <View style={{ width: s, height: s, backgroundColor: C.p1, borderRadius: 1 }} />
        <View style={{ width: s, height: s, opacity: 0 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: g, marginTop: g }}>
        <View style={{ width: s, height: s, backgroundColor: C.p1, borderRadius: 1 }} />
        <View style={{ width: s, height: s, backgroundColor: C.p1, borderRadius: 1 }} />
      </View>
    </View>
  );
}

/** T-piece icon for HARD */
function HardIcon() {
  const s = 6;
  const g = 1.5;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: g }}>
        <View style={{ width: s, height: s, backgroundColor: C.p1, borderRadius: 1 }} />
        <View style={{ width: s, height: s, backgroundColor: C.p1, borderRadius: 1 }} />
        <View style={{ width: s, height: s, backgroundColor: C.p1, borderRadius: 1 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: g, marginTop: g }}>
        <View style={{ width: s, height: s, opacity: 0 }} />
        <View style={{ width: s, height: s, backgroundColor: C.p1, borderRadius: 1 }} />
        <View style={{ width: s, height: s, opacity: 0 }} />
      </View>
    </View>
  );
}

const iconMap: Record<AiDifficulty, React.FC> = {
  easy: EasyIcon,
  medium: MediumIcon,
  hard: HardIcon,
};

const difficulties: { key: AiDifficulty; label: string; desc: string }[] = [
  { key: 'easy', label: 'EASY', desc: 'Relaxed pace, learns the basics' },
  { key: 'medium', label: 'MEDIUM', desc: 'Balanced challenge' },
  { key: 'hard', label: 'HARD', desc: 'Fast and strategic' },
];

export default function DifficultyScreen({ userId, onSelect, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('play');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom }]}>
      {/* Back button */}
      <TouchableOpacity onPress={onBack} style={[styles.backBtn, { top: insets.top + 16 }]}>
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>

      {/* Ambient glow */}
      <View style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PRACTICE</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['play', 'history'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'play' ? 'PLAY' : 'HISTORY'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {tab === 'play' ? (
        <View style={styles.buttons}>
          {difficulties.map(({ key, label, desc }) => {
            const Icon = iconMap[key];
            return (
              <TouchableOpacity
                key={key}
                onPress={() => onSelect(key)}
                style={styles.diffButton}
              >
                <View style={styles.diffInner}>
                  <Icon />
                  <View>
                    <Text style={styles.diffLabel}>{label}</Text>
                    <Text style={styles.diffDesc}>{desc}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.historyContainer}>
          <PracticeHistoryTab userId={userId} />
        </View>
      )}
    </View>
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
    return <Text style={styles.loadingText}>Loading...</Text>;
  }
  if (records.length === 0) {
    return <Text style={styles.emptyText}>No practice games yet.{'\n'}Play a game to see your history.</Text>;
  }

  return (
    <ScrollView>
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
          <View key={rowId}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setExpandedId(isExpanded ? null : rowId)}
              style={[styles.historyRow, {
                backgroundColor: won ? '#22cc4408' : lost ? '#ff446608' : 'transparent',
              }]}
            >
              <Text style={{ fontFamily: 'Courier', fontSize: 8, color: C.text, opacity: 0.5, width: 10 }}>
                {isExpanded ? '\u25BC' : '\u25B6'}
              </Text>
              <Text style={[styles.historyResult, { color: resultColor }]}>{resultText}</Text>
              <Text style={[styles.historyDiff, { color: diffColor }]}>{diffLabel}</Text>
              <Text style={styles.historyScore}>{r.myScore}-{r.aiScore}</Text>
              <Text style={styles.historyDuration}>{formatDuration(r.durationMs)}</Text>
            </TouchableOpacity>
            {isExpanded && (
              <View style={styles.matchDetails}>
                <View style={[styles.detailHeaderRow, { paddingLeft: 56 }]}>
                  <Text style={styles.detailHeader}>YOU</Text>
                  <Text style={styles.detailHeader}>AI</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>PIECES</Text>
                  <Text style={styles.detailVal}>{r.myStats?.piecesPlaced ?? '-'}</Text>
                  <Text style={styles.detailVal}>{r.aiStats?.piecesPlaced ?? '-'}</Text>
                </View>
                {(['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD'] as const).map((label, idx) => (
                  <View key={label} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{label}</Text>
                    <Text style={styles.detailVal}>{r.myStats?.clears[idx] ?? 0}</Text>
                    <Text style={styles.detailVal}>{r.aiStats?.clears[idx] ?? 0}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    gap: 24,
    padding: 16,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  backText: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: C.white,
    letterSpacing: 1,
  },
  glow: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: C.p1 + '14',
  },
  header: {
    zIndex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Courier',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    color: C.p1,
  },
  tabRow: {
    zIndex: 1,
    flexDirection: 'row',
    width: '100%',
    maxWidth: 360,
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
    borderBottomColor: C.p1,
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
  buttons: {
    zIndex: 1,
    width: '100%',
    maxWidth: 360,
    gap: 12,
    paddingHorizontal: 24,
  },
  diffButton: {
    padding: 20,
    backgroundColor: '#080812',
    borderWidth: 1.5,
    borderColor: C.p1 + '44',
    borderRadius: 6,
  },
  diffInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 8,
  },
  diffLabel: {
    fontFamily: 'Courier',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
    color: C.p1,
  },
  diffDesc: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: C.text,
    opacity: 0.5,
    marginTop: 4,
  },
  historyContainer: {
    zIndex: 1,
    width: '100%',
    maxWidth: 360,
    minHeight: 200,
    maxHeight: 300,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 16,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  historyResult: { fontFamily: 'Courier', fontSize: 9, fontWeight: '900', width: 32 },
  historyDiff: { fontFamily: 'Courier', fontSize: 8, fontWeight: '700', width: 48 },
  historyScore: { fontFamily: 'Courier', fontSize: 9, color: C.white, flex: 1 },
  historyDuration: { fontFamily: 'Courier', fontSize: 8, color: C.text, opacity: 0.4 },
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
  emptyText: { fontFamily: 'Courier', fontSize: 10, color: C.text, opacity: 0.5, textAlign: 'center', padding: 20, lineHeight: 18 },
});
