import { useReducer, useEffect, useRef, useCallback } from 'react';
import type { Owner } from '../types';
import {
  gameReducer,
  createInitialState,
  computeDisplayBoard,
  getBandIndex,
  getGravityMs,
  type GameState,
} from '../game/engine';
import { useInput } from './useInput';

export function useGameEngine() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
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
  }, [state.active, gravityMs, state.phase]);

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

  useInput(state.active, handleAction);

  // ── Derived display values ────────────────────────────────────────────────
  const displayBoard = state.phase !== 'ended' ? computeDisplayBoard(state) : state.board;

  const p1BandIdx = getBandIndex(state.scores[0]);
  const p2BandIdx = getBandIndex(state.scores[1]);

  // Opening visibility rule: hide P1's next until P2 completes first placement
  const showP1Next = state.p2HasPlaced;

  return {
    state,
    displayBoard,
    p1BandIdx,
    p2BandIdx,
    showP1Next,
    dispatch,
  };
}

export type { GameState };
