import { useReducer, useEffect, useRef, useCallback } from 'react';
import type { Owner, GameMode } from '../../../shared/types';
import { CONFIG } from '../../../shared/config';
import {
  gameReducer,
  createInitialState,
  computeDisplayBoard,
  getViewport,
  getBandIndex,
  getGravityMs,
  type GameState,
} from '../../../shared/game/engine';
import { aiFindPlacement, type AiDifficulty } from '../../../shared/game/ai';
import { useInput } from './useInput';

interface EngineOptions {
  aiPlayer?: Owner;          // which player the AI controls (2 for warm-up)
  aiDifficulty?: AiDifficulty;
  gameMode?: GameMode;
}

export function useGameEngine(options?: EngineOptions) {
  const aiPlayer = options?.aiPlayer;
  const aiDifficulty = options?.aiDifficulty ?? 'medium';
  const gameMode = options?.gameMode ?? 'classic';
  const [state, dispatch] = useReducer(gameReducer, gameMode, createInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Gravity timer ────────────────────────────────────────────────────────
  // Restarts whenever the active player or their score band changes
  const activeScore = state.scores[state.active - 1];
  const gravityMs = getGravityMs(activeScore);

  useEffect(() => {
    if (state.phase === 'ended') return;
    const id = setInterval(() => {
      if (stateRef.current.phase !== 'ended') dispatch({ type: 'GRAVITY' });
    }, gravityMs);
    return () => clearInterval(id);
  }, [state.active, gravityMs, state.phase, state.isBonusTurn]);

  // ── Lock delay timer ─────────────────────────────────────────────────────
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearLockTimer() {
    if (lockTimerRef.current !== null) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }

  useEffect(() => {
    if (state.phase === 'ended') { clearLockTimer(); return; }

    if (state.isGrounded) {
      // Start lock timer if not already running
      if (lockTimerRef.current === null) {
        lockTimerRef.current = setTimeout(() => {
          lockTimerRef.current = null;
          dispatch({ type: 'LOCK' });
        }, 500); // CONFIG.LOCK_DELAY
      }
      // If lock resets have been exhausted, let the existing timer run
    } else {
      // Piece is airborne — cancel any pending lock
      clearLockTimer();
    }

    return clearLockTimer;
  }, [state.isGrounded, state.lockResets, state.phase]);

  // Reset lock timer on movement (if still grounded and resets remain)
  const prevGroundedRef = useRef(false);
  useEffect(() => {
    const wasGrounded = prevGroundedRef.current;
    prevGroundedRef.current = state.isGrounded;

    // Movement while grounded and lockResets increased → reset the timer
    if (state.isGrounded && wasGrounded && lockTimerRef.current !== null) {
      clearLockTimer();
      lockTimerRef.current = setTimeout(() => {
        lockTimerRef.current = null;
        dispatch({ type: 'LOCK' });
      }, 500);
    }
  }, [state.lockResets]);

  // ── Five-minute timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (gameMode !== 'fivemin' || state.phase === 'ended' || !state.gameStartTime) return;
    const remaining = 5 * 60 * 1000 - (Date.now() - state.gameStartTime);
    if (remaining <= 0) {
      dispatch({ type: 'TIMER_END' });
      return;
    }
    const id = setTimeout(() => {
      dispatch({ type: 'TIMER_END' });
    }, remaining);
    return () => clearTimeout(id);
  }, [gameMode, state.phase, state.gameStartTime]);

  // ── Input handling ────────────────────────────────────────────────────────
  const handleAction = useCallback((player: Owner, action: string) => {
    const s = stateRef.current;
    if (s.phase === 'ended') return;
    if (player !== s.active) return; // only active player's input accepted

    switch (action) {
      case 'left':       dispatch({ type: 'MOVE', dc: -1 }); break;
      case 'right':      dispatch({ type: 'MOVE', dc:  1 }); break;
      case 'softDrop':   dispatch({ type: 'SOFT_DROP' });    break;
      case 'hardDrop':   dispatch({ type: 'HARD_DROP' });    break;
      case 'rotateCW':   dispatch({ type: 'ROTATE', cw: true  }); break;
      case 'rotateCCW':  dispatch({ type: 'ROTATE', cw: false }); break;
    }
  }, []);

  // When playing vs AI, human always controls P1; otherwise test mode (both)
  useInput(state.active, handleAction, aiPlayer ? (1 as Owner) : undefined);

  // ── AI turn ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!aiPlayer || state.phase === 'ended') return;
    if (state.active !== aiPlayer) return;

    // Small delay to make AI feel natural
    const delay = 300 + Math.random() * 400;
    const timer = setTimeout(() => {
      const s = stateRef.current;
      if (s.phase === 'ended' || s.active !== aiPlayer) return;

      const placement = aiFindPlacement(s.board, s.piece.type, aiPlayer, aiDifficulty);
      if (!placement) {
        // No valid placement — just hard drop wherever
        dispatch({ type: 'HARD_DROP' });
        return;
      }

      // Execute rotation
      const targetRot = placement.rot;
      const currentRot = s.piece.rot;
      const cwSteps = (targetRot - currentRot + 4) % 4;
      const ccwSteps = (currentRot - targetRot + 4) % 4;

      if (cwSteps <= ccwSteps) {
        for (let i = 0; i < cwSteps; i++) dispatch({ type: 'ROTATE', cw: true });
      } else {
        for (let i = 0; i < ccwSteps; i++) dispatch({ type: 'ROTATE', cw: false });
      }

      // Execute horizontal movement
      const dc = placement.col - s.piece.col;
      const dir = dc > 0 ? 1 : -1;
      for (let i = 0; i < Math.abs(dc); i++) dispatch({ type: 'MOVE', dc: dir });

      // Hard drop
      dispatch({ type: 'HARD_DROP' });
    }, delay);

    return () => clearTimeout(timer);
  }, [state.active, state.phase, state.isBonusTurn, aiPlayer, aiDifficulty]);

  // ── Derived display values ────────────────────────────────────────────────
  const fullDisplayBoard = state.phase !== 'ended' ? computeDisplayBoard(state) : state.board;

  // For growing boards, extract a viewport; for classic, use the full board
  const needsViewport = state.gameMode !== 'classic' && fullDisplayBoard.length > CONFIG.ROWS;
  const { viewport, offset: viewportOffset } = needsViewport
    ? getViewport(fullDisplayBoard, state)
    : { viewport: fullDisplayBoard, offset: 0 };

  const p1BandIdx = getBandIndex(state.scores[0]);
  const p2BandIdx = getBandIndex(state.scores[1]);

  // Opening visibility rule: hide P1's next until P2 completes first placement
  const showP1Next = state.p2HasPlaced;

  return {
    state,
    displayBoard: viewport,
    fullDisplayBoard,
    viewportOffset,
    p1BandIdx,
    p2BandIdx,
    showP1Next,
    handleAction,
    dispatch,
  };
}

export type { GameState };
