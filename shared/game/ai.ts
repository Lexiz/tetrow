import type { Owner, TetrominoType } from '../types';
import type { SettledBoard, PieceState } from './board';
import type { Rotation } from './pieces';
import { getShape, SPAWN_COL, SPAWN_ROW } from './pieces';
import { isValid, lockPiece, clearLines } from './board';
import { CONFIG } from '../config';

export type AiDifficulty = 'easy' | 'medium' | 'hard';

interface Placement {
  col: number;
  rot: Rotation;
  row: number; // hard-drop landing row
}

/**
 * Given a board and a piece type, return the sequence of actions the AI should
 * take. Returns the best placement (col, rotation, row) that the AI selects.
 */
export function aiFindPlacement(
  board: SettledBoard,
  pieceType: TetrominoType,
  owner: Owner,
  difficulty: AiDifficulty,
): Placement | null {
  const placements = getAllPlacements(board, pieceType);
  if (placements.length === 0) return null;

  // Score each placement
  const scored = placements.map((p) => ({
    placement: p,
    score: evaluatePlacement(board, p, pieceType, owner, difficulty),
  }));

  // Sort best first
  scored.sort((a, b) => b.score - a.score);

  // Add randomness based on difficulty
  switch (difficulty) {
    case 'easy': {
      // Pick from top 60% of placements randomly
      const poolSize = Math.max(1, Math.ceil(scored.length * 0.6));
      return scored[Math.floor(Math.random() * poolSize)]!.placement;
    }
    case 'medium': {
      // Pick from top 3 with weighted probability
      const top = scored.slice(0, Math.min(3, scored.length));
      const weights = [0.6, 0.3, 0.1];
      const r = Math.random();
      let cum = 0;
      for (let i = 0; i < top.length; i++) {
        cum += weights[i] ?? 0;
        if (r < cum) return top[i]!.placement;
      }
      return top[0]!.placement;
    }
    case 'hard': {
      // Always pick the best, occasionally second best
      if (scored.length > 1 && Math.random() < 0.1) return scored[1]!.placement;
      return scored[0]!.placement;
    }
  }
}

function getAllPlacements(board: SettledBoard, type: TetrominoType): Placement[] {
  const results: Placement[] = [];
  const rotations: Rotation[] = type === 'O' ? [0] : [0, 1, 2, 3];

  for (const rot of rotations) {
    const shape = getShape(type, rot);
    const minDc = Math.min(...shape.map(([dc]) => dc));
    const maxDc = Math.max(...shape.map(([dc]) => dc));

    // Try every column where the piece fits
    for (let col = -minDc; col < CONFIG.COLS - maxDc; col++) {
      const piece: PieceState = { type, rot, col, row: SPAWN_ROW[type] };
      if (!isValid(piece, board)) continue;

      // Drop to the lowest valid row
      let row = piece.row;
      while (isValid({ ...piece, row: row + 1 }, board)) row++;

      results.push({ col, rot, row });
    }
  }
  return results;
}

function evaluatePlacement(
  board: SettledBoard,
  placement: Placement,
  type: TetrominoType,
  owner: Owner,
  difficulty: AiDifficulty,
): number {
  // Simulate the placement
  const piece: PieceState = { type, rot: placement.rot, col: placement.col, row: placement.row };
  const locked = lockPiece(piece, board, owner);
  const { board: cleared, linesCleared, opponentCellsCleared } = clearLines(locked, owner);

  // Board metrics
  const heights = getColumnHeights(cleared);
  const aggregateHeight = heights.reduce((a, b) => a + b, 0);
  const holes = countHoles(cleared);
  const bumpiness = getBumpiness(heights);
  const maxHeight = Math.max(...heights);

  // Weights vary by difficulty
  let score = 0;

  switch (difficulty) {
    case 'easy':
      // Only cares about lines cleared, loosely avoids extreme height
      score += linesCleared * 100;
      score -= maxHeight * 2;
      score -= holes * 5;
      break;

    case 'medium':
      // Balanced heuristics
      score += linesCleared * 200;
      score += opponentCellsCleared * 15;
      score -= aggregateHeight * 3;
      score -= holes * 50;
      score -= bumpiness * 10;
      score -= maxHeight * 5;
      break;

    case 'hard':
      // Strong evaluation with opponent cell awareness
      score += linesCleared * 300;
      score += (linesCleared >= 4 ? 500 : 0); // Tetris bonus
      score += opponentCellsCleared * 25;
      score -= aggregateHeight * 4;
      score -= holes * 80;
      score -= bumpiness * 15;
      score -= maxHeight * 8;
      // Penalize creating overhangs
      score -= countOverhangs(cleared) * 30;
      break;
  }

  return score;
}

function getColumnHeights(board: SettledBoard): number[] {
  const heights: number[] = [];
  for (let c = 0; c < CONFIG.COLS; c++) {
    let h = 0;
    for (let r = 0; r < CONFIG.ROWS; r++) {
      if (board[r]![c] !== null) {
        h = CONFIG.ROWS - r;
        break;
      }
    }
    heights.push(h);
  }
  return heights;
}

function countHoles(board: SettledBoard): number {
  let holes = 0;
  for (let c = 0; c < CONFIG.COLS; c++) {
    let foundBlock = false;
    for (let r = 0; r < CONFIG.ROWS; r++) {
      if (board[r]![c] !== null) foundBlock = true;
      else if (foundBlock) holes++;
    }
  }
  return holes;
}

function getBumpiness(heights: number[]): number {
  let bump = 0;
  for (let i = 0; i < heights.length - 1; i++) {
    bump += Math.abs(heights[i]! - heights[i + 1]!);
  }
  return bump;
}

function countOverhangs(board: SettledBoard): number {
  let overhangs = 0;
  for (let c = 0; c < CONFIG.COLS; c++) {
    let foundBlock = false;
    for (let r = 0; r < CONFIG.ROWS; r++) {
      if (board[r]![c] !== null) foundBlock = true;
      else if (foundBlock) {
        // Check if there's a block directly to left or right above this hole
        if (c > 0 && board[r]![c - 1] !== null) overhangs++;
        if (c < CONFIG.COLS - 1 && board[r]![c + 1] !== null) overhangs++;
      }
    }
  }
  return overhangs;
}
