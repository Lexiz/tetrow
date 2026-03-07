import type { TetrominoType } from '../types';

export type Rotation = 0 | 1 | 2 | 3;
export type Cell = [number, number]; // [dc, dr] offset from piece origin

// 7 tetrominoes × 4 rotation states × 4 cells
// Cells are [dc, dr] from the piece's bounding-box origin (top-left)
const SHAPES: Record<TetrominoType, Cell[][]> = {
  I: [
    [[0,1],[1,1],[2,1],[3,1]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[1,0],[1,1],[1,2],[1,3]],
  ],
  O: [
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
  ],
  T: [
    [[1,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[2,1],[1,2]],
    [[1,0],[0,1],[1,1],[1,2]],
  ],
  S: [
    [[1,0],[2,0],[0,1],[1,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[1,1],[2,1],[0,2],[1,2]],
    [[0,0],[0,1],[1,1],[1,2]],
  ],
  Z: [
    [[0,0],[1,0],[1,1],[2,1]],
    [[2,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,0],[0,1],[1,1],[0,2]],
  ],
  J: [
    [[0,0],[0,1],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[0,2],[1,2]],
  ],
  L: [
    [[2,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,1],[0,2]],
    [[0,0],[1,0],[1,1],[1,2]],
  ],
};

// SRS wall kicks [dc, dr] — positive dc = right, positive dr = DOWN
// Source: Tetris guideline with y-axis flipped to match screen coordinates
const KICKS_JLSTZ: Record<string, Cell[]> = {
  '0>1': [[ 0,0],[-1, 0],[-1,-1],[0, 2],[-1, 2]],
  '1>0': [[ 0,0],[ 1, 0],[ 1, 1],[0,-2],[ 1,-2]],
  '1>2': [[ 0,0],[ 1, 0],[ 1, 1],[0,-2],[ 1,-2]],
  '2>1': [[ 0,0],[-1, 0],[-1,-1],[0, 2],[-1, 2]],
  '2>3': [[ 0,0],[ 1, 0],[ 1,-1],[0, 2],[ 1, 2]],
  '3>2': [[ 0,0],[-1, 0],[-1, 1],[0,-2],[-1,-2]],
  '3>0': [[ 0,0],[-1, 0],[-1, 1],[0,-2],[-1,-2]],
  '0>3': [[ 0,0],[ 1, 0],[ 1,-1],[0, 2],[ 1, 2]],
};

const KICKS_I: Record<string, Cell[]> = {
  '0>1': [[ 0,0],[-2, 0],[ 1, 0],[-2, 1],[ 1,-2]],
  '1>0': [[ 0,0],[ 2, 0],[-1, 0],[ 2,-1],[-1, 2]],
  '1>2': [[ 0,0],[-1, 0],[ 2, 0],[-1,-2],[ 2, 1]],
  '2>1': [[ 0,0],[ 1, 0],[-2, 0],[ 1, 2],[-2,-1]],
  '2>3': [[ 0,0],[ 2, 0],[-1, 0],[ 2,-1],[-1, 2]],
  '3>2': [[ 0,0],[-2, 0],[ 1, 0],[-2, 1],[ 1,-2]],
  '3>0': [[ 0,0],[ 1, 0],[-2, 0],[ 1, 2],[-2,-1]],
  '0>3': [[ 0,0],[-1, 0],[ 2, 0],[-1,-2],[ 2, 1]],
};

export function getShape(type: TetrominoType, rot: Rotation): Cell[] {
  return SHAPES[type][rot]!;
}

export function getKicks(type: TetrominoType, from: Rotation, to: Rotation): Cell[] {
  const key = `${from}>${to}`;
  if (type === 'I') return KICKS_I[key] ?? [[0, 0]];
  if (type === 'O') return [[0, 0]];
  return KICKS_JLSTZ[key] ?? [[0, 0]];
}

// Spawn origin (top-left of bounding box) for each piece type
export const SPAWN_COL: Record<TetrominoType, number> = {
  I: 3, O: 3, T: 3, S: 3, Z: 3, J: 3, L: 3,
};
export const SPAWN_ROW: Record<TetrominoType, number> = {
  I: -1, O: 0, T: 0, S: 0, Z: 0, J: 0, L: 0,
};

const ALL_TYPES: TetrominoType[] = ['I','O','T','S','Z','J','L'];

function shuffleBag(): TetrominoType[] {
  const bag = [...ALL_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j]!, bag[i]!];
  }
  return bag;
}

export function generateBag(minLength = 14): TetrominoType[] {
  const result: TetrominoType[] = [];
  while (result.length < minLength) result.push(...shuffleBag());
  return result;
}
