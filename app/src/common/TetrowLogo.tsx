import { C } from '../../../shared/theme';

interface Props {
  size?: number; // base font size, default 58
}

export default function TetrowLogo({ size = 58 }: Props) {
  const blockSize = Math.round(size * 0.32);
  const gap = Math.round(blockSize * 0.1);
  const tBlockSize = Math.round(size * 0.28);
  const tGap = Math.round(tBlockSize * 0.1);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-end', lineHeight: 1 }}>
      {/* "T" — built from cyan tetromino blocks (T-piece shape) */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginRight: Math.round(size * 0.02),
        marginBottom: Math.round(size * 0.04),
      }}>
        {/* Top row: 3 blocks */}
        <div style={{ display: 'flex', gap: tGap }}>
          {[0, 1, 2].map(i => (
            <div key={`t-top-${i}`} style={{
              width: tBlockSize, height: tBlockSize,
              background: `linear-gradient(135deg, ${C.p2}dd 0%, ${C.p2}88 100%)`,
              border: `1.5px solid ${C.p2b}`,
              borderRadius: 2,
              boxShadow: `inset 0 0 6px ${C.p2}66, 0 0 8px ${C.p2}88, 0 0 16px ${C.p2}44`,
            }} />
          ))}
        </div>
        {/* Bottom row: 1 block centered */}
        <div style={{ display: 'flex', gap: tGap, marginTop: tGap }}>
          <div style={{ width: tBlockSize, opacity: 0 }} />
          <div style={{
            width: tBlockSize, height: tBlockSize,
            background: `linear-gradient(135deg, ${C.p2}dd 0%, ${C.p2}88 100%)`,
            border: `1.5px solid ${C.p2b}`,
            borderRadius: 2,
            boxShadow: `inset 0 0 6px ${C.p2}66, 0 0 8px ${C.p2}88, 0 0 16px ${C.p2}44`,
          }} />
          <div style={{ width: tBlockSize, opacity: 0 }} />
        </div>
      </div>

      {/* "ETR" — cyan transitioning to orange */}
      <span style={{
        fontFamily: "'Courier New', monospace",
        fontSize: size, fontWeight: 900, letterSpacing: -1,
      }}>
        <span style={{
          color: C.p2,
          textShadow: `0 0 16px ${C.p2}88, 0 0 32px ${C.p2}44`,
        }}>E</span>
        <span style={{
          background: `linear-gradient(90deg, ${C.p2} 0%, ${C.p1} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: `drop-shadow(0 0 12px ${C.p2}44) drop-shadow(0 0 12px ${C.p1}44)`,
        }}>TR</span>
      </span>

      {/* "O" — 2x2 orange tetromino blocks */}
      <span style={{
        display: 'inline-grid',
        gridTemplateColumns: `${blockSize}px ${blockSize}px`,
        gap: `${gap}px`,
        margin: `0 ${Math.round(size * 0.04)}px`,
        alignSelf: 'flex-end',
        marginBottom: Math.round(size * 0.12),
      }}>
        {[0, 1, 2, 3].map(i => (
          <div key={`o-${i}`} style={{
            width: blockSize, height: blockSize,
            background: `radial-gradient(ellipse at 40% 35%, ${C.p1}ff 0%, ${C.p1}cc 40%, ${C.p1}88 100%)`,
            border: `1.5px solid ${C.p1b}`,
            borderRadius: 2,
            boxShadow: `inset 0 0 5px ${C.p1}88, 0 0 8px ${C.p1}bb, 0 0 16px ${C.p1}55`,
          }} />
        ))}
      </span>

      {/* "W" — orange */}
      <span style={{
        fontFamily: "'Courier New', monospace",
        fontSize: size, fontWeight: 900, letterSpacing: -1,
        color: C.p1,
        textShadow: `0 0 16px ${C.p1}88, 0 0 32px ${C.p1}44`,
      }}>W</span>
    </div>
  );
}
