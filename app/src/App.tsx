import { useState, useEffect } from 'react';
import { C } from '../../shared/theme';
import { APP_VERSION } from '../../shared/version';
import type { Screen, Owner, GameMode } from '../../shared/types';
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
import TermsScreen from './screens/TermsScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import { useIsMobile } from './hooks/useIsMobile';
import { useAuth } from './hooks/useAuth';
import { useMultiplayer } from './hooks/useMultiplayer';
import { useVersionCheck } from './hooks/useVersionCheck';
import { getOrCreateProfile, saveMyMatchResult, savePracticeResult, calcEloChange, type UserProfile } from './firestore';

interface MatchResult {
  p1Score: number;
  p2Score: number;
  toppedOut: [boolean, boolean];
  stats: [PlayerStats, PlayerStats];
  p1Name?: string;
  p2Name?: string;
  p1EloChange?: number;
  p2EloChange?: number;
  forfeit?: 1 | 2 | null;
}

const emptyStats: PlayerStats = { basePoints: 0, bonusPoints: 0, clears: [0, 0, 0, 0], piecesPlaced: 0 };

export default function App() {
  const [screen, setScreenRaw] = useState<Screen>('login');
  const [result, setResult] = useState<MatchResult>({ p1Score: 0, p2Score: 0, toppedOut: [false, false], stats: [emptyStats, emptyStats] });
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty | null>(null);
  const [practiceGameMode, setPracticeGameMode] = useState<GameMode>('classic');
  const [practiceStartTime, setPracticeStartTime] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { user, loading, error: authError, signIn, signOut } = useAuth();
  const [mp, mpActions] = useMultiplayer();
  const checkVersion = useVersionCheck();

  // Wrap setScreen to check for new version on every navigation
  const setScreen = (s: Screen) => {
    checkVersion();
    setScreenRaw(s);
  };

  // Redirect to login if not authenticated
  const currentScreen = (!user && screen !== 'login' && screen !== 'terms' && screen !== 'privacy') ? 'login' : screen;

  // After auth, go to menu and load profile
  if (user && currentScreen === 'login') {
    if (screen === 'login') setScreen('menu');
  }

  // Load/create Firestore profile when user logs in
  useEffect(() => {
    if (user) {
      getOrCreateProfile(user.uid, user.displayName || 'Player', user.photoURL)
        .then((profile) => {
          setUserProfile(profile);
          setFirestoreError(null);
        })
        .catch((err) => {
          console.error('Firestore profile load failed:', err);
          setFirestoreError(`Firestore error: ${err?.message || err}`);
        });
    } else {
      setUserProfile(null);
    }
  }, [user?.uid]);

  // When multiplayer enters confirmation phase, switch to confirm screen
  useEffect(() => {
    if (mp.phase === 'confirming' && (currentScreen === 'ranked' || currentScreen === 'match-confirm' || currentScreen === 'end')) {
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
    if (mp.phase === 'playing' && (currentScreen === 'ranked' || currentScreen === 'match-confirm' || currentScreen === 'end')) {
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
      const er = mp.endResult;
      const p1Result = er.winner === 1 ? 1 : er.winner === 2 ? 0 : 0.5;
      const p2Result = er.winner === 2 ? 1 : er.winner === 1 ? 0 : 0.5;
      const p1EloChange = calcEloChange(er.p1Elo, er.p2Elo, p1Result, 0);
      const p2EloChange = calcEloChange(er.p2Elo, er.p1Elo, p2Result, 0);
      setResult({
        p1Score: er.scores[0],
        p2Score: er.scores[1],
        toppedOut: er.toppedOut,
        stats: er.stats,
        p1Name: er.p1Name,
        p2Name: er.p2Name,
        p1EloChange,
        p2EloChange,
        forfeit: er.forfeit,
      });
      setScreen('end');

      // Save match result to Firestore (each client saves their own profile)
      if (user && mp.myPlayer) {
        const oppId = mp.myPlayer === 1 ? er.p2Id : er.p1Id;
        const oppName = mp.myPlayer === 1 ? er.p2Name : er.p1Name;
        const oppElo = mp.myPlayer === 1 ? er.p2Elo : er.p1Elo;

        saveMyMatchResult(
          user.uid,
          user.displayName || 'Player',
          user.photoURL,
          mp.myPlayer,
          oppId,
          oppName,
          oppElo,
          er.scores[0],
          er.scores[1],
          er.winner,
          er.matchId,
          er.durationMs,
          er.stats,
          mp.gameMode ?? undefined,
        )
          .then(() => {
            setFirestoreError(null);
            return getOrCreateProfile(user.uid, user.displayName || 'Player', user.photoURL).then(setUserProfile);
          })
          .catch((err) => {
            console.error('Failed to save match result:', err);
            setFirestoreError(`Save failed: ${err?.message || err}`);
          });
      }
    }
  }, [mp.phase, mp.endResult, currentScreen]);

  function handleGameEnd(p1Score: number, p2Score: number, toppedOut: [boolean, boolean], stats: [PlayerStats, PlayerStats]) {
    setResult({ p1Score, p2Score, toppedOut, stats });
    setScreen('end');

    // Save practice game result
    if (aiDifficulty && user) {
      const durationMs = Date.now() - practiceStartTime;
      const winner = p1Score > p2Score ? 1 : p2Score > p1Score ? 2 : null;
      savePracticeResult(user.uid, aiDifficulty, p1Score, p2Score, winner as any, durationMs, stats, practiceGameMode)
        .catch(err => console.error('Failed to save practice result:', err));
    }
  }

  function handleSelectDifficulty(difficulty: AiDifficulty, mode: GameMode = 'classic') {
    setAiDifficulty(difficulty);
    setPracticeGameMode(mode);
    setPracticeStartTime(Date.now());
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

  function handleFindMatch(gameMode?: string) {
    if (!user) return;
    const isBlind = gameMode === 'blind';
    const elo = isBlind ? (userProfile?.eloBlind ?? 1200) : (userProfile?.elo ?? 1200);
    mpActions.joinQueue(user.uid, user.displayName || 'Player', elo, gameMode as import('../../shared/types').GameMode | undefined);
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
        {/* Firestore error banner — visible on all screens */}
        {firestoreError && currentScreen !== 'end' && (
          <div style={{
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
            zIndex: 100, fontFamily: 'monospace', fontSize: 8,
            color: '#ff6b6b', background: '#ff6b6b11',
            border: '1px solid #ff6b6b44', borderRadius: 4,
            padding: '4px 12px', maxWidth: '80%', textAlign: 'center',
          }}>{firestoreError}</div>
        )}
        {currentScreen === 'login' && <LoginScreen onSignIn={signIn} authError={authError} isMobile={mobile} onTerms={() => setScreen('terms')} onPrivacy={() => setScreen('privacy')} />}
        {currentScreen === 'terms' && <TermsScreen onBack={() => setScreen(user ? 'menu' : 'login')} />}
        {currentScreen === 'privacy' && <PrivacyScreen onBack={() => setScreen(user ? 'menu' : 'login')} />}
        {currentScreen === 'menu' && user && (
          <MainMenu
            user={user}
            elo={elo}
            onWarmUp={() => setScreen('warmup-select')}
            onRanked={() => setScreen('ranked')}
            onSignOut={handleSignOut}
            onTerms={() => setScreen('terms')}
            onPrivacy={() => setScreen('privacy')}
            isMobile={mobile}
          />
        )}
        {currentScreen === 'warmup-select' && (
          <WarmUpScreen
            userId={user?.uid ?? ''}
            onSelect={handleSelectDifficulty}
            onBack={handleBackToMenu}
            isMobile={mobile}
          />
        )}
        {currentScreen === 'ranked' && user && (
          <RankedScreen
            user={user}
            elo={elo}
            wins={userProfile?.wins ?? 0}
            losses={userProfile?.losses ?? 0}
            draws={userProfile?.draws ?? 0}
            gamesPlayed={userProfile?.gamesPlayed ?? 0}
            eloBlind={userProfile?.eloBlind}
            winsBlind={userProfile?.winsBlind}
            lossesBlind={userProfile?.lossesBlind}
            drawsBlind={userProfile?.drawsBlind}
            gamesPlayedBlind={userProfile?.gamesPlayedBlind}
            matchPhase={mp.phase}
            queueSize={mp.queueSize}
            opponentName={mp.opponentName}
            error={mp.error}
            onFindMatch={handleFindMatch}
            onCancelSearch={handleCancelSearch}
            onBack={handleBackToMenu}
            onEnterLobby={mpActions.connectLobby}
            onLeaveLobby={mpActions.disconnectLobby}
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
            ? <MobileGameScreen onGameEnd={handleGameEnd} aiDifficulty={gameAiDifficulty} gameMode={currentScreen === 'warmup' ? practiceGameMode : undefined} onQuit={handleBackToMenu} />
            : <MonitorGameScreen onGameEnd={handleGameEnd} aiDifficulty={gameAiDifficulty} gameMode={currentScreen === 'warmup' ? practiceGameMode : undefined} onQuit={handleBackToMenu} />
        )}
        {currentScreen === 'ranked-game' && mp.myPlayer && (() => {
          const myName = user?.displayName || 'Player';
          const myElo = userProfile?.elo ?? 1200;
          const oppElo = mp.endResult ? (mp.myPlayer === 1 ? mp.endResult.p2Elo : mp.endResult.p1Elo) : myElo;
          const eloLoss = Math.abs(calcEloChange(myElo, oppElo, 0, userProfile?.gamesPlayed ?? 0));
          return mobile
            ? <MobileMPGameScreen
                gameState={mp.gameState}
                myPlayer={mp.myPlayer}
                myName={myName}
                opponentName={mp.opponentName ?? 'Opponent'}
                eloLoss={eloLoss}
                sendAction={mpActions.sendAction}
                onGameEnd={handleGameEnd}
                onQuit={() => mpActions.quit()}
              />
            : <MonitorMPGameScreen
                gameState={mp.gameState}
                myPlayer={mp.myPlayer}
                myName={myName}
                opponentName={mp.opponentName ?? 'Opponent'}
                eloLoss={eloLoss}
                sendAction={mpActions.sendAction}
                onGameEnd={handleGameEnd}
                onQuit={() => mpActions.quit()}
              />;
        })()}
        {currentScreen === 'end' && (
          <EndScreen
            p1Score={result.p1Score}
            p2Score={result.p2Score}
            p1ToppedOut={result.toppedOut[0]}
            p2ToppedOut={result.toppedOut[1]}
            p1Name={result.p1Name}
            p2Name={result.p2Name}
            stats={result.stats}
            p1EloChange={result.p1EloChange}
            p2EloChange={result.p2EloChange}
            forfeit={result.forfeit}
            onRematch={aiDifficulty ? () => { setPracticeStartTime(Date.now()); setScreen('warmup'); } : () => mpActions.rematch()}
            onClose={handleBackToMenu}
            rematchButtonLabel={aiDifficulty ? 'PLAY AGAIN' : undefined}
            rematchState={aiDifficulty ? 'idle' : mp.rematchState}
            rematchDeclineReason={aiDifficulty ? null : mp.rematchDeclineReason}
            rematchInvite={aiDifficulty ? null : mp.rematchInvite}
            onAcceptRematch={aiDifficulty ? undefined : () => mpActions.acceptRematch()}
            onRejectRematch={aiDifficulty ? undefined : () => mpActions.rejectRematch()}
            firestoreError={firestoreError}
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
        TETROW · v{APP_VERSION}
      </div>
    </div>
  );
}
