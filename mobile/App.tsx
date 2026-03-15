import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { AiDifficulty } from '../shared/game/ai';
import type { PlayerStats } from '../shared/game/engine';
import type { Owner } from '../shared/types';
import { C } from '../shared/theme';
import { useAuth } from './src/hooks/useAuth';
import { useMultiplayer } from './src/hooks/useMultiplayer';
import { getOrCreateProfile, saveMyMatchResult, type UserProfile } from './src/firestore';
import LoginScreen from './src/screens/LoginScreen';
import MenuScreen from './src/screens/MenuScreen';
import DifficultyScreen from './src/screens/DifficultyScreen';
import GameScreen from './src/screens/GameScreen';
import EndScreen from './src/screens/EndScreen';
import RankedScreen from './src/screens/RankedScreen';
import MatchConfirmScreen from './src/screens/MatchConfirmScreen';
import MultiplayerGameScreen from './src/screens/MultiplayerGameScreen';

type Screen = 'login' | 'menu' | 'difficulty' | 'game' | 'end' | 'ranked' | 'match-confirm' | 'ranked-game' | 'ranked-end';

interface EndData {
  p1Score: number;
  p2Score: number;
  toppedOut: [boolean, boolean];
  stats: [PlayerStats, PlayerStats];
  p1Name?: string;
  p2Name?: string;
  p1EloChange?: number;
  p2EloChange?: number;
  forfeit?: Owner | null;
}

