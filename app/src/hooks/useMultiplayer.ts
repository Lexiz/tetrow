import { useState, useRef, useCallback, useEffect } from 'react';
import type { Owner, GameMode } from '../../../shared/types';
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
  lobbyCount: number;
  myPlayer: Owner | null;
  opponentName: string | null;
  gameMode: GameMode | null;
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
    gameMode?: GameMode;
  } | null;
  rematchState: 'idle' | 'sent' | 'declined';
  rematchInvite: { senderName: string; timeoutMs: number } | null;
  rematchDeclineReason: 'rejected' | 'timeout' | 'left' | null;
  error: string | null;
  confirmInfo: ConfirmInfo | null;
  countdownInfo: CountdownInfo | null;
}

interface MultiplayerActions {
  connectLobby: () => void;
  disconnectLobby: () => void;
  joinQueue: (userId: string, displayName: string, elo: number, gameMode?: GameMode) => void;
  leaveQueue: () => void;
  confirm: () => void;
  rematch: () => void;
  acceptRematch: () => void;
  rejectRematch: () => void;
  quit: () => void;
  sendAction: (action: Action) => void;
  reset: () => void;
}

export function useMultiplayer(): [MultiplayerState, MultiplayerActions] {
  const [phase, setPhase] = useState<MatchPhase>('idle');
  const [queueSize, setQueueSize] = useState(0);
  const [lobbyCount, setLobbyCount] = useState(0);
  const [myPlayer, setMyPlayer] = useState<Owner | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [endResult, setEndResult] = useState<MultiplayerState['endResult']>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmInfo, setConfirmInfo] = useState<ConfirmInfo | null>(null);
  const [countdownInfo, setCountdownInfo] = useState<CountdownInfo | null>(null);
  const [rematchState, setRematchState] = useState<'idle' | 'sent' | 'declined'>('idle');
  const [rematchInvite, setRematchInvite] = useState<{ senderName: string; timeoutMs: number } | null>(null);
  const [rematchDeclineReason, setRematchDeclineReason] = useState<'rejected' | 'timeout' | 'left' | null>(null);

  const lobbyWs = useRef<WebSocket | null>(null);
  const queueWs = useRef<WebSocket | null>(null);
  const matchWs = useRef<WebSocket | null>(null);
  const matchInfoRef = useRef<{ matchId: string; player: Owner; userId: string; displayName: string; elo: number; gameMode?: GameMode } | null>(null);
  const joinInfoRef = useRef<{ userId: string; displayName: string; elo: number } | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      lobbyWs.current?.close();
      queueWs.current?.close();
      matchWs.current?.close();
    };
  }, []);

  // Connect a presence WebSocket to the matchmaker (just for lobby count)
  const connectLobby = useCallback(() => {
    if (lobbyWs.current) return; // already connected
    const ws = new WebSocket(`${SERVER_URL}/api/queue`);
    lobbyWs.current = ws;

    ws.onmessage = (ev) => {
      const data: ServerMessage = JSON.parse(ev.data);
      if (data.type === 'QUEUE_SIZE') {
        setQueueSize(data.count);
      }
    };

    ws.onclose = () => {
      lobbyWs.current = null;
    };

    ws.onerror = () => {
      lobbyWs.current = null;
    };
  }, []);

  const disconnectLobby = useCallback(() => {
    if (lobbyWs.current) {
      lobbyWs.current.close();
      lobbyWs.current = null;
    }
  }, []);

  const joinQueue = useCallback((userId: string, displayName: string, elo: number, gameMode?: GameMode) => {
    setPhase('queuing');
    setError(null);
    joinInfoRef.current = { userId, displayName, elo };

    // Close the lobby presence WebSocket — we'll use queueWs now
    if (lobbyWs.current) {
      lobbyWs.current.close();
      lobbyWs.current = null;
    }

    const ws = new WebSocket(`${SERVER_URL}/api/queue`);
    queueWs.current = ws;

    ws.onopen = () => {
      const msg: ClientMessage = { type: 'JOIN_QUEUE', userId, displayName, elo, ...(gameMode ? { gameMode } : {}) };
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
        if (data.gameMode) setGameMode(data.gameMode);
        matchInfoRef.current = {
          matchId: data.matchId,
          player: data.player,
          userId,
          displayName,
          elo,
          gameMode: data.gameMode,
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
      ...(info.gameMode ? { gameMode: info.gameMode } : {}),
    });

    const ws = new WebSocket(`${SERVER_URL}/api/match/${info.matchId}?${params}`);
    matchWs.current = ws;

    ws.onopen = () => {
      setPhase('connecting');
    };

    ws.onmessage = (ev) => {
      const data: ServerMessage = JSON.parse(ev.data);

      if (data.type === 'CONFIRM_PHASE') {
        setPhase('confirming');
        setRematchState('idle');
        setRematchInvite(null);
        setRematchDeclineReason(null);
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
          count: 0,
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
        if (data.gameMode) setGameMode(data.gameMode);
        setEndResult({
          winner: data.winner,
          toppedOut: data.toppedOut,
          forfeit: data.forfeit,
          scores: data.scores,
          stats: data.stats,
          matchId: data.matchId,
          durationMs: data.durationMs,
          p1Id: data.p1Id,
          p1Name: data.p1Name,
          p2Id: data.p2Id,
          p2Name: data.p2Name,
          p1Elo: data.p1Elo,
          p2Elo: data.p2Elo,
          gameMode: data.gameMode,
        });
        setRematchState('idle');
        setRematchInvite(null);
        setRematchDeclineReason(null);
        setPhase('ended');
      }

      if (data.type === 'REMATCH_SENT') {
        setRematchState('sent');
      }

      if (data.type === 'REMATCH_INVITE') {
        setRematchInvite({ senderName: data.senderName, timeoutMs: data.timeoutMs });
      }

      if (data.type === 'REMATCH_DECLINED') {
        setRematchState('declined');
        setRematchDeclineReason(data.reason);
        setRematchInvite(null);
      }

      if (data.type === 'REMATCH_CANCELLED') {
        setRematchInvite(null);
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
      try { queueWs.current.send(JSON.stringify(msg)); } catch {}
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

  const rematch = useCallback(() => {
    if (matchWs.current?.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: 'REMATCH_REQUEST' };
      matchWs.current.send(JSON.stringify(msg));
    }
  }, []);

  const acceptRematch = useCallback(() => {
    if (matchWs.current?.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: 'REMATCH_ACCEPT' };
      matchWs.current.send(JSON.stringify(msg));
    }
    setRematchInvite(null);
  }, []);

  const rejectRematch = useCallback(() => {
    if (matchWs.current?.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: 'REMATCH_REJECT' };
      matchWs.current.send(JSON.stringify(msg));
    }
    setRematchInvite(null);
  }, []);

  const quit = useCallback(() => {
    if (matchWs.current?.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: 'QUIT' };
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
    lobbyWs.current?.close();
    queueWs.current?.close();
    matchWs.current?.close();
    lobbyWs.current = null;
    queueWs.current = null;
    matchWs.current = null;
    matchInfoRef.current = null;
    joinInfoRef.current = null;
    setPhase('idle');
    setQueueSize(0);
    setLobbyCount(0);
    setMyPlayer(null);
    setOpponentName(null);
    setGameMode(null);
    setGameState(null);
    setEndResult(null);
    setError(null);
    setConfirmInfo(null);
    setCountdownInfo(null);
    setRematchState('idle');
    setRematchInvite(null);
    setRematchDeclineReason(null);
  }, []);

  return [
    { phase, queueSize, lobbyCount, myPlayer, opponentName, gameMode, gameState, endResult, error, confirmInfo, countdownInfo, rematchState, rematchInvite, rematchDeclineReason },
    { connectLobby, disconnectLobby, joinQueue, leaveQueue, confirm, rematch, acceptRematch, rejectRematch, quit, sendAction, reset },
  ];
}
