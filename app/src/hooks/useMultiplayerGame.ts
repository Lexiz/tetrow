// Hook that bridges the multiplayer WebSocket state into a format
// compatible with the existing game screen components.

import { useEffect, useCallback, useRef } from 'react';
import type { Owner, Board, CellValue } from '../../../shared/types';
import type { Action } from '../../../shared/game/engine';
import { getShape } from '../../../shared/game/pieces';
import { isValid } from '../../../shared/game/board';
import { getBandIndex } from '../../../shared/game/engine';
import { CONFIG } from '../../../shared/config';
import type { ClientGameState } from '../../../server/src/protocol';

type InputAction = 'left' | 'right' | 'softDrop' | 'hardDrop' | 'rotateCW' | 'rotateCCW';

function inputToAction(input: InputAction): Action {
  switch (input) {
    case 'left': return { type: 'MOVE', dc: -1 };
    case 'right': return { type: 'MOVE', dc: 1 };
    case 'softDrop': return { type: 'SOFT_DROP' };
    case 'hardDrop': return { type: 'HARD_DROP' };
    case 'rotateCW': return { type: 'ROTATE', cw: true };
    case 'rotateCCW': return { type: 'ROTATE', cw: false };
  }
}

/** Compute display board from server's ClientGameState (ghost + active piece overlay) */
function computeDisplayFromServer(gs: ClientGameState): Board {
  const { ROWS: R, COLS: C } = CONFIG;
  const display: CellValue[][] = gs.board.map(row => [...row] as CellValue[]);

  const piece = gs.piece;
  const cells = getShape(piece.type, piece.rot);

  // Ghost row
  let ghostDrop = 0;
  while (true) {
    const testPiece = { ...piece, row: piece.row + ghostDrop + 1 };
    if (!isValid(testPiece, gs.board)) break;
    ghostDrop++;
  }
  const ghostR = piece.row + ghostDrop;

  if (ghostR !== piece.row) {
    const ghostVal: CellValue = gs.active === 1 ? 'ghost1' : 'ghost2';
    for (const [dc, dr] of cells) {
      const c = piece.col + dc;
      const r = ghostR + dr;
      if (r >= 0 && r < R && c >= 0 && c < C && !display[r]![c]) {
        display[r]![c] = ghostVal;
      }
    }
  }

  // Active piece
  for (const [dc, dr] of cells) {
    const c = piece.col + dc;
    const r = piece.row + dr;
    if (r >= 0 && r < R && c >= 0 && c < C) {
      display[r]![c] = gs.active;
    }
  }

  return display;
}

/** Convert TetrominoType to mini-piece cell coords for preview */
function nextCells(type: string): [number, number][] {
  const cells = getShape(type as any, 0);
  const minC = Math.min(...cells.map(([c]) => c));
  const minR = Math.min(...cells.map(([, r]) => r));
  return cells.map(([c, r]) => [c - minC, r - minR]);
}

export function useMultiplayerGame(
  gameState: ClientGameState | null,
  myPlayer: Owner,
  sendAction: (action: Action) => void,
) {
  const sendRef = useRef(sendAction);
  sendRef.current = sendAction;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const myPlayerRef = useRef(myPlayer);
  myPlayerRef.current = myPlayer;

  // Keyboard input — only send actions when it's our turn
  useEffect(() => {
    const held = new Set<string>();
    const timers = new Map<string, {
      das: ReturnType<typeof setTimeout> | null;
      arr: ReturnType<typeof setInterval> | null;
    }>();

    const KEY_MAP: Record<string, InputAction> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowDown: 'softDrop',
      Space: 'hardDrop',
      ArrowUp: 'rotateCW',
      KeyZ: 'rotateCCW',
    };

    function fire(input: InputAction) {
      const gs = gameStateRef.current;
      if (!gs || gs.phase === 'ended') return;
      if (gs.active !== myPlayerRef.current) return;
      sendRef.current(inputToAction(input));
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (held.has(e.code)) return;
      const action = KEY_MAP[e.code];
      if (!action) return;

      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      held.add(e.code);
      fire(action);

      if (action === 'left' || action === 'right' || action === 'softDrop') {
        const handle = {
          das: null as ReturnType<typeof setTimeout> | null,
          arr: null as ReturnType<typeof setInterval> | null,
        };
        handle.das = setTimeout(() => {
          handle.das = null;
          handle.arr = setInterval(() => fire(action), CONFIG.ARR);
        }, CONFIG.DAS);
        timers.set(e.code, handle);
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      held.delete(e.code);
      const handle = timers.get(e.code);
      if (handle) {
        if (handle.das) clearTimeout(handle.das);
        if (handle.arr) clearInterval(handle.arr);
        timers.delete(e.code);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      for (const h of timers.values()) {
        if (h.das) clearTimeout(h.das);
        if (h.arr) clearInterval(h.arr);
      }
    };
  }, []);

  // Touch input handler (for mobile)
  const handleTouchAction = useCallback((_player: Owner, action: string) => {
    const gs = gameStateRef.current;
    if (!gs || gs.phase === 'ended') return;
    if (gs.active !== myPlayerRef.current) return;
    const input = action as InputAction;
    sendRef.current(inputToAction(input));
  }, []);

  if (!gameState) {
    return null;
  }

  const displayBoard = computeDisplayFromServer(gameState);
  const p1BandIdx = getBandIndex(gameState.scores[0]);
  const p2BandIdx = getBandIndex(gameState.scores[1]);

  const isMyTurn = gameState.active === myPlayer;
  const ended = gameState.phase === 'ended';

  // Next pieces: myNext is always known, opponentNext may be null
  const p1Next = myPlayer === 1
    ? nextCells(gameState.myNext)
    : (gameState.opponentNext ? nextCells(gameState.opponentNext) : []);
  const p2Next = myPlayer === 2
    ? nextCells(gameState.myNext)
    : (gameState.opponentNext ? nextCells(gameState.opponentNext) : []);

  return {
    displayBoard,
    scores: gameState.scores,
    active: gameState.active,
    p1BandIdx,
    p2BandIdx,
    p1Next: p1Next as [number, number][],
    p2Next: p2Next as [number, number][],
    isMyTurn,
    ended,
    phase: gameState.phase,
    lastClear: gameState.lastClear,
    clearedRows: gameState.clearedRows,
    stats: gameState.stats,
    toppedOut: gameState.toppedOut,
    winner: gameState.winner,
    handleTouchAction,
  };
}
