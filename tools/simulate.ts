/**
 * Game simulation harness — runs matches using the real engine.
 * Each "AI" picks moves by evaluating all possible placements and scoring them.
 *
 * Usage: npx tsx sim/simulate.ts <scenario>
 * Scenarios: baseline, aggressive-vs-defensive, quad-hunter, bonus-hunter,
 *            topout-penalty, early-topout, pacing, mirror-match, mixed-strategy, endurance
 */

import { gameReducer, createInitialState, type GameState, type PlayerStats } from '../shared/game/engine';
import { isValid, ghostRow, tryMove, tryRotate, type PieceState, type SettledBoard, getCells } from '../shared/game/board';
import type { Rotation } from '../shared/game/pieces';
import type { Owner } from '../shared/types';
import { CONFIG } from '../shared/config';

// ── AI Placement Finder ──────────────────────────────────────────────────────

interface Placement {
  col: number;
  rot: Rotation;
  score: number;
}

function allPlacements(piece: PieceState, board: SettledBoard, owner: Owner, weights: Weights): Placement[] {
  const placements: Placement[] = [];
  for (const rot of [0, 1, 2, 3] as Rotation[]) {
    const rotated = { ...piece, rot };
    // Try all column positions
    for (let col = -2; col <= CONFIG.COLS + 2; col++) {
      const candidate = { ...rotated, col };
      if (!isValid(candidate, board)) continue;
      // Drop to bottom
      const dropRow = ghostRow(candidate, board);
      const dropped = { ...candidate, row: dropRow };
      if (!isValid(dropped, board)) continue;

      const evalScore = evaluatePlacement(dropped, board, owner, weights);
      placements.push({ col, rot, score: evalScore });
    }
  }
  return placements;
}

interface Weights {
  heightPenalty: number;    // per row of max height
  holesPenalty: number;     // per hole
  linesClearReward: number; // per line cleared
  quadBonus: number;        // extra reward for 4-line clear
  bumpinessPenalty: number; // per column height difference
  opponentCellBonus: number; // reward for clearing opponent cells
  wellBonus: number;        // reward for maintaining a well for tetrises
}

function evaluatePlacement(piece: PieceState, board: SettledBoard, owner: Owner, w: Weights): number {
  // Simulate locking
  const simBoard = board.map(r => [...r]) as SettledBoard;
  for (const [c, r] of getCells(piece)) {
    if (r >= 0 && r < CONFIG.ROWS && c >= 0 && c < CONFIG.COLS) {
      simBoard[r]![c] = owner;
    }
  }

  // Count lines cleared and opponent cells
  const opponent: Owner = owner === 1 ? 2 : 1;
  let linesCleared = 0;
  let opponentCells = 0;
  const kept = simBoard.filter(row => {
    const full = row.every(cell => cell !== null);
    if (full) {
      linesCleared++;
      opponentCells += row.filter(c => c === opponent).length;
    }
    return !full;
  });
  while (kept.length < CONFIG.ROWS) kept.unshift(new Array(CONFIG.COLS).fill(null));

  // Evaluate resulting board
  const heights = new Array(CONFIG.COLS).fill(0);
  for (let c = 0; c < CONFIG.COLS; c++) {
    for (let r = 0; r < CONFIG.ROWS; r++) {
      if (kept[r]![c] !== null) { heights[c] = CONFIG.ROWS - r; break; }
    }
  }

  const maxHeight = Math.max(...heights);

  let holes = 0;
  for (let c = 0; c < CONFIG.COLS; c++) {
    let foundBlock = false;
    for (let r = 0; r < CONFIG.ROWS; r++) {
      if (kept[r]![c] !== null) foundBlock = true;
      else if (foundBlock) holes++;
    }
  }

  let bumpiness = 0;
  for (let c = 0; c < CONFIG.COLS - 1; c++) {
    bumpiness += Math.abs(heights[c]! - heights[c + 1]!);
  }

  // Well detection (column 9 being lower than neighbors = good for tetris)
  let wellDepth = 0;
  const rightCol = CONFIG.COLS - 1;
  if (heights[rightCol]! < heights[rightCol - 1]!) {
    wellDepth = heights[rightCol - 1]! - heights[rightCol]!;
  }

  let score = 0;
  score -= maxHeight * w.heightPenalty;
  score -= holes * w.holesPenalty;
  score += linesCleared * w.linesClearReward;
  score += (linesCleared === 4 ? 1 : 0) * w.quadBonus;
  score -= bumpiness * w.bumpinessPenalty;
  score += opponentCells * w.opponentCellBonus;
  score += wellDepth * w.wellBonus;

  return score;
}

// ── Strategy Presets ─────────────────────────────────────────────────────────

