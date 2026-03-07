import type { Board } from '../../../shared/types';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import Cell from './Cell';

const { COLS, CELL_SIZE } = CONFIG;

interface Props {
  board: Board;
}

export default function Board({ board }: Props) {
  return (
    <div style={{
      display: 'inline-grid',
      gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
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
        row.map((value, c) => <Cell key={`${r}-${c}`} value={value} />)
      )}
    </div>
  );
}
