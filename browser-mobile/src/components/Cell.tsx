import type { CellValue } from '../../../shared/types';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';

const S = CONFIG.CELL_SIZE;

interface Props {
  value: CellValue;
}

export default function Cell({ value }: Props) {
  if (!value) {
    return (
      <div style={{
        width: S, height: S, boxSizing: 'border-box',
        background: C.grid,
        borderRight: '1px solid #0e0e1c',
        borderBottom: '1px solid #0e0e1c',
      }} />
    );
  }

  if (value === 'ghost1' || value === 'ghost2') {
    const col = value === 'ghost1' ? C.p1 : C.p2;
    return (
      <div style={{
        width: S, height: S, boxSizing: 'border-box',
        background: `radial-gradient(ellipse at 40% 35%, ${col}2e 0%, ${col}0f 70%, transparent 100%)`,
        border: `1.5px solid ${col}72`,
        boxShadow: `inset 0 0 8px ${col}26, 0 0 6px ${col}40`,
      }} />
    );
  }

  const col = value === 1 ? C.p1 : C.p2;
  const brt = value === 1 ? C.p1b : C.p2b;

  return (
    <div style={{
      width: S, height: S, boxSizing: 'border-box', position: 'relative',
      background: `radial-gradient(ellipse at 40% 35%, ${col}ff 0%, ${col}cc 35%, ${col}77 65%, ${col}33 100%)`,
      border: `1.5px solid ${brt}`,
      boxShadow: `
        inset 0 0 10px ${col}99,
        inset 0 0  4px ${brt}88,
        0 0  8px ${col}aa,
        0 0 16px ${col}55,
        0 0  2px ${brt}
      `,
      overflow: 'hidden',
    }}>
      {/* highlight streak */}
      <div style={{
        position: 'absolute', top: 1, left: 2, right: 2, height: '35%',
        background: `linear-gradient(to bottom, ${C.white}44, transparent)`,
        borderRadius: 1,
      }} />
    </div>
  );
}
