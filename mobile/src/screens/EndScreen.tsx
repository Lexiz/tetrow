import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../../../shared/theme';
import type { PlayerStats } from '../../../shared/game/engine';

interface Props {
  p1Score: number;
  p2Score: number;
  p1ToppedOut: boolean;
  p2ToppedOut: boolean;
  stats: [PlayerStats, PlayerStats];
  onRematch: () => void;
  onClose: () => void;
  p1Name?: string;
  p2Name?: string;
  p1EloChange?: number;
  p2EloChange?: number;
  rematchWaiting?: boolean;
  forfeit?: 1 | 2 | null;
  rematchButtonLabel?: string;
}

export default function EndScreen({
  p1Score, p2Score, p1ToppedOut, p2ToppedOut, stats, onRematch, onClose,
  p1Name, p2Name, p1EloChange, p2EloChange, rematchWaiting, forfeit,
  rematchButtonLabel = 'REMATCH',
}: Props) {
  const insets = useSafeAreaInsets();
  const isRanked = !!(p1Name || p2Name);
  const winner: 1 | 2 | null = forfeit
    ? (forfeit === 1 ? 2 : 1)
    : p1Score > p2Score ? 1 : p2Score > p1Score ? 2 : null;
  const winCol = winner === 1 ? C.p1 : winner === 2 ? C.p2 : C.text;

  const players = [
    { n: 1 as const, name: p1Name || 'Player 1', final: p1Score, topped: p1ToppedOut, win: winner === 1, col: C.p1, brt: C.p1b, stat: stats[0], eloChange: p1EloChange },
    { n: 2 as const, name: p2Name || 'AI', final: p2Score, topped: p2ToppedOut, win: winner === 2, col: C.p2, brt: C.p2b, stat: stats[1], eloChange: p2EloChange },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      {/* Winner glow */}
      <View style={[styles.glow, { backgroundColor: winCol + '14' }]} />

      <Text style={styles.matchOver}>MATCH OVER</Text>

      <Text style={[styles.winnerText, { color: winCol }]}>
        {forfeit
          ? 'FORFEIT'
          : winner === 1
            ? (isRanked ? `${players[0].name.toUpperCase()} WINS` : 'YOU WIN')
            : winner === 2
              ? (isRanked ? `${players[1].name.toUpperCase()} WINS` : 'AI WINS')
              : 'DRAW'}
      </Text>

      {/* Score cards */}
      <View style={styles.cardsRow}>
        {players.map(({ n, name, final, topped, win, col, brt, stat, eloChange }) => {
          const opCol = n === 1 ? C.p2 : C.p1;
          return (
            <View key={n} style={[
              styles.card,
              {
                borderColor: win ? col : '#1a1a2c',
                backgroundColor: win ? col + '12' : C.panel,
              },
            ]}>
              <Text style={[styles.cardName, { color: col }]}>{name.toUpperCase()}</Text>

              <Text style={styles.cardScore}>{final.toLocaleString()}</Text>

              {win && <Text style={[styles.winBadge, { color: brt }]}>★ WINNER</Text>}

              {eloChange !== undefined && (
                <Text style={[styles.eloChange, { color: eloChange >= 0 ? '#22cc44' : '#ff4466' }]}>
                  {eloChange >= 0 ? '+' : ''}{eloChange} ELO
                </Text>
              )}

              {/* Score breakdown */}
              <View style={[styles.breakdown, { borderTopColor: col + '33' }]}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.dimLabel}>Clear pts</Text>
                  <Text style={[styles.breakdownVal, { color: col }]}>+{stat.basePoints}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.dimLabel}>Bonus pts</Text>
                  <Text style={[styles.breakdownVal, { color: opCol }]}>+{stat.bonusPoints}</Text>
                </View>
              </View>

              {/* Line clears */}
              <View style={[styles.linesSection, { borderTopColor: col + '33' }]}>
                <Text style={styles.linesTitle}>LINES CLEARED</Text>
                <View style={styles.linesGrid}>
                  {(['4', '3', '2', '1'] as const).map((label, i) => {
                    const count = stat.clears[3 - i];
                    return (
                      <View key={label} style={styles.lineItem}>
                        <Text style={styles.lineLabel}>{label}L</Text>
                        <Text style={[styles.lineCount, {
                          color: count > 0 ? col : C.dim,
                        }]}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={onRematch} style={[styles.rematchBtn, rematchWaiting && { opacity: 0.5 }]} disabled={rematchWaiting}>
          <Text style={styles.rematchText}>{rematchWaiting ? 'WAITING...' : rematchButtonLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>{isRanked ? 'MENU' : 'CLOSE'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: 12,
  },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 380,
    height: 380,
    borderRadius: 190,
  },
  matchOver: {
    fontFamily: 'Courier',
    fontSize: 9,
    letterSpacing: 7,
    color: C.dim,
    zIndex: 1,
  },
  winnerText: {
    fontFamily: 'Courier',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
    zIndex: 1,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    zIndex: 1,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 14,
    width: 160,
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    fontFamily: 'Courier',
    fontSize: 10,
    letterSpacing: 2,
  },
  cardScore: {
    fontFamily: 'Courier',
    fontSize: 28,
    fontWeight: '900',
    color: C.white,
  },
  winBadge: {
    fontFamily: 'Courier',
    fontSize: 8,
    letterSpacing: 3,
    marginBottom: 4,
  },
  eloChange: {
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  breakdown: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 5,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dimLabel: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: C.text,
    opacity: 0.5,
  },
  breakdownVal: {
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: '700',
  },
  linesSection: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  linesTitle: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: C.text,
    opacity: 0.5,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 6,
  },
  linesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  lineItem: {
    alignItems: 'center',
    gap: 2,
  },
  lineLabel: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: C.text,
    opacity: 0.4,
  },
  lineCount: {
    fontFamily: 'Courier',
    fontSize: 16,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    zIndex: 1,
  },
  rematchBtn: {
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderWidth: 1.5,
    borderColor: C.p2,
    borderRadius: 4,
  },
  rematchText: {
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    color: C.p2,
  },
  closeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 4,
  },
  closeText: {
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    color: C.text,
    opacity: 0.7,
  },
});
