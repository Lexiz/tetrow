import { useEffect, useRef } from 'react';
import type { Owner } from '../../../shared/types';
import { CONFIG } from '../../../shared/config';

type InputAction = 'left' | 'right' | 'softDrop' | 'hardDrop' | 'rotateCW' | 'rotateCCW';

const P1_KEYS: Record<string, InputAction> = {
  ArrowLeft:  'left',
  ArrowRight: 'right',
  ArrowDown:  'softDrop',
  Space:      'hardDrop',
  ArrowUp:    'rotateCW',
  KeyZ:       'rotateCCW',
};

const P2_KEYS: Record<string, InputAction> = {
  KeyA:        'left',
  KeyD:        'right',
  KeyS:        'softDrop',
  ShiftLeft:   'hardDrop',
  ShiftRight:  'hardDrop',
  KeyW:        'rotateCW',
  KeyX:        'rotateCCW',
};

export function useInput(
  activePlayer: Owner,
  onAction: (player: Owner, action: InputAction) => void,
) {
  const activeRef = useRef(activePlayer);
  activeRef.current = activePlayer;
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  useEffect(() => {
    const held = new Set<string>();
    const timers = new Map<string, {
      das: ReturnType<typeof setTimeout> | null;
      arr: ReturnType<typeof setInterval> | null;
    }>();

    function fire(player: Owner, action: InputAction) {
      onActionRef.current(player, action);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (held.has(e.code)) return;

      // Determine which player's key this is
      const p1Action = P1_KEYS[e.code];
      const p2Action = P2_KEYS[e.code];
      const action = p1Action ?? p2Action;
      if (!action) return;
      // TEST MODE: arrow keys control whichever player is active
      const player: Owner = p1Action ? activeRef.current : 2;

      // Prevent browser scroll on arrow/space keys
      if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space'].includes(e.code)) {
        e.preventDefault();
      }

      held.add(e.code);
      fire(player, action);

      // DAS only for directional repeating keys
      if (action === 'left' || action === 'right' || action === 'softDrop') {
        const handle = {
          das: null as ReturnType<typeof setTimeout> | null,
          arr: null as ReturnType<typeof setInterval> | null,
        };
        handle.das = setTimeout(() => {
          handle.das = null;
          handle.arr = setInterval(() => fire(player, action), CONFIG.ARR);
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
      timers.clear();
      held.clear();
    };
  }, []); // refs keep values current without re-subscribing
}
