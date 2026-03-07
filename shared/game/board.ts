import type { Owner, TetrominoType } from '../types';
import type { Rotation, Cell } from './pieces';
import { getShape, getKicks, SPAWN_COL, SPAWN_ROW } from './pieces';
import { CONFIG } from '../config';

const { COLS, ROWS } = CONFIG;

export type SettledBoard = (Owner | null)[][];

export interface PieceState {
  type: TetrominoType;
  rot: Rotation;
  col: number; // origin column (top-left of bounding box)
  row: number; // origin row
}

export function emptyBoard(): SettledBoard {
  return Array.from({ length: ROWS }, () => new Array<Owner | null>(COLS).fill(null));
}

export function getCells(piece: PieceState): Cell[] {
  return getShape(piece.type, piece.rot).map(([dc, dr]) => [piece.col + dc, piece.row + dr]);
}

export function isValid(piece: PieceState, board: SettledBoard): boolean {
  for (const [c, r] of getCells(piece)) {
    if (c < 0 || c >= COLS || r >= ROWS) return false;
    if (r >= 0 && board[r]![c] !== null) return false;
    // r < 0 is fine — piece partially above the visible board
  }
  return true;
}

export function spawnPiece(type: TetrominoType): PieceState {
  return { type, rot: 0, col: SPAWN_COL[type], row: SPAWN_ROW[type] };
}

export function ghostRow(piece: PieceState, board: SettledBoard): number {
  let drop = 0;
  while (isValid({ ...piece, row: piece.row + drop + 1 }, board)) drop++;
  return piece.row + drop;
}

export function tryMove(piece: PieceState, board: SettledBoard, dc: number, dr: number): PieceState | null {
  const moved = { ...piece, col: piece.col + dc, row: piece.row + dr };
  return isValid(moved, board) ? moved : null;
}

export function tryRotate(piece: PieceState, board: SettledBoard, cw: boolean): PieceState | null {
  const nextRot = ((piece.rot + (cw ? 1 : 3)) % 4) as Rotation;
  const kicks = getKicks(piece.type, piece.rot, nextRot);
  for (const [dc, dr] of kicks) {
    const candidate = { ...piece, rot: nextRot, col: piece.col + dc, row: piece.row + dr };
    if (isValid(candidate, board)) return candidate;
  }
  return null;
}

export function lockPiece(piece: PieceState, board: SettledBoard, owner: Owner): SettledBoard {
  const next = board.map(row => [...row]) as SettledBoard;
  for (const [c, r] of getCells(piece)) {
    if (r >= 0 && r < ROWS) next[r]![c] = owner;
  }
  return next;
}

export interface ClearResult {
  board: SettledBoard;
  linesCleared: number;
  opponentCellsCleared: number;
  clearedRowIndices: number[];
}

export function clearLines(board: SettledBoard, scorer: Owner): ClearResult {
  const opponent: Owner = scorer === 1 ? 2 : 1;
  let linesCleared = 0;
  let opponentCellsCleared = 0;
  const clearedRowIndices: number[] = [];

  const kept = board.filter((row, idx) => {
    const full = row.every(cell => cell !== null);
    if (full) {
      linesCleared++;
      opponentCellsCleared += row.filter(c => c === opponent).length;
      clearedRowIndices.push(idx);
    }
    return !full;
  });

  while (kept.length < ROWS) kept.unshift(new Array<Owner | null>(COLS).fill(null));
  return { board: kept as SettledBoard, linesCleared, opponentCellsCleared, clearedRowIndices };
}
