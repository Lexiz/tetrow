import { C } from '../../../shared/theme';

interface Props {
  // [x, y] coords within a 4×4 preview grid
  cells: [number, number][];
  player: 1 | 2;
}

export default function MiniPiece({ cells, player }: Props) {
  const col = player === 1 ? C.p1 : C.p2;
  const brt = player === 1 ? C.p1b : C.p2b;

  const grid: boolean[][] = Array.from({ length: 4 }, () =>
    Array(4).fill(false) as boolean[]
  );
  cells.forEach(([x, y]) => {
    if (y >= 0 && y < 4 && x >= 0 && x < 4) {
      grid[y]![x] = true;
    }
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 13px)', gap: 1 }}>
      {grid.map((row, r) =>
        row.map((on, c) => (
          <div key={`${r}-${c}`} style={{
            width: 13, height: 13, position: 'relative', overflow: 'hidden',
            background: on
              ? `radial-gradient(ellipse at 40% 35%, ${col}ff 0%, ${col}cc 40%, ${col}66 100%)`
              : 'transparent',
            border: on ? `1.5px solid ${brt}` : '1px solid #0e0e1e',
            borderRadius: 1,
            boxShadow: on
              ? `inset 0 0 6px ${col}88, 0 0 6px ${col}bb, 0 0 12px ${col}44`
              : 'none',
          }}>
            {on && (
              <div style={{
                position: 'absolute', top: 1, left: 1, right: 1, height: '32%',
                background: `linear-gradient(to bottom, ${C.white}44, transparent)`,
                borderRadius: 1,
              }} />
            )}
          </div>
        ))
      )}
    </div>
  );
}
