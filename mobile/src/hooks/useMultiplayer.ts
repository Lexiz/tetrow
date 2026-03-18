import { useState, useRef, useCallback, useEffect } from 'react';
import type { Owner } from '../../../shared/types';
import type { Action, PlayerStats } from '../../../shared/game/engine';

const SERVER_URL = 'wss://tetchess-server.alex-lisitzky.workers.dev';

// Protocol types (inlined to avoid server dependency)
type ClientMessage =
  | { type: 'JOIN_QUEUE'; userId: string; displayName: string; elo: number; gameMode?: string }
  | { type: 'LEAVE_QUEUE' }
  | { type: 'CONFIRM' }
  | { type: 'REMATCH_REQUEST' }
  | { type: 'QUIT' }
  | { type: 'ACTION'; action: Action };

interface ServerMessage {
  type: string;
  [key: string]: any;
}

export interface ClientGameState {
  board: any;
  active: Owner;
  piece: any;
  scores: [number, number];
  phase: 'playing' | 'equalizer' | 'ended';
  toppedOut: [boolean, boolean];
  winner: Owner | null;
  myNext: any;
  myNext2: any | null;
  opponentNext: any | null;
  lastClear: any;
  clearedRows: number[];
  stats: [PlayerStats, PlayerStats];
  isGrounded: boolean;
  lockResets: number;
  p2HasPlaced: boolean;
  gameMode?: string;
}

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

export interface MultiplayerState {
  phase: MatchPhase;
  queueSize: number;
  myPlayer: Owner | null;
  opponentName: string | null;
  gameMode: string | null;
  gameState: ClientGameState | null;
  endResult: {
    winner: Owner | null;
    toppedOut: [boolean, boolean];
    forfeit: Owner | null;
    scores: [number, number];
    stats: [PlayerStats, PlayerStats];
    matchId: string;
    durationMs: number;
    p1Id: string;
    p1Name: string;
    p2Id: string;
    p2Name: string;
    p1Elo: number;
    p2Elo: number;
  } | null;
  rematchWaiting: boolean;
  error: string | null;
  confirmInfo: ConfirmInfo | null;
  countdownInfo: CountdownInfo | null;
}

interface MultiplayerActions {
  connectLobby: () => void;
  disconnectLobby: () => void;
  joinQueue: (userId: string, displayName: string, elo: number, gameMode?: string) => void;
  leaveQueue: () => void;
  confirm: () => void;
  rematch: () => void;
  quit: () => void;
  sendAction: (action: Action) => void;
  reset: () => void;
}

