import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { C } from '../../../shared/theme';
import { CONFIG } from '../../../shared/config';
import type { Owner } from '../../../shared/types';
import type { PlayerStats, Action } from '../../../shared/game/engine';
import type { ClientGameState } from '../hooks/useMultiplayer';
import Board from '../components/Board';
import ScorePopup from '../components/ScorePopup';
import LineClearEffect from '../components/LineClearEffect';
import GamePauseOverlay from '../components/GamePauseOverlay';
import MiniPiece from '../components/MiniPiece';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';
import { useTouchInput } from '../hooks/useTouchInput';

const BAR_HEIGHT = 90;
const HIDDEN_NEXT: [number, number][] = [];

interface Props {
  gameState: ClientGameState | null;
  myPlayer: Owner;
  myName: string;
  opponentName: string;
  eloLoss: number;
  sendAction: (action: Action) => void;
  onGameEnd: (p1Score: number, p2Score: number, toppedOut: [boolean, boolean], stats: [PlayerStats, PlayerStats]) => void;
  onQuit: () => void;
}

export default function MultiplayerGameScreen({
  gameState, myPlayer, myName, opponentName, eloLoss, sendAction, onGameEnd, onQuit,
}: Props) {
  const game = useMultiplayerGame(gameState, myPlayer, sendAction);
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [showPause, setShowPause] = useState(false);

  const cellSize = useMemo(() => {
    const availH = screenH - insets.top - insets.bottom - BAR_HEIGHT - 16;
    const fromW = Math.floor((screenW - 16) / CONFIG.COLS);
    const fromH = Math.floor(availH / CONFIG.ROWS);
    return Math.min(fromW, fromH, 36);
  }, [screenW, screenH, insets]);

  const boardWidth = CONFIG.COLS * cellSize + 4;

  // Touch input — wired to multiplayer handler
  const { onPanBegin, onPanUpdate, onPanEnd, onTap } = useTouchInput(
    myPlayer,
    game?.handleTouchAction ?? (() => {}),
    boardWidth,
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

  if (!game) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.waitingContainer}>
          <ActivityIndicator color={C.p2} size="large" />
          <Text style={styles.waitingText}>WAITING FOR GAME...</Text>
        </View>
      </View>
    );
  }

  const p1Active = game.active === 1 && !game.ended;
  const p2Active = game.active === 2 && !game.ended;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Board area */}
      <View style={styles.boardArea}>
        <GestureDetector gesture={composedGesture}>
          <View style={{ position: 'relative' }}>
            <Board board={game.displayBoard} cellSize={cellSize} />
            {game.lastClear && (
              <ScorePopup
                key={game.lastClear.id}
                base={game.lastClear.base}
                bonus={game.lastClear.bonus}
                player={game.lastClear.player}
              />
            )}
            {game.lastClear && game.clearedRows.length > 0 && (
              <LineClearEffect
                key={`clear-${game.lastClear.id}`}
                rows={game.clearedRows}
                player={game.lastClear.player}
                cellSize={cellSize}
              />
            )}
            {/* Equalizer warning */}
            {game.phase === 'equalizer' && (
              <View style={styles.equalizerOverlay}>
                <Text style={styles.equalizerLabel}>CEILING REACHED</Text>
                <Text style={styles.equalizerTitle}>LAST TURN</Text>
              </View>
            )}
            {/* Pause overlay */}
            {showPause && !game.ended && (
              <GamePauseOverlay
                playerName={myName}
                playerNum={myPlayer}
                score={game.scores[myPlayer - 1]}
                speedBand={CONFIG.SPEED_BANDS[myPlayer === 1 ? game.p1BandIdx : game.p2BandIdx]?.label ?? 'S0'}
                eloLoss={eloLoss}
                onBack={() => setShowPause(false)}
                onQuit={onQuit}
              />
            )}
          </View>
        </GestureDetector>
      </View>

      {/* Bottom bar — P1 left, pause center, P2 right */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 8 }]}>
        {/* P1 box */}
        <View style={[
          styles.playerBox,
          { borderColor: p1Active ? C.p1 + '66' : C.border },
          p1Active && styles.playerBoxGlow,
        ]}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SCORE</Text>
            <Text style={styles.statValue}>{game.scores[0].toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SPEED</Text>
            <Text style={[styles.statValue, { color: C.p1 }]}>{game.p1BandIdx + 1}/7</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>NEXT</Text>
            <View style={styles.miniPieceWrap}>
              <MiniPiece cells={game.p1Next.length > 0 ? game.p1Next : HIDDEN_NEXT} player={1} />
            </View>
          </View>
        </View>

        {/* Pause button */}
        <TouchableOpacity
          onPress={!game.ended ? () => setShowPause(true) : undefined}
          style={styles.pauseBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.pauseIcon}>❚❚</Text>
        </TouchableOpacity>

        {/* P2 box */}
        <View style={[
          styles.playerBox,
          { borderColor: p2Active ? C.p2 + '66' : C.border },
          p2Active && styles.playerBoxGlowP2,
        ]}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>NEXT</Text>
            <View style={styles.miniPieceWrap}>
              <MiniPiece cells={game.p2Next.length > 0 ? game.p2Next : HIDDEN_NEXT} player={2} />
            </View>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SPEED</Text>
            <Text style={[styles.statValue, { color: C.p2 }]}>{game.p2BandIdx + 1}/7</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SCORE</Text>
            <Text style={styles.statValue}>{game.scores[1].toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* End overlay */}
      {game.ended && (
        <View style={styles.endOverlay}>
          <View style={styles.endContent}>
            <Text style={styles.endLabel}>MATCH OVER</Text>
            <TouchableOpacity
              onPress={() => onGameEnd(game.scores[0], game.scores[1], game.toppedOut, game.stats)}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030306',
    justifyContent: 'space-between',
  },
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  waitingText: {
    fontFamily: 'Courier',
    fontSize: 11,
    letterSpacing: 3,
    color: C.text,
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
    justifyContent: 'center',
    gap: 12,
    height: BAR_HEIGHT - 16,
    backgroundColor: C.panel,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
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
    opacity: 0.5,
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
