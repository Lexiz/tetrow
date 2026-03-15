import React from 'react';
import { View, Text, Platform } from 'react-native';
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

export default function TetrowLogo({ size = 64 }: Props) {
  const gap = Math.max(1, Math.round(size * 0.03));
  const blockSize = Math.round((size - gap * 2) / 3);
  const totalH = blockSize * 3 + gap * 2;
  const spacing = Math.round(size * 0.04);

  // T block: 5% larger
  const tBlockSize = Math.round(blockSize * 1.05);

  // O block: 5% larger
  const oBlockSize = Math.round(blockSize * 1.05);

  // Font size calibrated for React Native Courier to match totalH cap-height
  // RN Courier has ~0.72 cap-height ratio on iOS
  const fontSize = Math.round(totalH / 0.72);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing }}>
      {/* "T" — cyan tetromino blocks */}
      <View style={{ alignItems: 'center', height: totalH, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', gap }}>
          <CyanBlock s={tBlockSize} />
          <CyanBlock s={tBlockSize} />
          <CyanBlock s={tBlockSize} />
        </View>
        <View style={{ flexDirection: 'row', gap }}>
          <View style={{ width: tBlockSize, opacity: 0 }} />
          <CyanBlock s={tBlockSize} />
          <View style={{ width: tBlockSize, opacity: 0 }} />
        </View>
        <View style={{ flexDirection: 'row', gap }}>
          <View style={{ width: tBlockSize, opacity: 0 }} />
          <CyanBlock s={tBlockSize} />
          <View style={{ width: tBlockSize, opacity: 0 }} />
        </View>
      </View>

      {/* E, T — cyan */}
      <Text style={{
        fontFamily: 'Courier',
        fontSize,
        fontWeight: '900',
        color: C.p2,
        height: totalH,
        lineHeight: fontSize,
        ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
      }}>ET</Text>

      {/* R — orange */}
      <Text style={{
        fontFamily: 'Courier',
        fontSize,
        fontWeight: '900',
        color: C.p1,
        height: totalH,
        lineHeight: fontSize,
        ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
      }}>R</Text>

      {/* "O" — orange blocks, 3×3 with hollow center */}
      <View style={{
        marginHorizontal: 2,
        height: totalH,
        justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', gap }}>
          <OrangeBlock s={oBlockSize} />
          <OrangeBlock s={oBlockSize} />
          <OrangeBlock s={oBlockSize} />
        </View>
        <View style={{ flexDirection: 'row', gap }}>
          <OrangeBlock s={oBlockSize} />
          <View style={{ width: oBlockSize, height: oBlockSize }} />
          <OrangeBlock s={oBlockSize} />
        </View>
        <View style={{ flexDirection: 'row', gap }}>
          <OrangeBlock s={oBlockSize} />
          <OrangeBlock s={oBlockSize} />
          <OrangeBlock s={oBlockSize} />
        </View>
      </View>

      {/* W — orange */}
      <Text style={{
        fontFamily: 'Courier',
        fontSize,
        fontWeight: '900',
        color: C.p1,
        height: totalH,
        lineHeight: fontSize,
        ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
      }}>W</Text>
    </View>
  );
}
