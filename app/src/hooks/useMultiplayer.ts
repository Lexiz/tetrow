import { useState, useRef, useCallback, useEffect } from 'react';
import type { Owner } from '../../../shared/types';
import type { Action, PlayerStats } from '../../../shared/game/engine';
import type { ClientMessage, ServerMessage, ClientGameState } from '../../../server/src/protocol';

const SERVER_URL = 'wss://tetchess-server.alex-lisitzky.workers.dev';

export type MatchPhase =
  | 'idle'
  | 'queuing'
  | 'connecting'
  | 'confirming'
  | 'countdown'
  | 'playing'
  | 'ended'
  | 'confirm_timeout'
  | 'opponent_disconnected';

interface ConfirmInfo {
  p1Name: string;
  p2Name: string;
  myPlayer: Owner;
  timeoutMs: number;
  p1Confirmed: boolean;
  p2Confirmed: boolean;
}

interface CountdownInfo {
  myPlayer: Owner;
  p1Name: string;
  p2Name: string;
  count: number;
}

interface MultiplayerState {
  phase: MatchPhase;
  queueSize: number;
  myPlayer: Owner | null;
  opponentName: string | null;
  gameState: ClientGameState | null;
  endResult: { winner: Owner | null; scores: [number, number]; stats: [PlayerStats, PlayerStats] } | null;
  error: string | null;
  confirmInfo: ConfirmInfo | null;
  countdownInfo: CountdownInfo | null;
}

interface MultiplayerActions {
  joinQueue: (userId: string, displayName: string, elo: number) => void;
  leaveQueue: () => void;
  confirm: () => void;
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
  const [confirmInfo, setConfirmInfo] = useState<ConfirmInfo | null>(null);
  const [countdownInfo, setCountdownInfo] = useState<CountdownInfo | null>(null);

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
      }

      if (data.type === 'ERROR') {
        setError(data.message);
      }
    };

    ws.onclose = () => {
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
      // Don't go to 'playing' yet — wait for CONFIRM_PHASE
      setPhase('connecting');
    };

    ws.onmessage = (ev) => {
      const data: ServerMessage = JSON.parse(ev.data);

      if (data.type === 'CONFIRM_PHASE') {
        setPhase('confirming');
        setConfirmInfo({
          p1Name: data.p1Name,
          p2Name: data.p2Name,
          myPlayer: data.myPlayer,
          timeoutMs: data.timeoutMs,
          p1Confirmed: false,
          p2Confirmed: false,
        });
      }

      if (data.type === 'PLAYER_CONFIRMED') {
        setConfirmInfo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            p1Confirmed: data.player === 1 ? true : prev.p1Confirmed,
            p2Confirmed: data.player === 2 ? true : prev.p2Confirmed,
          };
        });
      }

      if (data.type === 'BOTH_CONFIRMED') {
        setPhase('countdown');
        setCountdownInfo({
          myPlayer: data.myPlayer,
          p1Name: data.p1Name,
          p2Name: data.p2Name,
          count: 0, // will be updated by COUNTDOWN messages
        });
      }

      if (data.type === 'COUNTDOWN') {
        setCountdownInfo(prev => prev ? { ...prev, count: data.count } : prev);
      }

      if (data.type === 'CONFIRM_TIMEOUT') {
        setPhase('confirm_timeout');
      }

      if (data.type === 'GAME_STATE') {
        setPhase('playing');
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
      // handled by phase state
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

  const confirm = useCallback(() => {
    if (matchWs.current?.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: 'CONFIRM' };
      matchWs.current.send(JSON.stringify(msg));
    }
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
    setConfirmInfo(null);
    setCountdownInfo(null);
  }, []);

  return [
    { phase, queueSize, myPlayer, opponentName, gameState, endResult, error, confirmInfo, countdownInfo },
    { joinQueue, leaveQueue, confirm, sendAction, reset },
  ];
}
