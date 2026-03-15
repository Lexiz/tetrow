import { useRef, useCallback } from 'react';
import type { Owner } from '../../../shared/types';
import type {
  GestureStateChangeEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  TapGestureHandlerEventPayload,
} from 'react-native-gesture-handler';

type InputAction = 'left' | 'right' | 'softDrop' | 'hardDrop' | 'rotateCW' | 'rotateCCW';

const MOVE_STEP = 28;
const SOFT_DROP_STEP = 28;
const HARD_DROP_VELOCITY = 800; // px/s downward velocity threshold
const HARD_DROP_LOCK_PX = 30;  // min downward px before locking horizontal
const HARD_DROP_LOCK_RATIO = 1.5; // dy/dx ratio to detect hard drop intent

export function useTouchInput(
  activePlayer: Owner,
  onAction: (player: Owner, action: InputAction) => void,
  boardWidth: number,
  humanPlayer?: Owner,
) {
  const activeRef = useRef(activePlayer);
  activeRef.current = activePlayer;
  const humanRef = useRef(humanPlayer);
  humanRef.current = humanPlayer;
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  // Track cumulative drag for step-based moves
  const cumulativeX = useRef(0);
  const cumulativeY = useRef(0);
  const hardDropLocked = useRef(false);

  const fire = useCallback((action: InputAction) => {
    onActionRef.current(humanRef.current ?? activeRef.current, action);
  }, []);

  const onPanBegin = useCallback(() => {
    cumulativeX.current = 0;
    cumulativeY.current = 0;
    hardDropLocked.current = false;
  }, []);

  const onPanUpdate = useCallback((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
    const dx = e.translationX - cumulativeX.current;
    const dy = e.translationY - cumulativeY.current;

    // Detect hard drop intent: predominantly downward movement locks out horizontal
    if (!hardDropLocked.current &&
        e.translationY > HARD_DROP_LOCK_PX &&
        Math.abs(e.translationY) > Math.abs(e.translationX) * HARD_DROP_LOCK_RATIO) {
      hardDropLocked.current = true;
    }

    // Horizontal drag → repeated moves (only if not locked for hard drop)
    if (!hardDropLocked.current && Math.abs(dx) >= MOVE_STEP) {
      const moves = Math.floor(Math.abs(dx) / MOVE_STEP);
      for (let i = 0; i < moves; i++) {
        fire(dx > 0 ? 'right' : 'left');
      }
      cumulativeX.current += (dx > 0 ? 1 : -1) * moves * MOVE_STEP;
    }

    // Vertical drag down → soft drop (only if not a fast hard drop swipe)
    if (!hardDropLocked.current && dy > SOFT_DROP_STEP) {
      const drops = Math.floor(dy / SOFT_DROP_STEP);
      for (let i = 0; i < drops; i++) {
        fire('softDrop');
      }
      cumulativeY.current += drops * SOFT_DROP_STEP;
    }
  }, [fire]);

  const onPanEnd = useCallback((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
    // Quick swipe down → hard drop
    if (
      e.velocityY > HARD_DROP_VELOCITY &&
      Math.abs(e.velocityX) < Math.abs(e.velocityY) * 0.5
    ) {
      fire('hardDrop');
    }
  }, [fire]);

  const onTap = useCallback((e: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => {
    const tapX = e.x;
    const halfWidth = boardWidth / 2;
    fire(tapX > halfWidth ? 'rotateCW' : 'rotateCCW');
  }, [boardWidth, fire]);

  return {
    onPanBegin,
    onPanUpdate,
    onPanEnd,
    onTap,
  };
}
