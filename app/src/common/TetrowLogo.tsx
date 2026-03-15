import { C } from '../../../shared/theme';

interface Props {
  size?: number; // base font size, default 64
}

function CyanBlock({ s, glow }: { s: number; glow?: boolean }) {
  return (
    <div style={{
      width: s, height: s,
      background: `linear-gradient(135deg, ${C.p2}dd 0%, ${C.p2}88 100%)`,
      border: `1.5px solid ${C.p2b}`,
      borderRadius: 2,
      boxShadow: glow !== false
        ? `inset 0 0 6px ${C.p2}66, 0 0 8px ${C.p2}88, 0 0 16px ${C.p2}44`
        : 'none',
    }} />
  );
}

function OrangeBlock({ s }: { s: number }) {
  return (
    <div style={{
      width: s, height: s,
      background: `radial-gradient(ellipse at 40% 35%, ${C.p1}ff 0%, ${C.p1}cc 40%, ${C.p1}88 100%)`,
      border: `1.5px solid ${C.p1b}`,
      borderRadius: 2,
      boxShadow: `inset 0 0 5px ${C.p1}88, 0 0 8px ${C.p1}bb, 0 0 16px ${C.p1}55`,
    }} />
  );
}

export default function TetrowLogo({ size = 64 }: Props) {
  // Block size: 3 blocks tall = font height, so each block = size / 3 (minus gaps)
  const gap = Math.max(1, Math.round(size * 0.03));
  const blockSize = Math.round((size - gap * 2) / 3);
  const totalH = blockSize * 3 + gap * 2; // actual pixel height of block columns

  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-end', lineHeight: 1 }}>
      {/* "T" — cyan tetromino blocks, T-piece shape, 3 blocks tall */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        marginRight: Math.round(size * 0.04),
        height: totalH,
      }}>
        {/* Top row: 3 blocks */}
        <div style={{ display: 'flex', gap }}>
          <CyanBlock s={blockSize} />
          <CyanBlock s={blockSize} />
          <CyanBlock s={blockSize} />
        </div>
        {/* Middle: 1 block centered */}
        <div style={{ display: 'flex', gap, marginTop: gap }}>
          <div style={{ width: blockSize, opacity: 0 }} />
          <CyanBlock s={blockSize} />
          <div style={{ width: blockSize, opacity: 0 }} />
        </div>
        {/* Bottom: 1 block centered */}
        <div style={{ display: 'flex', gap, marginTop: gap }}>
          <div style={{ width: blockSize, opacity: 0 }} />
          <CyanBlock s={blockSize} />
          <div style={{ width: blockSize, opacity: 0 }} />
        </div>
      </div>

      {/* "ETR" — cyan text, same height as blocks */}
      <span style={{
        fontFamily: "'Courier New', monospace",
        fontSize: totalH * 0.82, fontWeight: 900, letterSpacing: -1,
        color: C.p2,
        textShadow: `0 0 16px ${C.p2}88, 0 0 32px ${C.p2}44`,
        lineHeight: `${totalH}px`,
        height: totalH,
        display: 'inline-flex', alignItems: 'flex-end',
      }}>ETR</span>

      {/* "O" — orange blocks, 3 tall × 2 wide */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${blockSize}px ${blockSize}px`,
        gridTemplateRows: `${blockSize}px ${blockSize}px ${blockSize}px`,
        gap,
        margin: `0 ${Math.round(size * 0.04)}px`,
        height: totalH,
      }}>
        <OrangeBlock s={blockSize} />
        <OrangeBlock s={blockSize} />
        <OrangeBlock s={blockSize} />
        <OrangeBlock s={blockSize} />
        <OrangeBlock s={blockSize} />
        <OrangeBlock s={blockSize} />
      </div>

      {/* "W" — orange text, same height as blocks */}
      <span style={{
        fontFamily: "'Courier New', monospace",
        fontSize: totalH * 0.82, fontWeight: 900, letterSpacing: -1,
        color: C.p1,
        textShadow: `0 0 16px ${C.p1}88, 0 0 32px ${C.p1}44`,
        lineHeight: `${totalH}px`,
        height: totalH,
        display: 'inline-flex', alignItems: 'flex-end',
      }}>W</span>
    </div>
  );
}
