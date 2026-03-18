import type { Owner, TetrominoType, CellValue, Board, GameMode } from '../types';
import type { PieceState, SettledBoard } from './board';
import { emptyBoard, spawnPiece, isValid, tryMove, tryRotate, lockPiece, clearLines, ghostRow, extendBoard } from './board';
import { generateBag, getShape } from './pieces';
import { CONFIG } from '../config';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlayerStats {
  basePoints: number;    // points from clearing own blocks
  bonusPoints: number;   // points from clearing opponent blocks
  clears: [number, number, number, number]; // [singles, doubles, triples, quads]
  piecesPlaced: number;  // total pieces locked by this player
}

function emptyStats(): PlayerStats {
  return { basePoints: 0, bonusPoints: 0, clears: [0, 0, 0, 0], piecesPlaced: 0 };
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
  // Blind mode: second queued piece per player (shown only to the owning player)
  p1Next2?: TetrominoType;
  p2Next2?: TetrominoType;

  scores: [number, number];

  phase: 'playing' | 'equalizer' | 'ended';
  toppedOut: [boolean, boolean]; // per-player top-out flags
  winner: Owner | null;

  // Opening visibility rule: hide P1's next piece until P2 completes first placement
  p2HasPlaced: boolean;

  // Last line-clear info for score popup
  lastClear: { base: number; bonus: number; player: Owner; id: number } | null;

  // Row indices that were just cleared (for animation); empty when no clear
  clearedRows: number[];

  // Per-player cumulative stats for end screen
  stats: [PlayerStats, PlayerStats];

  // Extra turn mechanic: true if the active player is on their bonus turn
  isBonusTurn: boolean;

  // Game mode
  gameMode: GameMode;
  // Hundred mode: pieces remaining per player (counts down from 100)
  piecesRemaining?: [number, number];
  // Five-minute mode: game start timestamp (Date.now())
  gameStartTime?: number;
}

export type Action =
  | { type: 'MOVE'; dc: number }
  | { type: 'ROTATE'; cw: boolean }
  | { type: 'SOFT_DROP' }
  | { type: 'HARD_DROP' }
  | { type: 'GRAVITY' }   // periodic downward tick
  | { type: 'LOCK' }      // lock delay expired
  | { type: 'TIMER_END' }; // five-minute mode: time expired

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

export function getTopOutPenalty(score: number): number {
  return CONFIG.TOPOUT_PENALTIES[getBandIndex(score)] ?? 0;
}

function resolveEnd(state: GameState, board: SettledBoard, scores: [number, number]): GameState {
  const winner: Owner | null = scores[0] > scores[1] ? 1 : scores[1] > scores[0] ? 2 : null;
  return { ...state, board, scores, phase: 'ended', winner };
}

function handleTopOut(
  state: GameState,
  board: SettledBoard,
  scores: [number, number],
  toppedPlayer: Owner,
  p2HasPlaced: boolean,
): GameState {
  // Hundred/fivemin mode: no top-out, extend the board upward instead
  if (state.gameMode === 'hundred' || state.gameMode === 'fivemin') {
    return extendBoardAndSpawn(state, board, scores, p2HasPlaced);
  }

  const topped: [boolean, boolean] = [state.toppedOut[0], state.toppedOut[1]];
  topped[toppedPlayer - 1] = true;

  // First top-out → give opponent their equalizing turn
  if (state.phase === 'playing') {
    const equalizer: Owner = toppedPlayer === 1 ? 2 : 1;
    // Use the topped player's next piece (the equalizer player's piece is the one that failed to spawn)
    const equalizerType = toppedPlayer === 1 ? state.p1Next : state.p2Next;
    const equalizerPiece = spawnPiece(equalizerType);

    if (!isValid(equalizerPiece, board)) {
      // Equalizer can't even spawn — both players topped out
      topped[equalizer - 1] = true;
      return resolveEnd({ ...state, toppedOut: topped, p2HasPlaced }, board, scores);
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
      toppedOut: topped,
      p2HasPlaced,
    };
  }

  // Already in equalizer → end now
  return resolveEnd({ ...state, toppedOut: topped }, board, scores);
}

