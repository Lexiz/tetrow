import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AiDifficulty } from '../../../shared/game/ai';
import { C } from '../../../shared/theme';

interface Props {
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

export default function DifficultyScreen({ onSelect, onBack }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Back button */}
      <TouchableOpacity onPress={onBack} style={[styles.backBtn, { top: insets.top + 16 }]}>
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>

      {/* Ambient glow */}
      <View style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>WARM UP</Text>
        <Text style={styles.headerTitle}>SELECT DIFFICULTY</Text>
      </View>

      {/* Difficulty buttons */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerLabel: {
    fontFamily: 'Courier',
    fontSize: 9,
    letterSpacing: 5,
    color: C.white,
  },
  headerTitle: {
    fontFamily: 'Courier',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    color: C.p1,
    marginTop: 6,
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
});
