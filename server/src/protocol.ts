// WebSocket message protocol between client and server
import type { Owner } from '../../shared/types';
import type { Action, PlayerStats } from '../../shared/game/engine';
import type { SettledBoard, PieceState } from '../../shared/game/board';
import type { TetrominoType } from '../../shared/types';

// ── Client → Server ──────────────────────────────────────────────────────────

export type ClientMessage =
  | { type: 'JOIN_QUEUE'; userId: string; displayName: string; elo: number }
  | { type: 'LEAVE_QUEUE' }
  | { type: 'CONFIRM' }
  | { type: 'ACTION'; action: Action };

// ── Server → Client ──────────────────────────────────────────────────────────

/** Minimal game state sent to clients (no bag — prevents cheating) */
export interface ClientGameState {
  board: SettledBoard;
  active: Owner;
  piece: PieceState;
  scores: [number, number];
  phase: 'playing' | 'equalizer' | 'ended';
  toppedOut: Owner | null;
  winner: Owner | null;
  myNext: TetrominoType;
  opponentNext: TetrominoType | null; // null until opponent has placed once
  lastClear: { base: number; bonus: number; player: Owner; id: number } | null;
  clearedRows: number[];
  stats: [PlayerStats, PlayerStats];
}

export type ServerMessage =
  | { type: 'QUEUED' }
  | { type: 'QUEUE_SIZE'; count: number }
  | { type: 'MATCH_FOUND'; matchId: string; player: Owner; opponentName: string }
  | { type: 'CONFIRM_PHASE'; p1Name: string; p2Name: string; myPlayer: Owner; timeoutMs: number }
  | { type: 'PLAYER_CONFIRMED'; player: Owner }
  | { type: 'BOTH_CONFIRMED'; myPlayer: Owner; p1Name: string; p2Name: string }
  | { type: 'COUNTDOWN'; count: number }
  | { type: 'CONFIRM_TIMEOUT' }
  | { type: 'GAME_STATE'; state: ClientGameState }
  | { type: 'GAME_END'; winner: Owner | null; toppedOut: Owner | null; scores: [number, number]; stats: [PlayerStats, PlayerStats]; matchId: string; p1Id: string; p1Name: string; p2Id: string; p2Name: string; p1Elo: number; p2Elo: number }
  | { type: 'OPPONENT_DISCONNECTED' }
  | { type: 'ERROR'; message: string };
