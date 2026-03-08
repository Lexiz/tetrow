import type { Owner, TetrominoType, CellValue, Board } from '../types';
import type { PieceState, SettledBoard } from './board';
import { emptyBoard, spawnPiece, isValid, tryMove, tryRotate, lockPiece, clearLines, ghostRow } from './board';
import { generateBag, getShape } from './pieces';
import { CONFIG } from '../config';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlayerStats {
  basePoints: number;    // points from clearing own blocks
  bonusPoints: number;   // points from clearing opponent blocks
  clears: [number, number, number, number]; // [singles, doubles, triples, quads]
}

function emptyStats(): PlayerStats {
  return { basePoints: 0, bonusPoints: 0, clears: [0, 0, 0, 0] };
}

export interface GameState {
  board: SettledBoard;
  active: Owner;
  piece: PieceState;
  isGrounded: boolean;
  lockResets: number;

  bag: TetrominoType[];
  bagHead: number;
  // One queued "next" piece per player — shown in preview
  p1Next: TetrominoType;
  p2Next: TetrominoType;

  scores: [number, number];

  phase: 'playing' | 'equalizer' | 'ended';
  toppedOut: Owner | null; // first player to top out
  winner: Owner | null;

  // Opening visibility rule: hide P1's next piece until P2 completes first placement
  p2HasPlaced: boolean;

  // Last line-clear info for score popup
  lastClear: { base: number; bonus: number; player: Owner; id: number } | null;

  // Row indices that were just cleared (for animation); empty when no clear
  clearedRows: number[];

  // Per-player cumulative stats for end screen
  stats: [PlayerStats, PlayerStats];
}

export type Action =
  | { type: 'MOVE'; dc: number }
  | { type: 'ROTATE'; cw: boolean }
  | { type: 'SOFT_DROP' }
  | { type: 'HARD_DROP' }
  | { type: 'GRAVITY' }   // periodic downward tick
  | { type: 'LOCK' };     // lock delay expired

// ── Helpers ──────────────────────────────────────────────────────────────────

function grounded(piece: PieceState, board: SettledBoard): boolean {
  return !isValid({ ...piece, row: piece.row + 1 }, board);
}

function drawNext(state: GameState): { bag: TetrominoType[]; bagHead: number; next: TetrominoType } {
  let { bag, bagHead } = state;
  if (bagHead >= bag.length - 4) bag = [...bag, ...generateBag(14)];
  const next = bag[bagHead]!;
  return { bag, bagHead: bagHead + 1, next };
}

function calcScoreParts(linesCleared: number, opponentCells: number): { base: number; bonus: number } {
  const base = CONFIG.CLEAR_SCORES[linesCleared] ?? 0;
  const bonus = opponentCells * CONFIG.OPPONENT_CELL_BONUS;
  return { base, bonus };
}

// ── End-game helpers ─────────────────────────────────────────────────────────

function resolveEnd(state: GameState, board: SettledBoard, scores: [number, number]): GameState {
  const s: [number, number] = [scores[0], scores[1]];
  if (state.toppedOut !== null) s[state.toppedOut - 1] -= CONFIG.TOPOUT_PENALTY;
  const winner: Owner | null = s[0] > s[1] ? 1 : s[1] > s[0] ? 2 : null;
  return { ...state, board, scores: s, phase: 'ended', winner };
}

function handleTopOut(
  state: GameState,
  board: SettledBoard,
  scores: [number, number],
  toppedPlayer: Owner,
  p2HasPlaced: boolean,
): GameState {
  // First top-out → give opponent their equalizing turn
  if (state.phase === 'playing') {
    const equalizer: Owner = toppedPlayer === 1 ? 2 : 1;
    // Use the topped player's next piece (the equalizer player's piece is the one that failed to spawn)
    const equalizerType = toppedPlayer === 1 ? state.p1Next : state.p2Next;
    const equalizerPiece = spawnPiece(equalizerType);

    if (!isValid(equalizerPiece, board)) {
      // Equalizer can't even spawn — end immediately
      return resolveEnd({ ...state, toppedOut: toppedPlayer, p2HasPlaced }, board, scores);
    }

    return {
      ...state,
      board,
      active: equalizer,
      piece: equalizerPiece,
      isGrounded: grounded(equalizerPiece, board),
      lockResets: 0,
      scores,
      phase: 'equalizer',
      toppedOut: toppedPlayer,
      p2HasPlaced,
    };
  }

  // Already in equalizer → end now
  return resolveEnd({ ...state, board }, board, scores);
}

// ── Turn transition ───────────────────────────────────────────────────────────

let clearIdCounter = 0;

