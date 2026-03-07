import { useState } from 'react';
import { C } from '../../shared/theme';
import { APP_VERSION } from '../../shared/version';
import type { Screen, Owner } from '../../shared/types';
import type { PlayerStats } from '../../shared/game/engine';
import type { AiDifficulty } from '../../shared/game/ai';
import MonitorGameScreen from './monitor/GameScreen';
import MobileGameScreen from './mobile/GameScreen';
import LoginScreen from './screens/LoginScreen';
import MainMenu from './screens/MainMenu';
import StartScreen from './screens/StartScreen';
import EndScreen from './screens/EndScreen';
import { useIsMobile } from './hooks/useIsMobile';
import { useAuth } from './hooks/useAuth';

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
  const isMobile = useIsMobile();
  const { user, loading, signIn, signOut } = useAuth();

  // Redirect to login if not authenticated
  const currentScreen = (!user && screen !== 'login') ? 'login' : screen;

  // After auth, go to menu
  if (user && currentScreen === 'login') {
    // This will be picked up on next render
    if (screen === 'login') setScreen('menu');
  }

  function handleGameEnd(p1Score: number, p2Score: number, toppedOut: Owner | null, stats: [PlayerStats, PlayerStats]) {
    setResult({ p1Score, p2Score, toppedOut, stats });
    setScreen('end');
  }

  function handleWarmUp(difficulty: AiDifficulty) {
    setAiDifficulty(difficulty);
    setScreen('warmup');
  }

  function handleBackToMenu() {
    setAiDifficulty(null);
    setScreen('menu');
  }

  function handleSignOut() {
    signOut();
    setScreen('login');
  }

  // Determine which game screen to show
  const isWarmUp = currentScreen === 'warmup';
  const gameAiDifficulty = isWarmUp ? (aiDifficulty ?? 'medium') : undefined;

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
        {currentScreen === 'login' && <LoginScreen onSignIn={signIn} isMobile />}
        {currentScreen === 'menu' && user && (
          <MainMenu
            user={user}
            elo={1200}
            onWarmUp={handleWarmUp}
            onRanked={() => setScreen('ranked')}
            onSignOut={handleSignOut}
            isMobile
          />
        )}
        {currentScreen === 'start' && <StartScreen onStart={() => setScreen('game')} isMobile />}
        {(currentScreen === 'game' || currentScreen === 'warmup') && (
          <MobileGameScreen onGameEnd={handleGameEnd} aiDifficulty={gameAiDifficulty} />
        )}
        {currentScreen === 'end' && (
          <EndScreen
            p1Score={result.p1Score}
            p2Score={result.p2Score}
            p1ToppedOut={result.toppedOut === 1}
            p2ToppedOut={result.toppedOut === 2}
            stats={result.stats}
            onPlayAgain={handleBackToMenu}
          />
        )}
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
        {currentScreen === 'login' && <LoginScreen onSignIn={signIn} />}
        {currentScreen === 'menu' && user && (
          <MainMenu
            user={user}
            elo={1200}
            onWarmUp={handleWarmUp}
            onRanked={() => setScreen('ranked')}
            onSignOut={handleSignOut}
          />
        )}
        {currentScreen === 'start' && <StartScreen onStart={() => setScreen('game')} />}
        {(currentScreen === 'game' || currentScreen === 'warmup') && (
          <MonitorGameScreen onGameEnd={handleGameEnd} aiDifficulty={gameAiDifficulty} />
        )}
        {currentScreen === 'end' && (
          <EndScreen
            p1Score={result.p1Score}
            p2Score={result.p2Score}
            p1ToppedOut={result.toppedOut === 1}
            p2ToppedOut={result.toppedOut === 2}
            stats={result.stats}
            onPlayAgain={handleBackToMenu}
          />
        )}
      </div>
      <div style={{ marginTop: 16, color: C.dim, fontFamily: 'monospace', fontSize: 8, letterSpacing: 3 }}>
        CHESTET · v{APP_VERSION}
      </div>
    </div>
  );
}
