import { useState, useEffect } from 'react';
import { C } from '../../shared/theme';
import { APP_VERSION } from '../../shared/version';
import type { Screen, Owner } from '../../shared/types';
import type { PlayerStats } from '../../shared/game/engine';
import type { AiDifficulty } from '../../shared/game/ai';
import MonitorGameScreen from './monitor/GameScreen';
import MobileGameScreen from './mobile/GameScreen';
import MonitorMPGameScreen from './monitor/MultiplayerGameScreen';
import MobileMPGameScreen from './mobile/MultiplayerGameScreen';
import LoginScreen from './screens/LoginScreen';
import MainMenu from './screens/MainMenu';
import WarmUpScreen from './screens/WarmUpScreen';
import StartScreen from './screens/StartScreen';
import EndScreen from './screens/EndScreen';
import RankedScreen from './screens/RankedScreen';
import MatchConfirmScreen from './screens/MatchConfirmScreen';
import { useIsMobile } from './hooks/useIsMobile';
import { useAuth } from './hooks/useAuth';
import { useMultiplayer } from './hooks/useMultiplayer';
import { getOrCreateProfile, saveMatchResult, type UserProfile } from './firestore';

interface MatchResult {
  p1Score: number;
  p2Score: number;
  toppedOut: Owner | null;
  stats: [PlayerStats, PlayerStats];
}