function doLock(state: GameState): GameState {
  const owner = state.active;
  let board = lockPiece(state.piece, state.board, owner);

  const { board: cleared, linesCleared, opponentCellsCleared, clearedRowIndices } = clearLines(board, owner);
  board = cleared;

  const { base, bonus } = calcScoreParts(linesCleared, opponentCellsCleared);
  const scores: [number, number] = [state.scores[0], state.scores[1]];
  scores[owner - 1] += base + bonus;

  const lastClear = linesCleared > 0
    ? { base, bonus, player: owner, id: ++clearIdCounter }
    : state.lastClear;

  // Update per-player stats
  const stats: [PlayerStats, PlayerStats] = [
    { ...state.stats[0], clears: [...state.stats[0].clears] as [number, number, number, number] },
    { ...state.stats[1], clears: [...state.stats[1].clears] as [number, number, number, number] },
  ];
  if (linesCleared > 0) {
    const si = owner - 1;
    stats[si]!.basePoints += base;
    stats[si]!.bonusPoints += bonus;
    stats[si]!.clears[linesCleared - 1] += 1;
  }

  const p2HasPlaced = state.p2HasPlaced || owner === 2;

  // Equalizer turn just ended → resolve game
  if (state.phase === 'equalizer') {
    return resolveEnd({ ...state, toppedOut: state.toppedOut, p2HasPlaced, lastClear, clearedRows: clearedRowIndices, stats }, board, scores);
  }

  // Normal turn: spawn next piece for the waiting player
  const nextActive: Owner = owner === 1 ? 2 : 1;
  const nextType = nextActive === 1 ? state.p1Next : state.p2Next;
  const nextPiece = spawnPiece(nextType);

  if (!isValid(nextPiece, board)) {
    // The player who just placed (owner) caused the top-out — they get the penalty.
    // The other player (nextActive) gets one equalizer turn.
    return handleTopOut({ ...state, lastClear, clearedRows: clearedRowIndices, stats }, board, scores, owner, p2HasPlaced);
  }

  // Draw a replacement "next" piece for the player who just locked
  const { bag, bagHead, next: freshNext } = drawNext(state);
  const p1Next = owner === 1 ? freshNext : state.p1Next;
  const p2Next = owner === 2 ? freshNext : state.p2Next;

  return {
    ...state,
    board,
    active: nextActive,
    piece: nextPiece,
    isGrounded: grounded(nextPiece, board),
    lockResets: 0,
    bag,
    bagHead,
    p1Next,
    p2Next,
    scores,
    p2HasPlaced,
    lastClear,
    clearedRows: clearedRowIndices,
    stats,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: Action): GameState {
  if (state.phase === 'ended') return state;

  switch (action.type) {
    case 'MOVE': {
      const moved = tryMove(state.piece, state.board, action.dc, 0);
      if (!moved) return state;
      const nowGrounded = grounded(moved, state.board);
      const lockResets = nowGrounded && state.isGrounded
        ? Math.min(state.lockResets + 1, CONFIG.LOCK_RESETS_MAX)
        : state.lockResets;
      return { ...state, piece: moved, isGrounded: nowGrounded, lockResets };
    }

    case 'ROTATE': {
      const rotated = tryRotate(state.piece, state.board, action.cw);
      if (!rotated) return state;
      const nowGrounded = grounded(rotated, state.board);
      const lockResets = nowGrounded && state.isGrounded
        ? Math.min(state.lockResets + 1, CONFIG.LOCK_RESETS_MAX)
        : state.lockResets;
      return { ...state, piece: rotated, isGrounded: nowGrounded, lockResets };
    }

    case 'SOFT_DROP': {
      const moved = tryMove(state.piece, state.board, 0, 1);
      if (!moved) return state;
      return { ...state, piece: moved, isGrounded: grounded(moved, state.board) };
    }

    case 'HARD_DROP': {
      const row = ghostRow(state.piece, state.board);
      const dropped = { ...state.piece, row };
      return doLock({ ...state, piece: dropped });
    }

    case 'GRAVITY': {
      const moved = tryMove(state.piece, state.board, 0, 1);
      if (!moved) {
        // Can't fall — piece is grounded; hook will start lock timer
        return { ...state, isGrounded: true };
      }
      return { ...state, piece: moved, isGrounded: grounded(moved, state.board) };
    }

    case 'LOCK': {
      if (!state.isGrounded) return state; // safety check
      return doLock(state);
    }
  }
}

// ── Initial state ─────────────────────────────────────────────────────────────

export function createInitialState(): GameState {
  const bag = generateBag(50);
  // bag[0] = P1's first piece (current)
  // bag[1] = P2's next preview
  // bag[2] = P1's next preview
  // bag[3+] = future draws
  const piece = spawnPiece(bag[0]!);
  return {
    board: emptyBoard(),
    active: 1,
    piece,
    isGrounded: false,
    lockResets: 0,
    bag,
    bagHead: 3,
    p1Next: bag[2]!,
    p2Next: bag[1]!,
    scores: [0, 0],
    phase: 'playing',
    toppedOut: null,
    winner: null,
    p2HasPlaced: false,
    lastClear: null,
    clearedRows: [],
    stats: [emptyStats(), emptyStats()],
  };
}

// ── Display helpers ───────────────────────────────────────────────────────────

export function computeDisplayBoard(state: GameState): Board {
  const display: CellValue[][] = state.board.map(row => [...row] as CellValue[]);
  const { ROWS: R, COLS: C } = CONFIG;

  // Ghost
  const gRow = ghostRow(state.piece, state.board);
  if (gRow !== state.piece.row) {
    const ghostVal: CellValue = state.active === 1 ? 'ghost1' : 'ghost2';
    for (const [dc, dr] of getShape(state.piece.type, state.piece.rot)) {
      const c = state.piece.col + dc;
      const r = gRow + dr;
      if (r >= 0 && r < R && c >= 0 && c < C && !display[r]![c]) {
        display[r]![c] = ghostVal;
      }
    }
  }

  // Active piece (drawn on top of ghost)
  for (const [dc, dr] of getShape(state.piece.type, state.piece.rot)) {
    const c = state.piece.col + dc;
    const r = state.piece.row + dr;
    if (r >= 0 && r < R && c >= 0 && c < C) {
      display[r]![c] = state.active;
    }
  }

  return display;
}

export function getBandIndex(score: number): number {
  const bands = CONFIG.SPEED_BANDS;
  let i = bands.length - 1;
  while (i > 0 && score < bands[i]!.minScore) i--;
  return i;
}

export function getGravityMs(score: number): number {
  return CONFIG.SPEED_BANDS[getBandIndex(score)]!.gravity;
}