const STRATEGIES = {
  balanced: {
    heightPenalty: 3,
    holesPenalty: 8,
    linesClearReward: 5,
    quadBonus: 15,
    bumpinessPenalty: 2,
    opponentCellBonus: 1,
    wellBonus: 2,
  } as Weights,

  aggressive: {
    heightPenalty: 1,
    holesPenalty: 4,
    linesClearReward: 10,
    quadBonus: 30,
    bumpinessPenalty: 1,
    opponentCellBonus: 3,
    wellBonus: 5,
  } as Weights,

  defensive: {
    heightPenalty: 6,
    holesPenalty: 12,
    linesClearReward: 2,
    quadBonus: 5,
    bumpinessPenalty: 4,
    opponentCellBonus: 0,
    wellBonus: 0,
  } as Weights,

  quadHunter: {
    heightPenalty: 2,
    holesPenalty: 6,
    linesClearReward: 1,
    quadBonus: 50,
    bumpinessPenalty: 1,
    opponentCellBonus: 1,
    wellBonus: 8,
  } as Weights,

  bonusHunter: {
    heightPenalty: 3,
    holesPenalty: 7,
    linesClearReward: 4,
    quadBonus: 10,
    bumpinessPenalty: 2,
    opponentCellBonus: 8,
    wellBonus: 1,
  } as Weights,

  reckless: {
    heightPenalty: 0.5,
    holesPenalty: 2,
    linesClearReward: 8,
    quadBonus: 20,
    bumpinessPenalty: 0.5,
    opponentCellBonus: 2,
    wellBonus: 3,
  } as Weights,
};

// ── Game Simulation ──────────────────────────────────────────────────────────

function simulateGame(p1Strategy: Weights, p2Strategy: Weights): {
  winner: Owner | null;
  scores: [number, number];
  stats: [PlayerStats, PlayerStats];
  toppedOut: [boolean, boolean];
  totalTurns: number;
} {
  let state = createInitialState();
  let turns = 0;
  const MAX_TURNS = 500; // safety limit

  while (state.phase !== 'ended' && turns < MAX_TURNS) {
    const strategy = state.active === 1 ? p1Strategy : p2Strategy;
    const placements = allPlacements(state.piece, state.board, state.active, strategy);

    if (placements.length === 0) {
      // Can't place — just hard drop in place
      state = gameReducer(state, { type: 'HARD_DROP' });
      turns++;
      continue;
    }

    // Pick best placement
    placements.sort((a, b) => b.score - a.score);
    const best = placements[0]!;

    // Execute: rotate to target rotation
    let current = state;
    const targetRot = best.rot;
    while (current.piece.rot !== targetRot && current.phase !== 'ended') {
      current = gameReducer(current, { type: 'ROTATE', cw: true });
    }

    // Move to target column
    while (current.piece.col !== best.col && current.phase !== 'ended') {
      const dc = best.col > current.piece.col ? 1 : -1;
      const moved = gameReducer(current, { type: 'MOVE', dc });
      if (moved.piece.col === current.piece.col) break; // stuck
      current = moved;
    }

    // Hard drop
    current = gameReducer(current, { type: 'HARD_DROP' });
    state = current;
    turns++;
  }

  // If we hit MAX_TURNS, force end
  if (state.phase !== 'ended') {
    return {
      winner: null,
      scores: state.scores,
      stats: state.stats,
      toppedOut: [false, false],
      totalTurns: turns,
    };
  }

  return {
    winner: state.winner,
    scores: state.scores,
    stats: state.stats,
    toppedOut: state.toppedOut,
    totalTurns: turns,
  };
}

// ── Scenarios ────────────────────────────────────────────────────────────────

