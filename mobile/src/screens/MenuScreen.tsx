import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../../../shared/theme';
import { APP_VERSION } from '../../../shared/version';
import TetrowLogo from '../components/TetrowLogo';

interface Props {
  onWarmUp: () => void;
  onRanked: () => void;
  onSignOut: () => void;
  displayName: string;
  photoURL: string | null;
  elo: number;
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

/** Small L-piece icon for Warm Up button */
function LPieceIcon() {
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

/** Blocks + medal icon for Play Ranked button */
function RankedIcon() {
  const s = 6;
  const g = 1.5;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: g }}>
        <View style={{ width: s, height: s, backgroundColor: C.p2, borderRadius: 1 }} />
        <View style={{ width: s, height: s, backgroundColor: C.p2, borderRadius: 1 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: g, marginTop: g }}>
        <View style={{ width: s, height: s, backgroundColor: C.p2, borderRadius: 1 }} />
        <View style={{ width: s, height: s, backgroundColor: C.p2, borderRadius: 1 }} />
      </View>
      <Text style={{ fontSize: 10, marginTop: 1 }}>🏅</Text>
    </View>
  );
}

export default function MenuScreen({ onWarmUp, onRanked, onSignOut, displayName, photoURL, elo }: Props) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const rankCol = getRankColor(elo);
  const rankLabel = getRankLabel(elo);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Ambient glow */}
      <View style={[styles.glow, { top: '15%', left: '20%', backgroundColor: C.p1 + '18' }]} />
      <View style={[styles.glow, { top: '65%', left: '70%', backgroundColor: C.p2 + '18' }]} />

      {/* Account menu (top-right) */}
      <View style={[styles.accountArea, { top: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.accountBtn}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatar} />
          ) : null}
          <Text style={styles.accountName} numberOfLines={1}>{displayName}</Text>
        </TouchableOpacity>

        {menuOpen && (
          <>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => setMenuOpen(false)}
              activeOpacity={1}
            />
            <View style={styles.dropdown}>
              <View style={styles.dropdownElo}>
                <Text style={[styles.rankText, { color: rankCol }]}>{rankLabel}</Text>
                <Text style={styles.eloText}>{elo} ELO</Text>
              </View>
              <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn}>
                <Text style={styles.signOutText}>SIGN OUT</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <TetrowLogo size={48} />
        <Text style={styles.subtitle}>COMPETITIVE TETROW</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity onPress={onWarmUp} style={[styles.button, { borderColor: C.p1 + '44' }]}>
          <View style={styles.buttonInner}>
            <LPieceIcon />
            <View>
              <Text style={[styles.buttonTitle, { color: C.p1 }]}>WARM UP</Text>
              <Text style={styles.buttonDesc}>Practice against AI</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={onRanked} style={[styles.button, { borderColor: C.p2 + '44' }]}>
          <View style={styles.buttonInner}>
            <RankedIcon />
            <View>
              <Text style={[styles.buttonTitle, { color: C.p2 }]}>PLAY RANKED</Text>
              <Text style={styles.buttonDesc}>Compete for ELO</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <Text style={styles.termsText}>TERMS OF SERVICE | PRIVACY POLICY</Text>
        <Text style={styles.footer}>TETROW · v{APP_VERSION}</Text>
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
    gap: 32,
    padding: 16,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  accountArea: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  accountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
  },
  accountName: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: C.text,
    fontWeight: '700',
    maxWidth: 120,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
    minWidth: 140,
    zIndex: 20,
  },
  dropdownElo: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rankText: {
    fontFamily: 'Courier',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '900',
  },
  eloText: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: C.text,
    opacity: 0.6,
  },
  signOutBtn: {
    padding: 10,
  },
  signOutText: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: C.white,
    letterSpacing: 1,
  },
  titleContainer: {
    alignItems: 'center',
    zIndex: 1,
    gap: 12,
  },
  subtitle: {
    fontFamily: 'Courier',
    fontSize: 9,
    letterSpacing: 5,
    color: C.white,
    opacity: 0.7,
  },
  buttons: {
    zIndex: 1,
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  button: {
    padding: 20,
    backgroundColor: '#080812',
    borderWidth: 2,
    borderRadius: 8,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 8,
  },
  buttonTitle: {
    fontFamily: 'Courier',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  buttonDesc: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: C.white,
    opacity: 0.5,
    marginTop: 4,
  },
  footerContainer: {
    zIndex: 1,
    alignItems: 'center',
    gap: 6,
  },
  termsText: {
    fontFamily: 'Courier',
    fontSize: 8,
    letterSpacing: 2,
    color: C.text,
    opacity: 0.4,
  },
  footer: {
    fontFamily: 'Courier',
    fontSize: 8,
    letterSpacing: 3,
    color: C.white,
  },
});