const emptyStats: PlayerStats = { basePoints: 0, bonusPoints: 0, clears: [0, 0, 0, 0] };

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [result, setResult] = useState<MatchResult>({ p1Score: 0, p2Score: 0, toppedOut: null, stats: [emptyStats, emptyStats] });
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wasRankedGame, setWasRankedGame] = useState(false);
  const isMobile = useIsMobile();
  const { user, loading, error: authError, signIn, signOut } = useAuth();
  const [mp, mpActions] = useMultiplayer();

  // Redirect to login if not authenticated
  const currentScreen = (!user && screen !== 'login') ? 'login' : screen;

  // After auth, go to menu and load profile
  if (user && currentScreen === 'login') {
    if (screen === 'login') setScreen('menu');
  }

  // Load/create Firestore profile when user logs in
  useEffect(() => {
    if (user) {
      getOrCreateProfile(user.uid, user.displayName || 'Player', user.photoURL)
        .then(setUserProfile)
        .catch(() => {});
    } else {
      setUserProfile(null);
    }
  }, [user?.uid]);

  // When multiplayer enters confirmation phase, switch to confirm screen
  useEffect(() => {
    if (mp.phase === 'confirming' && (currentScreen === 'ranked' || currentScreen === 'match-confirm')) {
      setScreen('match-confirm');
    }
  }, [mp.phase, currentScreen]);

  // When countdown starts, stay on confirm screen (it handles both phases)
  useEffect(() => {
    if (mp.phase === 'countdown' && currentScreen === 'match-confirm') {
      // MatchConfirmScreen handles the countdown display
    }
  }, [mp.phase, currentScreen]);

  // When multiplayer match starts playing, switch to ranked game screen
  useEffect(() => {
    if (mp.phase === 'playing' && (currentScreen === 'ranked' || currentScreen === 'match-confirm')) {
      setScreen('ranked-game');
    }
  }, [mp.phase, currentScreen]);

  // When confirmation times out, go back to ranked
  useEffect(() => {
    if (mp.phase === 'confirm_timeout' && currentScreen === 'match-confirm') {
      // MatchConfirmScreen shows the timeout message with a back button
    }
  }, [mp.phase, currentScreen]);

  // When multiplayer match ends via server notification — save to Firestore
  useEffect(() => {
    if (mp.phase === 'ended' && mp.endResult && currentScreen === 'ranked-game') {
      setResult({
        p1Score: mp.endResult.scores[0],
        p2Score: mp.endResult.scores[1],
        toppedOut: null,
        stats: mp.endResult.stats,
      });
      setWasRankedGame(true);
      setScreen('end');
    }
  }, [mp.phase, mp.endResult, currentScreen]);

  function handleGameEnd(p1Score: number, p2Score: number, toppedOut: Owner | null, stats: [PlayerStats, PlayerStats]) {
    setResult({ p1Score, p2Score, toppedOut, stats });

    // Save ranked match results to Firestore
    if (wasRankedGame && user && mp.myPlayer && mp.opponentName) {
      const winner: Owner | null = p1Score > p2Score ? 1 : p2Score > p1Score ? 2 : null;
      // For now, use user's uid for their player slot and a placeholder for opponent
      // In a real setup, the server would provide both player IDs
      const myId = user.uid;
      const myName = user.displayName || 'Player';
      const oppName = mp.opponentName;
      // Use a deterministic opponent ID based on match info (server should provide this)
      const oppId = `opponent_${Date.now()}`;

      if (mp.myPlayer === 1) {
        saveMatchResult(myId, myName, oppId, oppName, p1Score, p2Score, winner)
          .then(() => getOrCreateProfile(myId, myName, user.photoURL).then(setUserProfile))
          .catch(() => {});
      } else {
        saveMatchResult(oppId, oppName, myId, myName, p1Score, p2Score, winner)
          .then(() => getOrCreateProfile(myId, myName, user.photoURL).then(setUserProfile))
          .catch(() => {});
      }
      setWasRankedGame(false);
    }

    setScreen('end');
  }

  function handleSelectDifficulty(difficulty: AiDifficulty) {
    setAiDifficulty(difficulty);
    setScreen('warmup');
  }

  function handleBackToMenu() {
    setAiDifficulty(null);
    mpActions.reset();
    setScreen('menu');
  }

  function handleSignOut() {
    mpActions.reset();
    signOut();
    setScreen('login');
  }

  function handleFindMatch() {
    if (!user) return;
    mpActions.joinQueue(user.uid, user.displayName || 'Player', userProfile?.elo ?? 1200);
  }

  function handleCancelSearch() {
    mpActions.leaveQueue();
  }

  // Determine which game screen to show
  const isWarmUp = currentScreen === 'warmup';
  const gameAiDifficulty = isWarmUp ? (aiDifficulty ?? 'medium') : undefined;
  const elo = userProfile?.elo ?? 1200;

  // Loading state
  if (loading) {
    return (
      <div style={{
        background: '#030306', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'monospace', fontSize: 10, letterSpacing: 4,
          color: C.dim, animation: 'pulse 1.5s infinite',
        }}>LOADING...</div>
      </div>
    );
  }

  // Shared screen components (same for mobile and monitor, just pass isMobile)
  function renderScreen(mobile?: boolean) {
    return (
      <>
        {currentScreen === 'login' && <LoginScreen onSignIn={signIn} authError={authError} isMobile={mobile} />}
        {currentScreen === 'menu' && user && (
          <MainMenu
            user={user}
            elo={elo}
            onWarmUp={() => setScreen('warmup-select')}
            onRanked={() => setScreen('ranked')}
            onSignOut={handleSignOut}
            isMobile={mobile}
          />
        )}
        {currentScreen === 'warmup-select' && (
          <WarmUpScreen
            onSelect={handleSelectDifficulty}
            onBack={handleBackToMenu}
            isMobile={mobile}
          />
        )}
        {currentScreen === 'ranked' && user && (
          <RankedScreen
            user={user}
            elo={elo}
            matchPhase={mp.phase}
            queueSize={mp.queueSize}
            opponentName={mp.opponentName}
            error={mp.error}
            onFindMatch={handleFindMatch}
            onCancelSearch={handleCancelSearch}
            onBack={handleBackToMenu}
            isMobile={mobile}
          />
        )}
        {currentScreen === 'match-confirm' && (
          <MatchConfirmScreen
            confirmInfo={mp.confirmInfo}
            countdownInfo={mp.countdownInfo}
            phase={mp.phase === 'countdown' ? 'countdown' : mp.phase === 'confirm_timeout' ? 'confirm_timeout' : 'confirming'}
            onConfirm={mpActions.confirm}
            onBack={() => { mpActions.reset(); setScreen('ranked'); }}
            isMobile={mobile}
          />
        )}
        {currentScreen === 'start' && <StartScreen onStart={() => setScreen('game')} isMobile={mobile} />}
        {(currentScreen === 'game' || currentScreen === 'warmup') && (
          mobile
            ? <MobileGameScreen onGameEnd={handleGameEnd} aiDifficulty={gameAiDifficulty} />
            : <MonitorGameScreen onGameEnd={handleGameEnd} aiDifficulty={gameAiDifficulty} />
        )}
        {currentScreen === 'ranked-game' && mp.myPlayer && (
          mobile
            ? <MobileMPGameScreen
                gameState={mp.gameState}
                myPlayer={mp.myPlayer}
                opponentName={mp.opponentName ?? 'Opponent'}
                sendAction={mpActions.sendAction}
                onGameEnd={handleGameEnd}
              />
            : <MonitorMPGameScreen
                gameState={mp.gameState}
                myPlayer={mp.myPlayer}
                opponentName={mp.opponentName ?? 'Opponent'}
                sendAction={mpActions.sendAction}
                onGameEnd={handleGameEnd}
              />
        )}
        {currentScreen === 'end' && (
          <EndScreen
            p1Score={result.p1Score}
            p2Score={result.p2Score}
            p1ToppedOut={result.toppedOut === 1}
            p2ToppedOut={result.toppedOut === 2}
            stats={result.stats}
            onPlayAgain={handleBackToMenu}
            onHome={handleBackToMenu}
          />
        )}
      </>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div style={{
        background: '#030306',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {renderScreen(true)}
      </div>
    );
  }

  // Monitor layout
  return (
    <div style={{
      background: '#030306',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: 24,
    }}>
      <div style={{
        position: 'relative',
        border: '1.5px solid #1c1c2e',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: `
          0 0  80px rgba(255,122,0,0.10),
          0 0 160px rgba(0,229,255,0.06),
          0  40px 100px rgba(0,0,0,0.95)
        `,
      }}>
        {renderScreen(false)}
      </div>
      <div style={{ marginTop: 16, color: C.white, fontFamily: 'monospace', fontSize: 8, letterSpacing: 3 }}>
        CHESTET · v{APP_VERSION}
      </div>
    </div>
  );
}