export default function App() {
  const { user, loading: authLoading, error: authError, signIn, signOut } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');
  const [difficulty, setDifficulty] = useState<AiDifficulty>('medium');
  const [endData, setEndData] = useState<EndData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [mpState, mpActions] = useMultiplayer();

  // Load profile when user signs in
  useEffect(() => {
    if (user) {
      setProfileLoading(true);
      getOrCreateProfile(user.uid, user.displayName || 'Player', user.photoURL)
        .then((p) => {
          setProfile(p);
          setScreen('menu');
        })
        .catch(() => setScreen('menu'))
        .finally(() => setProfileLoading(false));
    } else {
      setScreen('login');
      setProfile(null);
    }
  }, [user]);

  // Handle multiplayer phase transitions
  useEffect(() => {
    if (mpState.phase === 'confirming' || mpState.phase === 'countdown') {
      setScreen('match-confirm');
    }
    if (mpState.phase === 'playing') {
      setScreen('ranked-game');
    }
    if (mpState.phase === 'ended' && mpState.endResult) {
      const r = mpState.endResult;
      const myPlayer = mpState.myPlayer!;
      const isP1 = myPlayer === 1;

      // Save match result
      if (user && profile) {
        const oppElo = isP1 ? r.p2Elo : r.p1Elo;
        saveMyMatchResult(
          user.uid, user.displayName || 'Player', user.photoURL,
          myPlayer,
          isP1 ? r.p2Id : r.p1Id,
          isP1 ? r.p2Name : r.p1Name,
          oppElo,
          r.scores[0], r.scores[1], r.winner,
          r.matchId, r.durationMs,
        ).then(() => {
          // Refresh profile
          getOrCreateProfile(user.uid, user.displayName || 'Player', user.photoURL)
            .then(setProfile);
        }).catch(() => {});
      }

      // Calculate ELO changes for display
      const myElo = isP1 ? r.p1Elo : r.p2Elo;
      const oppElo = isP1 ? r.p2Elo : r.p1Elo;
      const iWon = r.winner === myPlayer;
      const iLost = r.winner !== null && r.winner !== myPlayer;
      const K = (profile?.gamesPlayed ?? 0) < 30 ? 32 : 16;
      const expected = 1 / (1 + Math.pow(10, (oppElo - myElo) / 400));
      const result = iWon ? 1 : iLost ? 0 : 0.5;
      const myChange = Math.round(K * (result - expected));
      const oppChange = -myChange;

      setEndData({
        p1Score: r.scores[0],
        p2Score: r.scores[1],
        toppedOut: r.toppedOut,
        stats: r.stats,
        p1Name: r.p1Name,
        p2Name: r.p2Name,
        p1EloChange: isP1 ? myChange : oppChange,
        p2EloChange: isP1 ? oppChange : myChange,
        forfeit: r.forfeit,
      });
      setScreen('ranked-end');
    }
    if (mpState.phase === 'confirm_timeout') {
      setScreen('match-confirm');
    }
  }, [mpState.phase]);

  const isLoading = authLoading || profileLoading;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={C.p1} size="large" />
          </View>
        )}

        {!isLoading && screen === 'login' && (
          <LoginScreen onSignIn={signIn} loading={false} error={authError} />
        )}

        {!isLoading && screen === 'menu' && (
          <MenuScreen
            onWarmUp={() => setScreen('difficulty')}
            onRanked={() => setScreen('ranked')}
            onSignOut={signOut}
            displayName={user?.displayName || 'Player'}
            photoURL={user?.photoURL || null}
            elo={profile?.elo ?? 1200}
          />
        )}

        {screen === 'difficulty' && (
          <DifficultyScreen
            onSelect={(d) => { setDifficulty(d); setScreen('game'); }}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'game' && (
          <GameScreen
            aiDifficulty={difficulty}
            onGameEnd={(p1Score, p2Score, toppedOut, stats) => {
              setEndData({ p1Score, p2Score, toppedOut, stats });
              setScreen('end');
            }}
            onQuit={() => setScreen('menu')}
          />
        )}

        {screen === 'end' && endData && (
          <EndScreen
            p1Score={endData.p1Score}
            p2Score={endData.p2Score}
            p1ToppedOut={endData.toppedOut[0]}
            p2ToppedOut={endData.toppedOut[1]}
            stats={endData.stats}
            rematchButtonLabel="PLAY AGAIN"
            onRematch={() => setScreen('game')}
            onClose={() => setScreen('menu')}
          />
        )}

        {screen === 'ranked' && (
          <RankedScreen
            userId={user!.uid}
            elo={profile?.elo ?? 1200}
            wins={profile?.wins ?? 0}
            losses={profile?.losses ?? 0}
            draws={profile?.draws ?? 0}
            gamesPlayed={profile?.gamesPlayed ?? 0}
            matchPhase={mpState.phase}
            queueSize={mpState.queueSize}
            opponentName={mpState.opponentName}
            error={mpState.error}
            onFindMatch={() => {
              if (user && profile) {
                mpActions.joinQueue(user.uid, user.displayName || 'Player', profile.elo);
              }
            }}
            onCancelSearch={mpActions.leaveQueue}
            onBack={() => { mpActions.reset(); setScreen('menu'); }}
            onEnterLobby={mpActions.connectLobby}
            onLeaveLobby={mpActions.disconnectLobby}
          />
        )}

        {screen === 'match-confirm' && (
          <MatchConfirmScreen
            confirmInfo={mpState.confirmInfo}
            countdownInfo={mpState.countdownInfo}
            phase={mpState.phase as 'confirming' | 'countdown' | 'confirm_timeout'}
            onConfirm={mpActions.confirm}
            onBack={() => { mpActions.reset(); setScreen('ranked'); }}
          />
        )}

        {screen === 'ranked-game' && mpState.myPlayer && (
          <MultiplayerGameScreen
            gameState={mpState.gameState}
            myPlayer={mpState.myPlayer}
            myName={user?.displayName || 'Player'}
            opponentName={mpState.opponentName || 'Opponent'}
            eloLoss={(() => {
              const myElo = profile?.elo ?? 1200;
              const oppElo = mpState.endResult ? (mpState.myPlayer === 1 ? mpState.endResult.p2Elo : mpState.endResult.p1Elo) : 1200;
              const K = (profile?.gamesPlayed ?? 0) < 30 ? 32 : 16;
              const expected = 1 / (1 + Math.pow(10, (oppElo - myElo) / 400));
              return Math.round(K * expected);
            })()}
            sendAction={mpActions.sendAction}
            onGameEnd={(p1Score, p2Score, toppedOut, stats) => {
              setEndData({ p1Score, p2Score, toppedOut, stats });
            }}
            onQuit={() => { mpActions.quit(); setScreen('menu'); }}
          />
        )}

        {screen === 'ranked-end' && endData && (
          <EndScreen
            p1Score={endData.p1Score}
            p2Score={endData.p2Score}
            p1ToppedOut={endData.toppedOut[0]}
            p2ToppedOut={endData.toppedOut[1]}
            stats={endData.stats}
            p1Name={endData.p1Name}
            p2Name={endData.p2Name}
            p1EloChange={endData.p1EloChange}
            p2EloChange={endData.p2EloChange}
            onRematch={() => { mpActions.rematch(); }}
            onClose={() => { mpActions.reset(); setScreen('menu'); }}
            rematchWaiting={mpState.rematchWaiting}
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
