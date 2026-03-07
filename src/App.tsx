import { useState } from 'react';
import { C } from './theme';
import type { Screen, Owner } from './types';
import type { PlayerStats } from './game/engine';
import GameScreen from './components/GameScreen';
import StartScreen from './screens/StartScreen';
import EndScreen from './screens/EndScreen';

interface MatchResult {
  p1Score: number;
  p2Score: number;
  toppedOut: Owner | null;
  stats: [PlayerStats, PlayerStats];
}

const emptyStats: PlayerStats = { basePoints: 0, bonusPoints: 0, clears: [0, 0, 0, 0] };

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [result, setResult] = useState<MatchResult>({ p1Score: 0, p2Score: 0, toppedOut: null, stats: [emptyStats, emptyStats] });

  function handleGameEnd(p1Score: number, p2Score: number, toppedOut: Owner | null, stats: [PlayerStats, PlayerStats]) {
    setResult({ p1Score, p2Score, toppedOut, stats });
    setScreen('end');
  }

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
        {screen === 'start' && <StartScreen onStart={() => setScreen('game')} />}
        {screen === 'game'  && <GameScreen onGameEnd={handleGameEnd} />}
        {screen === 'end'   && (
          <EndScreen
            p1Score={result.p1Score}
            p2Score={result.p2Score}
            p1ToppedOut={result.toppedOut === 1}
            p2ToppedOut={result.toppedOut === 2}
            stats={result.stats}
            onPlayAgain={() => setScreen('start')}
          />
        )}
      </div>
      <div style={{ marginTop: 16, color: C.dim, fontFamily: 'monospace', fontSize: 8, letterSpacing: 3 }}>
        CHESS-TET · v0.1 · PHASE 2
      </div>
    </div>
  );
}
