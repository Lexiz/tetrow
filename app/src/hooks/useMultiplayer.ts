import { useState, useRef, useCallback, useEffect } from 'react';
import type { Owner } from '../../../shared/types';
import type { Action, PlayerStats } from '../../../shared/game/engine';
import type { ClientMessage, ServerMessage, ClientGameState } from '../../../server/src/protocol';

const SERVER_URL = 'wss://tetchess-server.alex-lisitzky.workers.dev';

export type MatchPhase = 'idle' | 'queuing' | 'connecting' | 'playing' | 'ended' | 'opponent_disconnected';

interface MultiplayerState {
  phase: MatchPhase;
  queueSize: number;
  myPlayer: Owner | null;
  opponentName: string | null;
  gameState: ClientGameState | null;
  endResult: { winner: Owner | null; scores: [number, number]; stats: [PlayerStats, PlayerStats] } | null;
  error: string | null;
}

interface MultiplayerActions {
  joinQueue: (userId: string, displayName: string, elo: number) => void;
  leaveQueue: () => void;
  sendAction: (action: Action) => void;
  reset: () => void;
}

export function useMultiplayer(): [MultiplayerState, MultiplayerActions] {
  const [phase, setPhase] = useState<MatchPhase>('idle');
  const [queueSize, setQueueSize] = useState(0);
  const [myPlayer, setMyPlayer] = useState<Owner | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [endResult, setEndResult] = useState<MultiplayerState['endResult']>(null);
  const [error, setError] = useState<string | null>(null);

  const queueWs = useRef<WebSocket | null>(null);
  const matchWs = useRef<WebSocket | null>(null);
  const matchInfoRef = useRef<{ matchId: string; player: Owner; userId: string; displayName: string; elo: number } | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      queueWs.current?.close();
      matchWs.current?.close();
    };
  }, []);

  const joinQueue = useCallback((userId: string, displayName: string, elo: number) => {
    setPhase('queuing');
    setError(null);

    const ws = new WebSocket(`${SERVER_URL}/api/queue`);
    queueWs.current = ws;

    ws.onopen = () => {
      const msg: ClientMessage = { type: 'JOIN_QUEUE', userId, displayName, elo };
      ws.send(JSON.stringify(msg));
    };

    ws.onmessage = (ev) => {
      const data: ServerMessage = JSON.parse(ev.data);

      if (data.type === 'QUEUED') {
        setPhase('queuing');
      }

      if (data.type === 'QUEUE_SIZE') {
        setQueueSize(data.count);
      }

      if (data.type === 'MATCH_FOUND') {
        setPhase('connecting');
        setMyPlayer(data.player);
        setOpponentName(data.opponentName);
        matchInfoRef.current = {
          matchId: data.matchId,
          player: data.player,
          userId,
          displayName,
          elo,
        };
        // The matchmaker will close this WebSocket; we connect to the Match DO
      }

      if (data.type === 'ERROR') {
        setError(data.message);
      }
    };

    ws.onclose = () => {
      // If we got matched, connect to the match
      if (matchInfoRef.current) {
        connectToMatch();
      }
    };

    ws.onerror = () => {
      setError('Connection to server failed');
      setPhase('idle');
    };
  }, []);

  function connectToMatch() {
    const info = matchInfoRef.current;
    if (!info) return;

    const params = new URLSearchParams({
      player: String(info.player),
      userId: info.userId,
      displayName: info.displayName,
      elo: String(info.elo),
    });

    const ws = new WebSocket(`${SERVER_URL}/api/match/${info.matchId}?${params}`);
    matchWs.current = ws;

    ws.onopen = () => {
      setPhase('playing');
    };

    ws.onmessage = (ev) => {
      const data: ServerMessage = JSON.parse(ev.data);

      if (data.type === 'GAME_STATE') {
        setGameState(data.state);
      }

      if (data.type === 'GAME_END') {
        setEndResult({ winner: data.winner, scores: data.scores, stats: data.stats });
        setPhase('ended');
      }

      if (data.type === 'OPPONENT_DISCONNECTED') {
        setPhase('opponent_disconnected');
      }

      if (data.type === 'ERROR') {
        setError(data.message);
      }
    };

    ws.onclose = () => {
      if (phase !== 'ended') {
        // Unexpected close
      }
    };

    ws.onerror = () => {
      setError('Connection to match failed');
    };
  }

  const leaveQueue = useCallback(() => {
    if (queueWs.current) {
      const msg: ClientMessage = { type: 'LEAVE_QUEUE' };
      queueWs.current.send(JSON.stringify(msg));
      queueWs.current.close();
      queueWs.current = null;
    }
    setPhase('idle');
    setQueueSize(0);
  }, []);

  const sendAction = useCallback((action: Action) => {
    if (matchWs.current?.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: 'ACTION', action };
      matchWs.current.send(JSON.stringify(msg));
    }
  }, []);

  const reset = useCallback(() => {
    queueWs.current?.close();
    matchWs.current?.close();
    queueWs.current = null;
    matchWs.current = null;
    matchInfoRef.current = null;
    setPhase('idle');
    setQueueSize(0);
    setMyPlayer(null);
    setOpponentName(null);
    setGameState(null);
    setEndResult(null);
    setError(null);
  }, []);

  return [
    { phase, queueSize, myPlayer, opponentName, gameState, endResult, error },
    { joinQueue, leaveQueue, sendAction, reset },
  ];
}
