import type { Board } from '../../../shared/types';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import Cell from './Cell';

interface Props {
  board: Board;
  cellSize?: number;
}

export default function BoardComponent({ board, cellSize }: Props) {
  const S = cellSize ?? CONFIG.CELL_SIZE;
  return (
    <div style={{
      display: 'inline-grid',
      gridTemplateColumns: `repeat(${CONFIG.COLS}, ${S}px)`,
      border: '2px solid #222238',
      borderRadius: 3,
      background: C.grid,
      boxShadow: `
        0 0  60px rgba(255,122,0,0.12),
        0 0 100px rgba(0,229,255,0.08),
        0 0 180px rgba(255,122,0,0.05),
        inset 0 0  50px rgba(0,0,0,0.8)
      `,
    }}>
      {board.map((row, r) =>
        row.map((value, c) => <Cell key={`${r}-${c}`} value={value} size={S} />)
      )}
    </div>
  );
}
