import { C } from '../theme';
import { CONFIG } from '../config';

const HEIGHT = CONFIG.ROWS * CONFIG.CELL_SIZE;

interface Props {
  activePlayer: 1 | 2;
}

export default function Divider({ activePlayer }: Props) {
  const col = activePlayer === 1 ? C.p1 : C.p2;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 5, padding: '0 10px', height: HEIGHT,
    }}>
      <div style={{
        width: 1, flex: 1,
        background: `linear-gradient(to bottom, transparent, ${col}44)`,
      }} />
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: `radial-gradient(circle, ${col}33 0%, transparent 70%)`,
        border: `1.5px solid ${col}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: col,
        boxShadow: `0 0 16px ${col}cc, 0 0 30px ${col}66, 0 0 50px ${col}22`,
      }}>
        {activePlayer === 1 ? '◀' : '▶'}
      </div>
      <div style={{
        width: 1, flex: 1,
        background: `linear-gradient(to bottom, ${col}44, transparent)`,
      }} />
    </div>
  );
}