/** Hundred mode: extend board upward so the piece can spawn, then retry. */
function extendBoardAndSpawn(
  state: GameState,
  board: SettledBoard,
  scores: [number, number],
  p2HasPlaced: boolean,
): GameState {
  // Add 4 rows at the top to make room
  const extended = extendBoard(board, 4);

  const nextActive: Owner = state.active === 1 ? 2 : 1;
  const nextType = nextActive === 1 ? state.p1Next : state.p2Next;
  const nextPiece = spawnPiece(nextType);

  // Piece should now fit on the extended board
  if (!isValid(nextPiece, extended)) {
    // Still can't spawn even with 4 extra rows — extend more
    const bigger = extendBoard(extended, 4);
    const retryPiece = spawnPiece(nextType);
    if (!isValid(retryPiece, bigger)) {
      return resolveEnd(state, bigger, scores);
    }
    return finishHundredTurnSwitch(state, bigger, retryPiece, nextActive, scores, p2HasPlaced);
  }

  return finishHundredTurnSwitch(state, extended, nextPiece, nextActive, scores, p2HasPlaced);
}

function finishHundredTurnSwitch(
  state: GameState,
  board: SettledBoard,
  nextPiece: PieceState,
  nextActive: Owner,
  scores: [number, number],
  p2HasPlaced: boolean,
): GameState {
  const draw1 = drawNext(state);
  const p1Next = state.active === 1 ? state.p1Next : draw1.next;
  const p2Next = state.active === 2 ? state.p2Next : draw1.next;

  return {
    ...state,
    board,
    active: nextActive,
    piece: nextPiece,
    isGrounded: grounded(nextPiece, board),
    lockResets: 0,
    bag: draw1.bag,
    bagHead: draw1.bagHead,
    p1Next,
    p2Next,
    scores,
    p2HasPlaced,
    lastClear: state.lastClear,
    clearedRows: [],
    stats: state.stats,
    isBonusTurn: false,
  };
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
  const si = owner - 1;
  stats[si]!.piecesPlaced += 1;
  if (linesCleared > 0) {
    stats[si]!.basePoints += base;
    stats[si]!.bonusPoints += bonus;
    stats[si]!.clears[linesCleared - 1] += 1;
  }

  const p2HasPlaced = state.p2HasPlaced || owner === 2;

  // Equalizer turn just ended → resolve game
  if (state.phase === 'equalizer') {
    return resolveEnd({ ...state, toppedOut: state.toppedOut, p2HasPlaced, lastClear, clearedRows: clearedRowIndices, stats }, board, scores);
  }

  // Hundred mode: decrement pieces remaining, end when both players hit 0
  let piecesRemaining = state.piecesRemaining;
  if (state.gameMode === 'hundred' && piecesRemaining) {
    piecesRemaining = [piecesRemaining[0], piecesRemaining[1]] as [number, number];
    piecesRemaining[owner - 1] = Math.max(0, piecesRemaining[owner - 1] - 1);

    // If this player just placed their last piece, check if both are done
    if (piecesRemaining[0] === 0 && piecesRemaining[1] === 0) {
      return resolveEnd({ ...state, p2HasPlaced, lastClear, clearedRows: clearedRowIndices, stats, piecesRemaining }, board, scores);
    }
    // If only this player is done, the other player still gets turns
    // (handled in turn switch: skip the finished player)
  }

  // Extra turn mechanic: if lines cleared and not already on bonus turn, same player goes again
  const earnedBonusTurn = linesCleared > 0 && !state.isBonusTurn;

  // Hundred mode: if this player has no pieces left, skip their bonus turn
  if (earnedBonusTurn && state.gameMode === 'hundred' && piecesRemaining && piecesRemaining[owner - 1] === 0) {
    // Don't grant bonus turn — player is out of pieces
  } else if (earnedBonusTurn) {
    // Same player gets another turn — spawn their own next piece
    const nextType = owner === 1 ? state.p1Next : state.p2Next;
    const nextPiece = spawnPiece(nextType);

    if (!isValid(nextPiece, board)) {
      return handleTopOut({ ...state, lastClear, clearedRows: clearedRowIndices, stats, piecesRemaining }, board, scores, owner, p2HasPlaced);
    }

    // Draw a replacement next for this player
    // Blind mode: shift next2 → next, draw fresh next2
    if (state.gameMode === 'blind') {
      const draw1 = drawNext(state);
      const p1Next = owner === 1 ? (state.p1Next2 ?? draw1.next) : state.p1Next;
      const p2Next = owner === 2 ? (state.p2Next2 ?? draw1.next) : state.p2Next;
      const p1Next2 = owner === 1 ? draw1.next : state.p1Next2;
      const p2Next2 = owner === 2 ? draw1.next : state.p2Next2;
      return {
        ...state,
        board,
        active: owner,
        piece: nextPiece,
        isGrounded: grounded(nextPiece, board),
        lockResets: 0,
        bag: draw1.bag,
        bagHead: draw1.bagHead,
        p1Next, p2Next, p1Next2, p2Next2,
        scores, p2HasPlaced, lastClear,
        clearedRows: clearedRowIndices,
        stats, piecesRemaining,
        isBonusTurn: true,
      };
    }

    const draw1 = drawNext(state);
    const p1Next = owner === 1 ? draw1.next : state.p1Next;
    const p2Next = owner === 2 ? draw1.next : state.p2Next;

    return {
      ...state,
      board,
      active: owner, // same player
      piece: nextPiece,
      isGrounded: grounded(nextPiece, board),
      lockResets: 0,
      bag: draw1.bag,
      bagHead: draw1.bagHead,
      p1Next,
      p2Next,
      scores,
      p2HasPlaced,
      lastClear,
      clearedRows: clearedRowIndices,
      stats,
      piecesRemaining,
      isBonusTurn: true,
    };
  }

  // Normal turn switch: spawn next piece for the waiting player
  let nextActive: Owner = owner === 1 ? 2 : 1;

  // Hundred mode: if the next player has no pieces, keep current player (or end if both done)
  if (state.gameMode === 'hundred' && piecesRemaining) {
    if (piecesRemaining[nextActive - 1] === 0 && piecesRemaining[owner - 1] === 0) {
      return resolveEnd({ ...state, p2HasPlaced, lastClear, clearedRows: clearedRowIndices, stats, piecesRemaining }, board, scores);
    }
    if (piecesRemaining[nextActive - 1] === 0) {
      nextActive = owner; // other player is done, current player continues
    }
  }

  // Proactively extend the board if pieces are near the top (hundred/fivemin modes)
  if (state.gameMode === 'hundred' || state.gameMode === 'fivemin') {
    let highestRow = board.length;
    for (let r = 0; r < board.length; r++) {
      if (board[r]!.some(c => c !== null)) { highestRow = r; break; }
    }
    // If highest settled piece is within 4 rows of the top, add breathing room
    if (highestRow < 4) {
      board = extendBoard(board, 6);
    }
  }

  const nextType = nextActive === 1 ? state.p1Next : state.p2Next;
  const nextPiece = spawnPiece(nextType);

  if (!isValid(nextPiece, board)) {
    return handleTopOut({ ...state, lastClear, clearedRows: clearedRowIndices, stats, piecesRemaining }, board, scores, owner, p2HasPlaced);
  }

  // Draw one replacement "next" piece for the now-active player (whose next was just consumed/spawned).
  // The locking player's next stays unchanged — they already saw it during their turn.
  // Blind mode: shift the now-active player's next2 → next, draw fresh next2
  if (state.gameMode === 'blind') {
    const draw1 = drawNext(state);
    // nextActive's next was consumed (spawned). Shift their next2 → next, draw new next2.
    const p1Next = nextActive === 1 ? (state.p1Next2 ?? draw1.next) : state.p1Next;
    const p2Next = nextActive === 2 ? (state.p2Next2 ?? draw1.next) : state.p2Next;
    const p1Next2 = nextActive === 1 ? draw1.next : state.p1Next2;
    const p2Next2 = nextActive === 2 ? draw1.next : state.p2Next2;
    return {
      ...state,
      board,
      active: nextActive,
      piece: nextPiece,
      isGrounded: grounded(nextPiece, board),
      lockResets: 0,
      bag: draw1.bag,
      bagHead: draw1.bagHead,
      p1Next, p2Next, p1Next2, p2Next2,
      scores, p2HasPlaced, lastClear,
      clearedRows: clearedRowIndices,
      stats, piecesRemaining,
      isBonusTurn: false,
    };
  }

  const draw1 = drawNext(state);
  const bag = draw1.bag;
  const bagHead = draw1.bagHead;
  const p1Next = owner === 1 ? state.p1Next : draw1.next;
  const p2Next = owner === 2 ? state.p2Next : draw1.next;

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
    piecesRemaining,
    isBonusTurn: false,
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
      // Five-minute mode: if time expired, lock the current piece and end the game
      const locked = doLock(state);
      if (state.gameMode === 'fivemin' && state.gameStartTime &&
          Date.now() - state.gameStartTime >= 5 * 60 * 1000 &&
          locked.phase !== 'ended') {
        return resolveEnd(locked, locked.board, locked.scores);
      }
      return locked;
    }

    case 'TIMER_END': {
      // Five-minute mode: lock current piece if grounded and end the game
      if (state.isGrounded) {
        const locked = doLock(state);
        return resolveEnd(locked, locked.board, locked.scores);
      }
      return resolveEnd(state, state.board, state.scores);
    }
  }
}

