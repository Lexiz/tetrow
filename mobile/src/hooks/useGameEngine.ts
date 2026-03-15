import { useReducer, useEffect, useRef, useCallback } from 'react';
import type { Owner } from '../../../shared/types';
import {
  gameReducer,
  createInitialState,
  computeDisplayBoard,
  getBandIndex,
  getGravityMs,
  type GameState,
} from '../../../shared/game/engine';
import { aiFindPlacement, type AiDifficulty } from '../../../shared/game/ai';

interface EngineOptions {
  aiPlayer?: Owner;
  aiDifficulty?: AiDifficulty;
}

export function useGameEngine(options?: EngineOptions) {
  const aiPlayer = options?.aiPlayer;
  const aiDifficulty = options?.aiDifficulty ?? 'medium';
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Gravity timer ──────────────────────────────────────────────────────
  const activeScore = state.scores[state.active - 1];
  const gravityMs = getGravityMs(activeScore);

  useEffect(() => {
    if (state.phase === 'ended') return;
    const id = setInterval(() => {
      if (stateRef.current.phase !== 'ended') dispatch({ type: 'GRAVITY' });
    }, gravityMs);
    return () => clearInterval(id);
  }, [state.active, gravityMs, state.phase, state.isBonusTurn]);

  // ── Lock delay timer ───────────────────────────────────────────────────
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
      if (lockTimerRef.current === null) {
        lockTimerRef.current = setTimeout(() => {
          lockTimerRef.current = null;
          dispatch({ type: 'LOCK' });
        }, 500);
      }
    } else {
      clearLockTimer();
    }

    return clearLockTimer;
  }, [state.isGrounded, state.lockResets, state.phase]);

  // Reset lock timer on movement
  const prevGroundedRef = useRef(false);
  useEffect(() => {
    const wasGrounded = prevGroundedRef.current;
    prevGroundedRef.current = state.isGrounded;

    if (state.isGrounded && wasGrounded && lockTimerRef.current !== null) {
      clearLockTimer();
      lockTimerRef.current = setTimeout(() => {
        lockTimerRef.current = null;
        dispatch({ type: 'LOCK' });
      }, 500);
    }
  }, [state.lockResets]);

  // ── Input handling ─────────────────────────────────────────────────────
  const handleAction = useCallback((player: Owner, action: string) => {
    const s = stateRef.current;
    if (s.phase === 'ended') return;
    if (player !== s.active) return;

    switch (action) {
      case 'left':       dispatch({ type: 'MOVE', dc: -1 }); break;
      case 'right':      dispatch({ type: 'MOVE', dc:  1 }); break;
      case 'softDrop':   dispatch({ type: 'SOFT_DROP' });    break;
      case 'hardDrop':   dispatch({ type: 'HARD_DROP' });    break;
      case 'rotateCW':   dispatch({ type: 'ROTATE', cw: true  }); break;
      case 'rotateCCW':  dispatch({ type: 'ROTATE', cw: false }); break;
    }
  }, []);

  // ── AI turn ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!aiPlayer || state.phase === 'ended') return;
    if (state.active !== aiPlayer) return;

    const delay = 300 + Math.random() * 400;
    const timer = setTimeout(() => {
      const s = stateRef.current;
      if (s.phase === 'ended' || s.active !== aiPlayer) return;

      const placement = aiFindPlacement(s.board, s.piece.type, aiPlayer, aiDifficulty);
      if (!placement) {
        dispatch({ type: 'HARD_DROP' });
        return;
      }

      const targetRot = placement.rot;
      const currentRot = s.piece.rot;
      const cwSteps = (targetRot - currentRot + 4) % 4;
      const ccwSteps = (currentRot - targetRot + 4) % 4;

      if (cwSteps <= ccwSteps) {
        for (let i = 0; i < cwSteps; i++) dispatch({ type: 'ROTATE', cw: true });
      } else {
        for (let i = 0; i < ccwSteps; i++) dispatch({ type: 'ROTATE', cw: false });
      }

      const dc = placement.col - s.piece.col;
      const dir = dc > 0 ? 1 : -1;
      for (let i = 0; i < Math.abs(dc); i++) dispatch({ type: 'MOVE', dc: dir });

      dispatch({ type: 'HARD_DROP' });
    }, delay);

    return () => clearTimeout(timer);
  }, [state.active, state.phase, state.isBonusTurn, aiPlayer, aiDifficulty]);

  // ── Derived display values ─────────────────────────────────────────────
  const displayBoard = state.phase !== 'ended' ? computeDisplayBoard(state) : state.board;

  const p1BandIdx = getBandIndex(state.scores[0]);
  const p2BandIdx = getBandIndex(state.scores[1]);
  const showP1Next = state.p2HasPlaced;

  return {
    state,
    displayBoard,
    p1BandIdx,
    p2BandIdx,
    showP1Next,
    handleAction,
    dispatch,
  };
}

export type { GameState };
