export type Owner = 1 | 2;

// null = empty, 1/2 = placed by that player, 'ghost1'/'ghost2' = ghost outline for that player
export type CellValue = null | Owner | 'ghost1' | 'ghost2';

export type Board = CellValue[][];

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type Screen = 'login' | 'menu' | 'start' | 'game' | 'warmup-select' | 'warmup' | 'ranked' | 'match-confirm' | 'ranked-game' | 'end' | 'terms' | 'privacy';
