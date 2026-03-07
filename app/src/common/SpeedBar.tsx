import { C } from '../../../shared/theme';

interface Props {
  band: number; // 0–6
  player: 1 | 2;
}

export default function SpeedBar({ band, player }: Props) {
  const col = player === 1 ? C.p1 : C.p2;
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 20 }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} style={{
          width: 7,
          height: i <= band ? 5 + i * 2.4 : 4,
          background: i <= band ? col : '#14142a',
          borderRadius: 1,
          boxShadow: i <= band ? `0 0 6px ${col}cc, 0 0 10px ${col}55` : 'none',
          transition: 'all 0.3s',
        }} />
      ))}
    </div>
  );
}
