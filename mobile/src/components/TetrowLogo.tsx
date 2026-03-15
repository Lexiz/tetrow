import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../../../shared/theme';

interface Props {
  size?: number; // base font size, default 64
}

function CyanBlock({ s }: { s: number }) {
  return (
    <View style={{
      width: s,
      height: s,
      backgroundColor: C.p2 + '99',
      borderWidth: 1.5,
      borderColor: C.p2b,
      borderRadius: 2,
    }} />
  );
}

function OrangeBlock({ s }: { s: number }) {
  return (
    <View style={{
      width: s,
      height: s,
      backgroundColor: C.p1 + '99',
      borderWidth: 1.5,
      borderColor: C.p1b,
      borderRadius: 2,
    }} />
  );
}

function Letter({ char, color, totalH, glowColor }: { char: string; color: string; totalH: number; glowColor: string }) {
  return (
    <View style={{ height: totalH + 4, justifyContent: 'flex-start', overflow: 'hidden' }}>
      <Text style={{
        fontFamily: 'Courier',
        fontSize: totalH * 1.78,
        fontWeight: '900',
        color,
        lineHeight: totalH * 1.78 * 0.72,
        includeFontPadding: false,
      }}>{char}</Text>
    </View>
  );
}

export default function TetrowLogo({ size = 64 }: Props) {
  const gap = Math.max(1, Math.round(size * 0.03));
  const blockSize = Math.round((size - gap * 2) / 3);
  const totalH = blockSize * 3 + gap * 2;
  const spacing = Math.round(size * 0.04);

  // T block: 5% larger
  const tBlockSize = Math.round(blockSize * 1.05);
  const tGap = gap;

  // O block: 5% larger
  const oBlockSize = Math.round(blockSize * 1.05);
  const oGap = gap;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing }}>
      {/* "T" — cyan tetromino blocks, 5% larger, 1px lower */}
      <View style={{ alignItems: 'center', marginTop: 1 }}>
        <View style={{ flexDirection: 'row', gap: tGap }}>
          <CyanBlock s={tBlockSize} />
          <CyanBlock s={tBlockSize} />
          <CyanBlock s={tBlockSize} />
        </View>
        <View style={{ flexDirection: 'row', gap: tGap, marginTop: tGap }}>
          <View style={{ width: tBlockSize, opacity: 0 }} />
          <CyanBlock s={tBlockSize} />
          <View style={{ width: tBlockSize, opacity: 0 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: tGap, marginTop: tGap }}>
          <View style={{ width: tBlockSize, opacity: 0 }} />
          <CyanBlock s={tBlockSize} />
          <View style={{ width: tBlockSize, opacity: 0 }} />
        </View>
      </View>

      <Letter char="E" color={C.p2} totalH={totalH} glowColor={C.p2} />
      <Letter char="T" color={C.p2} totalH={totalH} glowColor={C.p2} />
      <Letter char="R" color={C.p1} totalH={totalH} glowColor={C.p1} />

      {/* "O" — orange blocks, 3×3 with hollow center, 5% larger, 2px lower, +2px spacing each side */}
      <View style={{
        marginTop: 2,
        marginHorizontal: 2,
      }}>
        <View style={{ flexDirection: 'row', gap: oGap }}>
          <OrangeBlock s={oBlockSize} />
          <OrangeBlock s={oBlockSize} />
          <OrangeBlock s={oBlockSize} />
        </View>
        <View style={{ flexDirection: 'row', gap: oGap, marginTop: oGap }}>
          <OrangeBlock s={oBlockSize} />
          <View style={{ width: oBlockSize, height: oBlockSize }} />
          <OrangeBlock s={oBlockSize} />
        </View>
        <View style={{ flexDirection: 'row', gap: oGap, marginTop: oGap }}>
          <OrangeBlock s={oBlockSize} />
          <OrangeBlock s={oBlockSize} />
          <OrangeBlock s={oBlockSize} />
        </View>
      </View>

      <Letter char="W" color={C.p1} totalH={totalH} glowColor={C.p1} />
    </View>
  );
}
