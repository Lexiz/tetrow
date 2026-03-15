import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../../../shared/theme';
import { APP_VERSION } from '../../../shared/version';
import TetrowLogo from '../components/TetrowLogo';

interface Props {
  onSignIn: () => void;
  loading: boolean;
  error: string | null;
}

export default function LoginScreen({ onSignIn, loading, error }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Ambient glow */}
      <View style={[styles.glow, { top: '18%', left: '24%', backgroundColor: C.p1 + '18' }]} />
      <View style={[styles.glow, { top: '62%', left: '68%', backgroundColor: C.p2 + '18' }]} />

      {/* Top spacer */}
      <View style={{ flex: 1 }} />

      {/* Logo + tagline */}
      <View style={styles.titleContainer}>
        <TetrowLogo size={64} />
        <Text style={styles.tagline}>TWO PLAYERS · ONE BOARD</Text>
      </View>

      {/* Middle spacer */}
      <View style={{ flex: 0.6 }} />

      {/* Sign in button */}
      {loading ? (
        <ActivityIndicator color={C.p1} size="large" />
      ) : (
        <TouchableOpacity onPress={onSignIn} style={styles.signInBtn}>
          <Text style={styles.signInText}>SIGN IN WITH GOOGLE</Text>
        </TouchableOpacity>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Bottom spacer */}
      <View style={{ flex: 1 }} />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <Text style={styles.footer}>COMPETITIVE TETROW · RANKED MATCHES · LEADERBOARDS</Text>
        <Text style={styles.termsText}>TERMS OF SERVICE | PRIVACY POLICY</Text>
        <Text style={styles.versionText}>v{APP_VERSION}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    padding: 16,
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  titleContainer: {
    alignItems: 'center',
    zIndex: 1,
    gap: 16,
  },
  tagline: {
    fontFamily: 'Courier',
    fontSize: 9,
    letterSpacing: 3,
    color: C.white,
    opacity: 0.7,
  },
  signInBtn: {
    zIndex: 1,
    paddingVertical: 14,
    paddingHorizontal: 36,
    backgroundColor: C.bg,
    borderWidth: 2,
    borderColor: 'rgba(255,200,140,0.45)',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signInText: {
    fontFamily: 'Courier',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
    color: C.white,
  },
  error: {
    zIndex: 1,
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#ff6b6b',
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 12,
  },
  bottomSection: {
    zIndex: 1,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  footer: {
    fontFamily: 'Courier',
    fontSize: 8,
    letterSpacing: 3,
    color: C.text,
    opacity: 0.7,
  },
  termsText: {
    fontFamily: 'Courier',
    fontSize: 8,
    letterSpacing: 2,
    color: C.text,
    opacity: 0.4,
  },
  versionText: {
    fontFamily: 'Courier',
    fontSize: 8,
    letterSpacing: 2,
    color: C.text,
    opacity: 0.3,
  },
});