export function useMultiplayer(): [MultiplayerState, MultiplayerActions] {
  const [phase, setPhase] = useState<MatchPhase>('idle');
  const [queueSize, setQueueSize] = useState(0);
  const [myPlayer, setMyPlayer] = useState<Owner | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<string | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [endResult, setEndResult] = useState<MultiplayerState['endResult']>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmInfo, setConfirmInfo] = useState<ConfirmInfo | null>(null);
  const [countdownInfo, setCountdownInfo] = useState<CountdownInfo | null>(null);
  const [rematchWaiting, setRematchWaiting] = useState(false);

  const lobbyWs = useRef<WebSocket | null>(null);
  const queueWs = useRef<WebSocket | null>(null);
  const matchWs = useRef<WebSocket | null>(null);
  const matchInfoRef = useRef<{ matchId: string; player: Owner; userId: string; displayName: string; elo: number; gameMode?: string } | null>(null);

  useEffect(() => {
    return () => {
      lobbyWs.current?.close();
      queueWs.current?.close();
      matchWs.current?.close();
    };
  }, []);

  const connectLobby = useCallback(() => {
    if (lobbyWs.current) return;
    const ws = new WebSocket(`${SERVER_URL}/api/queue`);
    lobbyWs.current = ws;

    ws.onmessage = (ev) => {
      const data: ServerMessage = JSON.parse(ev.data as string);
      if (data.type === 'QUEUE_SIZE') setQueueSize(data.count);
    };
    ws.onclose = () => { lobbyWs.current = null; };
    ws.onerror = () => { lobbyWs.current = null; };
  }, []);

  const disconnectLobby = useCallback(() => {
    lobbyWs.current?.close();
    lobbyWs.current = null;
  }, []);

  const joinQueue = useCallback((userId: string, displayName: string, elo: number, gameMode?: string) => {
    setPhase('queuing');
    setError(null);

    lobbyWs.current?.close();
    lobbyWs.current = null;

    const ws = new WebSocket(`${SERVER_URL}/api/queue`);
    queueWs.current = ws;

    ws.onopen = () => {
      const msg: ClientMessage = { type: 'JOIN_QUEUE', userId, displayName, elo, ...(gameMode ? { gameMode } : {}) };
      ws.send(JSON.stringify(msg));
    };

    ws.onmessage = (ev) => {
      const data: ServerMessage = JSON.parse(ev.data as string);
      if (data.type === 'QUEUED') setPhase('queuing');
      if (data.type === 'QUEUE_SIZE') setQueueSize(data.count);
      if (data.type === 'MATCH_FOUND') {
        setPhase('connecting');
        setMyPlayer(data.player);
        setOpponentName(data.opponentName);
        if (data.gameMode) setGameMode(data.gameMode);
        matchInfoRef.current = { matchId: data.matchId, player: data.player, userId, displayName, elo, gameMode: data.gameMode };
      }
      if (data.type === 'ERROR') setError(data.message);
    };

    ws.onclose = () => {
      if (matchInfoRef.current) connectToMatch();
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
      ...(info.gameMode ? { gameMode: info.gameMode } : {}),
    });

    const ws = new WebSocket(`${SERVER_URL}/api/match/${info.matchId}?${params}`);
    matchWs.current = ws;

    ws.onopen = () => setPhase('connecting');

    ws.onmessage = (ev) => {
      const data: ServerMessage = JSON.parse(ev.data as string);

      if (data.type === 'CONFIRM_PHASE') {
        setPhase('confirming');
        setConfirmInfo({
          p1Name: data.p1Name, p2Name: data.p2Name,
          myPlayer: data.myPlayer, timeoutMs: data.timeoutMs,
          p1Confirmed: false, p2Confirmed: false,
        });
      }
      if (data.type === 'PLAYER_CONFIRMED') {
        setConfirmInfo(prev => prev ? {
          ...prev,
          p1Confirmed: data.player === 1 ? true : prev.p1Confirmed,
          p2Confirmed: data.player === 2 ? true : prev.p2Confirmed,
        } : prev);
      }
      if (data.type === 'BOTH_CONFIRMED') {
        setPhase('countdown');
        setCountdownInfo({ myPlayer: data.myPlayer, p1Name: data.p1Name, p2Name: data.p2Name, count: 0 });
      }
      if (data.type === 'COUNTDOWN') {
        setCountdownInfo(prev => prev ? { ...prev, count: data.count } : prev);
      }
      if (data.type === 'CONFIRM_TIMEOUT') setPhase('confirm_timeout');
      if (data.type === 'GAME_STATE') { setPhase('playing'); setGameState(data.state); }
      if (data.type === 'GAME_END') {
        setEndResult({
          winner: data.winner, toppedOut: data.toppedOut, forfeit: data.forfeit,
          scores: data.scores, stats: data.stats, matchId: data.matchId,
          durationMs: data.durationMs, p1Id: data.p1Id, p1Name: data.p1Name,
          p2Id: data.p2Id, p2Name: data.p2Name, p1Elo: data.p1Elo, p2Elo: data.p2Elo,
        });
        setRematchWaiting(false);
        setPhase('ended');
      }
      if (data.type === 'REMATCH_WAITING') setRematchWaiting(true);
      if (data.type === 'OPPONENT_DISCONNECTED') setPhase('opponent_disconnected');
      if (data.type === 'ERROR') setError(data.message);
    };

    ws.onerror = () => setError('Connection to match failed');
  }

  const leaveQueue = useCallback(() => {
    if (queueWs.current) {
      try { queueWs.current.send(JSON.stringify({ type: 'LEAVE_QUEUE' })); } catch {}
      queueWs.current.close();
      queueWs.current = null;
    }
    setPhase('idle');
    setQueueSize(0);
  }, []);

  const confirm = useCallback(() => {
    if (matchWs.current?.readyState === WebSocket.OPEN) {
      matchWs.current.send(JSON.stringify({ type: 'CONFIRM' }));
    }
  }, []);

  const rematch = useCallback(() => {
    if (matchWs.current?.readyState === WebSocket.OPEN) {
      matchWs.current.send(JSON.stringify({ type: 'REMATCH_REQUEST' }));
    }
  }, []);

  const quit = useCallback(() => {
    if (matchWs.current?.readyState === WebSocket.OPEN) {
      matchWs.current.send(JSON.stringify({ type: 'QUIT' }));
    }
  }, []);

  const sendAction = useCallback((action: Action) => {
    if (matchWs.current?.readyState === WebSocket.OPEN) {
      matchWs.current.send(JSON.stringify({ type: 'ACTION', action }));
    }
  }, []);

  const reset = useCallback(() => {
    lobbyWs.current?.close(); queueWs.current?.close(); matchWs.current?.close();
    lobbyWs.current = null; queueWs.current = null; matchWs.current = null;
    matchInfoRef.current = null;
    setPhase('idle'); setQueueSize(0); setMyPlayer(null); setOpponentName(null); setGameMode(null);
    setGameState(null); setEndResult(null); setError(null);
    setConfirmInfo(null); setCountdownInfo(null); setRematchWaiting(false);
  }, []);

  return [
    { phase, queueSize, myPlayer, opponentName, gameMode, gameState, endResult, error, confirmInfo, countdownInfo, rematchWaiting },
    { connectLobby, disconnectLobby, joinQueue, leaveQueue, confirm, rematch, quit, sendAction, reset },
  ];
}
