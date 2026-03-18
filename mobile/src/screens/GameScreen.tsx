import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { TetrominoType, Owner, GameMode } from '../../../shared/types';
import type { PlayerStats } from '../../../shared/game/engine';
import { getShape } from '../../../shared/game/pieces';
import type { AiDifficulty } from '../../../shared/game/ai';
import Board from '../components/Board';
import ScorePopup from '../components/ScorePopup';
import LineClearEffect from '../components/LineClearEffect';
import GamePauseOverlay from '../components/GamePauseOverlay';
import MiniPiece from '../components/MiniPiece';
import { useGameEngine } from '../hooks/useGameEngine';
import { useTouchInput } from '../hooks/useTouchInput';

const BAR_HEIGHT = 64;
const HIDDEN_NEXT: [number, number][] = [];

interface Props {
  aiDifficulty: AiDifficulty;
  gameMode?: GameMode;
  onGameEnd: (p1Score: number, p2Score: number, toppedOut: [boolean, boolean], stats: [PlayerStats, PlayerStats]) => void;
  onQuit: () => void;
}

export default function GameScreen({ aiDifficulty, gameMode, onGameEnd, onQuit }: Props) {
  const { state, displayBoard, p1BandIdx, p2BandIdx, showP1Next, handleAction } = useGameEngine(
    { aiPlayer: 2, aiDifficulty, gameMode }
  );
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [showPause, setShowPause] = useState(false);

  const ended = state.phase === 'ended';
  const p1Active = state.active === 1 && !ended;
  const p2Active = state.active === 2 && !ended;

  // Calculate cell size based on available screen space
  const cellSize = useMemo(() => {
    const availH = screenH - insets.top - insets.bottom - BAR_HEIGHT - 16;
    const fromW = Math.floor((screenW - 16) / CONFIG.COLS);
    const fromH = Math.floor(availH / CONFIG.ROWS);
    return Math.min(fromW, fromH, 36);
  }, [screenW, screenH, insets]);

  const boardWidth = CONFIG.COLS * cellSize + 4; // + border

  // Touch input
  const { onPanBegin, onPanUpdate, onPanEnd, onTap } = useTouchInput(
    state.active,
    handleAction,
    boardWidth,
    1 as Owner, // human always controls P1
  );

  const panGesture = Gesture.Pan()
    .onBegin(onPanBegin)
    .onUpdate(onPanUpdate)
    .onEnd(onPanEnd)
    .minDistance(5);

  const tapGesture = Gesture.Tap()
    .onEnd(onTap)
    .maxDuration(250)
    .maxDistance(10);

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Board area */}
      <View style={styles.boardArea}>
        <GestureDetector gesture={composedGesture}>
          <View style={{ position: 'relative' }}>
            <Board board={displayBoard} cellSize={cellSize} />
            {state.lastClear && (
              <ScorePopup
                key={state.lastClear.id}
                base={state.lastClear.base}
                bonus={state.lastClear.bonus}
                player={state.lastClear.player}
              />
            )}
            {state.lastClear && state.clearedRows.length > 0 && (
              <LineClearEffect
                key={`clear-${state.lastClear.id}`}
                rows={state.clearedRows}
                player={state.lastClear.player}
                cellSize={cellSize}
              />
            )}
            {/* Equalizer warning */}
            {state.phase === 'equalizer' && (
              <View style={styles.equalizerOverlay}>
                <Text style={styles.equalizerLabel}>CEILING REACHED</Text>
                <Text style={styles.equalizerTitle}>LAST TURN</Text>
              </View>
            )}
            {/* Pause overlay */}
            {showPause && !ended && (
              <GamePauseOverlay
                playerName={state.active === 1 ? 'PLAYER 1' : 'PLAYER 2'}
                playerNum={state.active}
                score={state.scores[state.active - 1]}
                speedBand={CONFIG.SPEED_BANDS[state.active === 1 ? p1BandIdx : p2BandIdx]?.label ?? 'S0'}
                onBack={() => setShowPause(false)}
                onQuit={onQuit}
              />
            )}
          </View>
        </GestureDetector>
      </View>

      {/* Blind mode: pause button at top-right */}
      {gameMode === 'blind' && !ended && (
        <TouchableOpacity
          onPress={() => setShowPause(true)}
          style={{ position: 'absolute', top: insets.top + 8, right: 8, zIndex: 5, backgroundColor: C.panel, borderWidth: 1.5, borderColor: C.border, borderRadius: 6, padding: 6 }}
          activeOpacity={0.7}
        >
          <Text style={{ fontFamily: 'Courier', fontSize: 12, color: C.white }}>❚❚</Text>
        </TouchableOpacity>
      )}

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 8, gap: gameMode === 'blind' ? 4 : 6 }]}>
        {gameMode === 'blind' ? (
          <>
            {/* Blind: P1 (player) wide box with 1ST/2ND pieces horizontal */}
            <View style={[
              styles.playerBox,
              { flex: 1, borderColor: C.p1 + 'cc', justifyContent: 'center' },
              p1Active && styles.playerBoxGlow,
            ]}>
              <View style={styles.scoreSpeedStack}>
                <Text style={styles.statLabelSmall}>SCORE</Text>
                <Text style={styles.statValueSmall}>{state.scores[0].toLocaleString()}</Text>
                <Text style={[styles.statLabelSmall, { marginTop: 1 }]}>SPEED</Text>
                <Text style={[styles.statValueSpeedSmall, { color: C.p1 }]}>{p1BandIdx + 1}/7</Text>
              </View>
              <View style={styles.nextItemSmall}>
                <Text style={styles.statLabelSmall}>1ST</Text>
                <View style={styles.miniPieceSmall}>
                  <MiniPiece cells={showP1Next ? nextCells(state.p1Next) : HIDDEN_NEXT} player={1} />
                </View>
              </View>
              {state.p1Next2 && (
                <View style={styles.nextItemSmall}>
                  <Text style={styles.statLabelSmall}>2ND</Text>
                  <View style={styles.miniPieceSmall}>
                    <MiniPiece cells={nextCells(state.p1Next2)} player={1} />
                  </View>
                </View>
              )}
            </View>
            {/* Blind: P2 (opponent) compact box — score/speed only */}
            <View style={[
              { width: 56, flexDirection: 'column', alignItems: 'center', gap: 1, height: BAR_HEIGHT - 12, backgroundColor: C.panel, borderWidth: 1.5, borderColor: p2Active ? C.p2 + '66' : C.border, borderRadius: 6, paddingHorizontal: 4, justifyContent: 'center' },
              p2Active && styles.playerBoxGlowP2,
            ]}>
              <Text style={styles.statLabelSmall}>SCORE</Text>
              <Text style={[styles.statValueSmall, { fontSize: 12 }]}>{state.scores[1].toLocaleString()}</Text>
              <Text style={[styles.statLabelSmall, { marginTop: 1 }]}>SPEED</Text>
              <Text style={[styles.statValueSpeedSmall, { color: C.p2, fontSize: 10 }]}>{p2BandIdx + 1}/7</Text>
            </View>
          </>
        ) : (
          <>
            {/* Normal: P1 box */}
            <View style={[
              styles.playerBox,
              { borderColor: p1Active ? C.p1 + '66' : C.border, justifyContent: 'flex-end' },
              p1Active && styles.playerBoxGlow,
            ]}>
              <View style={styles.scoreSpeedStack}>
                <Text style={styles.statLabelSmall}>SCORE</Text>
                <Text style={styles.statValueSmall}>{state.scores[0].toLocaleString()}</Text>
                <Text style={[styles.statLabelSmall, { marginTop: 1 }]}>SPEED</Text>
                <Text style={[styles.statValueSpeedSmall, { color: C.p1 }]}>{p1BandIdx + 1}/7</Text>
              </View>
              <View style={styles.nextItemSmall}>
                <Text style={styles.statLabelSmall}>NEXT</Text>
                <View style={styles.miniPieceSmall}>
                  <MiniPiece cells={showP1Next ? nextCells(state.p1Next) : HIDDEN_NEXT} player={1} />
                </View>
              </View>
            </View>

            {/* Pause button */}
            <TouchableOpacity
              onPress={() => setShowPause(true)}
              style={styles.pauseBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.pauseIcon}>❚❚</Text>
            </TouchableOpacity>

            {/* Normal: P2 box */}
            <View style={[
              styles.playerBox,
              { borderColor: p2Active ? C.p2 + '66' : C.border, justifyContent: 'flex-start' },
              p2Active && styles.playerBoxGlowP2,
            ]}>
              <View style={styles.nextItemSmall}>
                <Text style={styles.statLabelSmall}>NEXT</Text>
                <View style={styles.miniPieceSmall}>
                  <MiniPiece cells={nextCells(state.p2Next)} player={2} />
                </View>
              </View>
              <View style={styles.scoreSpeedStack}>
                <Text style={styles.statLabelSmall}>SCORE</Text>
                <Text style={styles.statValueSmall}>{state.scores[1].toLocaleString()}</Text>
                <Text style={[styles.statLabelSmall, { marginTop: 1 }]}>SPEED</Text>
                <Text style={[styles.statValueSpeedSmall, { color: C.p2 }]}>{p2BandIdx + 1}/7</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* End-game overlay */}
      {ended && (
        <View style={styles.endOverlay}>
          <View style={styles.endContent}>
            <Text style={styles.endLabel}>MATCH OVER</Text>
            <TouchableOpacity
              onPress={() => onGameEnd(state.scores[0], state.scores[1], state.toppedOut, state.stats)}
              style={styles.endButton}
            >
              <Text style={styles.endButtonText}>SEE RESULTS</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function nextCells(type: TetrominoType): [number, number][] {
  const cells = getShape(type, 0);
  const minC = Math.min(...cells.map(([c]) => c));
  const minR = Math.min(...cells.map(([, r]) => r));
  return cells.map(([c, r]) => [c - minC, r - minR]);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030306',
    justifyContent: 'space-between',
  },
  boardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 6,
  },
  playerBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: BAR_HEIGHT - 12,
    backgroundColor: C.panel,
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  scoreSpeedStack: {
    alignItems: 'center',
    gap: 0,
  },
  nextItemSmall: {
    alignItems: 'center',
  },
  statLabelSmall: {
    fontFamily: 'Courier',
    fontSize: 5,
    letterSpacing: 1,
    color: C.white,
    opacity: 0.5,
  },
  statValueSmall: {
    fontFamily: 'Courier',
    fontSize: 13,
    fontWeight: '900',
    color: C.white,
  },
  statValueSpeedSmall: {
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: '900',
  },
  miniPieceSmall: {
    marginTop: 1,
    transform: [{ scale: 0.7 }],
  },
  playerBoxGlow: {
    shadowColor: C.p1,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  playerBoxGlowP2: {
    shadowColor: C.p2,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontFamily: 'Courier',
    fontSize: 7,
    letterSpacing: 1,
    color: C.white,
    opacity: 0.6,
  },
  statValue: {
    fontFamily: 'Courier',
    fontSize: 13,
    fontWeight: '900',
    color: C.white,
  },
  miniPieceWrap: {
    height: 20,
    justifyContent: 'center',
  },
  pauseBtn: {
    width: BAR_HEIGHT - 16,
    height: BAR_HEIGHT - 16,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.panel,
  },
  pauseIcon: {
    fontFamily: 'Courier',
    fontSize: 14,
    color: C.white,
    opacity: 0.6,
  },
  equalizerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,5,8,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  equalizerLabel: {
    fontFamily: 'Courier',
    fontSize: 9,
    letterSpacing: 5,
    color: '#ff4466',
    marginBottom: 8,
  },
  equalizerTitle: {
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
    color: C.white,
  },
  endOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,5,8,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  endContent: {
    alignItems: 'center',
  },
  endLabel: {
    fontFamily: 'Courier',
    fontSize: 9,
    letterSpacing: 7,
    color: C.dim,
    marginBottom: 12,
  },
  endButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    backgroundColor: C.bg,
    borderWidth: 2,
    borderColor: 'rgba(255,200,140,0.45)',
    borderRadius: 5,
  },
  endButtonText: {
    fontFamily: 'Courier',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 4,
    color: C.white,
  },
});