// ── Initial state ─────────────────────────────────────────────────────────────

export function createInitialState(gameMode: GameMode = 'classic'): GameState {
  const bag = generateBag(50);
  // bag[0] = P1's first piece (current)
  // bag[1] = P2's next preview
  // bag[2] = P1's next preview
  // Blind mode also draws: bag[3] = P1's next2, bag[4] = P2's next2
  const piece = spawnPiece(bag[0]!);
  const isBlind = gameMode === 'blind';
  return {
    board: emptyBoard(),
    active: 1,
    piece,
    isGrounded: false,
    lockResets: 0,
    bag,
    bagHead: isBlind ? 5 : 3,
    p1Next: bag[2]!,
    p2Next: bag[1]!,
    ...(isBlind ? { p1Next2: bag[3]!, p2Next2: bag[4]! } : {}),
    scores: [0, 0],
    phase: 'playing',
    toppedOut: [false, false],
    winner: null,
    p2HasPlaced: false,
    lastClear: null,
    clearedRows: [],
    stats: [emptyStats(), emptyStats()],
    isBonusTurn: false,
    gameMode,
    ...(gameMode === 'hundred' ? { piecesRemaining: [100, 100] as [number, number] } : {}),
    ...(gameMode === 'fivemin' ? { gameStartTime: Date.now() } : {}),
  };
}

