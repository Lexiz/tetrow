import { useEffect, useRef } from 'react';
import type { Owner } from '../../../shared/types';

type InputAction = 'left' | 'right' | 'softDrop' | 'hardDrop' | 'rotateCW' | 'rotateCCW';

const SWIPE_THRESHOLD = 30;     // min px to register a swipe
const TAP_MAX_MOVE = 10;        // max px movement to count as a tap
const TAP_MAX_TIME = 250;       // max ms for a tap
const MOVE_STEP = 28;           // horizontal px per move trigger during drag
const SOFT_DROP_STEP = 28;      // vertical px per soft drop trigger during drag
const HARD_DROP_LOCK_RATIO = 1.5; // dy/dx ratio to lock out horizontal moves

/**
 * Touch gesture controls for mobile:
 *  - Swipe left/right → move
 *  - Tap left half of board → rotate CCW
 *  - Tap right half of board → rotate CW
 *  - Quick swipe down → hard drop
 *  - Slow drag down → soft drop (repeating)
 *  - Horizontal drag → repeated moves
 */
export function useTouchInput(
  activePlayer: Owner,
  onAction: (player: Owner, action: InputAction) => void,
  containerRef: React.RefObject<HTMLElement | null>,
  humanPlayer?: Owner,
) {
  const activeRef = useRef(activePlayer);
  activeRef.current = activePlayer;
  const humanRef = useRef(humanPlayer);
  humanRef.current = humanPlayer;
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let lastMoveX = 0;   // track cumulative horizontal drag
    let lastMoveY = 0;   // track cumulative vertical drag
    let handled = false;  // whether we've consumed this touch as a drag/swipe
    let hardDropLocked = false; // lock horizontal movement when a hard drop swipe is detected

    function fire(action: InputAction) {
      onActionRef.current(humanRef.current ?? activeRef.current, action);
    }

    function handleTouchStart(e: TouchEvent) {
      const t = e.touches[0]!;
      startX = t.clientX;
      startY = t.clientY;
      lastMoveX = t.clientX;
      lastMoveY = t.clientY;
      startTime = Date.now();
      handled = false;
      hardDropLocked = false;
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault(); // prevent scrolling
      const t = e.touches[0]!;
      const dx = t.clientX - lastMoveX;
      const dy = t.clientY - lastMoveY;
      const totalDx = t.clientX - startX;
      const totalDy = t.clientY - startY;

      // If we've moved enough, this is a drag, not a tap
      if (Math.abs(totalDx) > TAP_MAX_MOVE || Math.abs(totalDy) > TAP_MAX_MOVE) {
        handled = true;
      }

      // Detect hard drop intent: if moving predominantly downward, lock horizontal
      if (!hardDropLocked && totalDy > SWIPE_THRESHOLD && Math.abs(totalDy) > Math.abs(totalDx) * HARD_DROP_LOCK_RATIO) {
        hardDropLocked = true;
      }

      // Horizontal drag → repeated moves (only if not locked for hard drop)
      if (!hardDropLocked && Math.abs(dx) >= MOVE_STEP) {
        const moves = Math.floor(Math.abs(dx) / MOVE_STEP);
        for (let i = 0; i < moves; i++) {
          fire(dx > 0 ? 'right' : 'left');
        }
        lastMoveX += (dx > 0 ? 1 : -1) * moves * MOVE_STEP;
      }

      // Vertical drag down → soft drop (always allowed during downward drag;
      // hard drop is detected separately on touchEnd based on speed)
      if (dy > SOFT_DROP_STEP) {
        const drops = Math.floor(dy / SOFT_DROP_STEP);
        for (let i = 0; i < drops; i++) {
          fire('softDrop');
        }
        lastMoveY += drops * SOFT_DROP_STEP;
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      const t = e.changedTouches[0]!;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startTime;

      // Quick swipe down → hard drop
      if (dy > SWIPE_THRESHOLD && Math.abs(dx) < Math.abs(dy) * 0.5 && dt < 300) {
        fire('hardDrop');
        return;
      }

      // Quick swipe left/right (that wasn't handled by drag)
      if (!handled && Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        fire(dx > 0 ? 'right' : 'left');
        return;
      }

      // Tap → rotate
      if (!handled && dt < TAP_MAX_TIME && Math.abs(dx) < TAP_MAX_MOVE && Math.abs(dy) < TAP_MAX_MOVE) {
        const rect = el!.getBoundingClientRect();
        const tapX = t.clientX - rect.left;
        const halfWidth = rect.width / 2;
        fire(tapX > halfWidth ? 'rotateCW' : 'rotateCCW');
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef]);
}
