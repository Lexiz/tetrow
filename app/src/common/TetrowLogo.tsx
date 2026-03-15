import { C } from '../../../shared/theme';

interface Props {
  size?: number; // base font size, default 64
}

function CyanBlock({ s }: { s: number }) {
  return (
    <div style={{
      width: s, height: s,
      background: `radial-gradient(ellipse at 50% 50%, ${C.p2}33 0%, ${C.p2}99 55%, ${C.p2}dd 100%)`,
      border: `1.5px solid ${C.p2b}`,
      borderRadius: 2,
      boxShadow: `inset 0 0 6px ${C.p2}66, 0 0 8px ${C.p2}88, 0 0 16px ${C.p2}44`,
    }} />
  );
}

function OrangeBlock({ s }: { s: number }) {
  return (
    <div style={{
      width: s, height: s,
      background: `radial-gradient(ellipse at 50% 50%, ${C.p1}33 0%, ${C.p1}99 55%, ${C.p1}dd 100%)`,
      border: `1.5px solid ${C.p1b}`,
      borderRadius: 2,
      boxShadow: `inset 0 0 5px ${C.p1}88, 0 0 8px ${C.p1}bb, 0 0 16px ${C.p1}55`,
    }} />
  );
}

function Letter({ char, color, totalH, glowColor }: { char: string; color: string; totalH: number; glowColor: string }) {
  return (
    <span style={{
      fontFamily: "'Courier New', monospace",
      fontSize: totalH * 1.78, fontWeight: 900,
      color,
      textShadow: `0 0 16px ${glowColor}88, 0 0 32px ${glowColor}44`,
      lineHeight: 0.72,
      height: totalH + 4,
      paddingBottom: 4,
      display: 'inline-flex', alignItems: 'flex-start',
      overflow: 'hidden',
    }}>{char}</span>
  );
}

export default function TetrowLogo({ size = 64 }: Props) {
  const gap = Math.max(1, Math.round(size * 0.03));
  const blockSize = Math.round((size - gap * 2) / 3);
  const totalH = blockSize * 3 + gap * 2;
  const spacing = Math.round(size * 0.04);

  // T block: 10% larger
  const tBlockSize = Math.round(blockSize * 1.05);
  const tGap = gap;

  // O block: 5% larger
  const oBlockSize = Math.round(blockSize * 1.05);
  const oGap = gap;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: spacing, lineHeight: 1 }}>
      {/* "T" — cyan tetromino blocks, 10% larger, 2px lower */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        marginTop: 1,
      }}>
        <div style={{ display: 'flex', gap: tGap }}>
          <CyanBlock s={tBlockSize} />
          <CyanBlock s={tBlockSize} />
          <CyanBlock s={tBlockSize} />
        </div>
        <div style={{ display: 'flex', gap: tGap, marginTop: tGap }}>
          <div style={{ width: tBlockSize, opacity: 0 }} />
          <CyanBlock s={tBlockSize} />
          <div style={{ width: tBlockSize, opacity: 0 }} />
        </div>
        <div style={{ display: 'flex', gap: tGap, marginTop: tGap }}>
          <div style={{ width: tBlockSize, opacity: 0 }} />
          <CyanBlock s={tBlockSize} />
          <div style={{ width: tBlockSize, opacity: 0 }} />
        </div>
      </div>

      <Letter char="E" color={C.p2} totalH={totalH} glowColor={C.p2} />
      <Letter char="T" color={C.p2} totalH={totalH} glowColor={C.p2} />
      <Letter char="R" color={C.p1} totalH={totalH} glowColor={C.p1} />

      {/* "O" — orange blocks, 3×3 with hollow center, 5% larger, 1px lower, +2px spacing each side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${oBlockSize}px ${oBlockSize}px ${oBlockSize}px`,
        gridTemplateRows: `${oBlockSize}px ${oBlockSize}px ${oBlockSize}px`,
        gap: oGap,
        marginTop: 2,
        marginLeft: 2,
        marginRight: 2,
      }}>
        <OrangeBlock s={oBlockSize} />
        <OrangeBlock s={oBlockSize} />
        <OrangeBlock s={oBlockSize} />
        <OrangeBlock s={oBlockSize} />
        <div style={{ width: oBlockSize, height: oBlockSize }} /> {/* hollow center */}
        <OrangeBlock s={oBlockSize} />
        <OrangeBlock s={oBlockSize} />
        <OrangeBlock s={oBlockSize} />
        <OrangeBlock s={oBlockSize} />
      </div>

      <Letter char="W" color={C.p1} totalH={totalH} glowColor={C.p1} />
    </div>
  );
}