function runScenario(name: string, p1: Weights, p2: Weights, numGames: number = 20) {
  const results = {
    p1Wins: 0, p2Wins: 0, draws: 0,
    p1Scores: [] as number[], p2Scores: [] as number[],
    p1TopOuts: 0, p2TopOuts: 0,
    totalTurns: [] as number[],
    p1Stats: { basePoints: 0, bonusPoints: 0, clears: [0, 0, 0, 0] as [number, number, number, number], piecesPlaced: 0 },
    p2Stats: { basePoints: 0, bonusPoints: 0, clears: [0, 0, 0, 0] as [number, number, number, number], piecesPlaced: 0 },
  };

  for (let i = 0; i < numGames; i++) {
    const r = simulateGame(p1, p2);
    if (r.winner === 1) results.p1Wins++;
    else if (r.winner === 2) results.p2Wins++;
    else results.draws++;

    results.p1Scores.push(r.scores[0]);
    results.p2Scores.push(r.scores[1]);
    results.totalTurns.push(r.totalTurns);

    if (r.toppedOut[0]) results.p1TopOuts++;
    if (r.toppedOut[1]) results.p2TopOuts++;

    results.p1Stats.basePoints += r.stats[0].basePoints;
    results.p1Stats.bonusPoints += r.stats[0].bonusPoints;
    for (let j = 0; j < 4; j++) results.p1Stats.clears[j] += r.stats[0].clears[j]!;
    results.p2Stats.basePoints += r.stats[1].basePoints;
    results.p2Stats.bonusPoints += r.stats[1].bonusPoints;
    for (let j = 0; j < 4; j++) results.p2Stats.clears[j] += r.stats[1].clears[j]!;
  }

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const med = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)]! : 0;
  };

  console.log(`\n${'='.repeat(70)}`);
  console.log(`SCENARIO: ${name} (${numGames} games)`);
  console.log(`${'='.repeat(70)}`);
  console.log(`\nWin Rate:  P1=${results.p1Wins}  P2=${results.p2Wins}  Draw=${results.draws}`);
  console.log(`Top-outs:  P1=${results.p1TopOuts}  P2=${results.p2TopOuts}`);
  console.log(`\nScores (avg / median):`);
  console.log(`  P1: ${avg(results.p1Scores)} / ${med(results.p1Scores)}`);
  console.log(`  P2: ${avg(results.p2Scores)} / ${med(results.p2Scores)}`);
  console.log(`\nTurns per game: avg=${avg(results.totalTurns)} med=${med(results.totalTurns)}`);
  console.log(`\nP1 Cumulative Stats (avg per game):`);
  console.log(`  Base pts: ${Math.round(results.p1Stats.basePoints / numGames)}  Bonus pts: ${Math.round(results.p1Stats.bonusPoints / numGames)}`);
  console.log(`  Clears: 1L=${(results.p1Stats.clears[0] / numGames).toFixed(1)} 2L=${(results.p1Stats.clears[1] / numGames).toFixed(1)} 3L=${(results.p1Stats.clears[2] / numGames).toFixed(1)} 4L=${(results.p1Stats.clears[3] / numGames).toFixed(1)}`);
  console.log(`\nP2 Cumulative Stats (avg per game):`);
  console.log(`  Base pts: ${Math.round(results.p2Stats.basePoints / numGames)}  Bonus pts: ${Math.round(results.p2Stats.bonusPoints / numGames)}`);
  console.log(`  Clears: 1L=${(results.p2Stats.clears[0] / numGames).toFixed(1)} 2L=${(results.p2Stats.clears[1] / numGames).toFixed(1)} 3L=${(results.p2Stats.clears[2] / numGames).toFixed(1)} 4L=${(results.p2Stats.clears[3] / numGames).toFixed(1)}`);

  // Balance analysis
  const bonusRatio1 = results.p1Stats.bonusPoints / (results.p1Stats.basePoints || 1);
  const bonusRatio2 = results.p2Stats.bonusPoints / (results.p2Stats.basePoints || 1);
  console.log(`\nBonus-to-base ratio: P1=${(bonusRatio1 * 100).toFixed(1)}%  P2=${(bonusRatio2 * 100).toFixed(1)}%`);
  console.log(`Top-out rate: P1=${(results.p1TopOuts / numGames * 100).toFixed(0)}%  P2=${(results.p2TopOuts / numGames * 100).toFixed(0)}%`);

  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const scenario = process.argv[2] || 'baseline';

switch (scenario) {
  case 'baseline':
    runScenario('Balanced vs Balanced', STRATEGIES.balanced, STRATEGIES.balanced, 30);
    break;
  case 'aggressive-vs-defensive':
    runScenario('Aggressive vs Defensive', STRATEGIES.aggressive, STRATEGIES.defensive, 30);
    break;
  case 'quad-hunter':
    runScenario('Quad Hunter vs Balanced', STRATEGIES.quadHunter, STRATEGIES.balanced, 30);
    break;
  case 'bonus-hunter':
    runScenario('Bonus Hunter vs Balanced', STRATEGIES.bonusHunter, STRATEGIES.balanced, 30);
    break;
  case 'topout-penalty':
    runScenario('Reckless(tops out) vs Defensive', STRATEGIES.reckless, STRATEGIES.defensive, 30);
    break;
  case 'early-topout':
    runScenario('Reckless vs Reckless', STRATEGIES.reckless, STRATEGIES.reckless, 30);
    break;
  case 'pacing':
    runScenario('Defensive vs Defensive (long games)', STRATEGIES.defensive, STRATEGIES.defensive, 30);
    break;
  case 'mirror-match':
    runScenario('Aggressive vs Aggressive', STRATEGIES.aggressive, STRATEGIES.aggressive, 30);
    break;
  case 'mixed-strategy':
    runScenario('Quad Hunter vs Bonus Hunter', STRATEGIES.quadHunter, STRATEGIES.bonusHunter, 30);
    break;
  case 'endurance':
    runScenario('Balanced vs Quad Hunter (endurance)', STRATEGIES.balanced, STRATEGIES.quadHunter, 50);
    break;
  default:
    console.log('Unknown scenario:', scenario);
    process.exit(1);
}