// ── Display helpers ───────────────────────────────────────────────────────────

export function computeDisplayBoard(state: GameState): Board {
  const display: CellValue[][] = state.board.map(row => [...row] as CellValue[]);
  const R = state.board.length;
  const C = CONFIG.COLS;

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

/**
 * For modes with growing boards (hundred, fivemin), extract a CONFIG.ROWS-sized
 * viewport from the full display board. The viewport auto-scrolls so the highest
 * occupied row sits roughly 40% down the viewport, giving space above to maneuver.
 * Returns { viewport, offset } where offset is the first row index shown.
 */
export function getViewport(displayBoard: Board, state: GameState): { viewport: Board; offset: number } {
  const totalRows = displayBoard.length;
  const viewRows = CONFIG.ROWS;

  // Board fits in viewport — no scrolling needed
  if (totalRows <= viewRows) {
    return { viewport: displayBoard, offset: 0 };
  }

  // Find the highest occupied row (smallest index with any content)
  let highestOccupied = totalRows;
  for (let r = 0; r < totalRows; r++) {
    if (displayBoard[r]!.some(cell => cell !== null)) {
      highestOccupied = r;
      break;
    }
  }

  // Also consider the active piece position (it may be above settled pieces)
  const pieceTop = Math.min(
    ...getShape(state.piece.type, state.piece.rot).map(([, dr]) => state.piece.row + dr),
  );
  const topOfAction = Math.min(highestOccupied, pieceTop);

  // Position viewport so topOfAction sits ~40% down (row 8 of 20)
  // This leaves ~8 rows of breathing room above
  const targetViewRow = Math.floor(viewRows * 0.4);
  let offset = topOfAction - targetViewRow;

  // Clamp: don't go above the board, and ensure we show at least viewRows
  offset = Math.max(0, offset);
  offset = Math.min(offset, totalRows - viewRows);

  const viewport = displayBoard.slice(offset, offset + viewRows);
  return { viewport, offset };
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
