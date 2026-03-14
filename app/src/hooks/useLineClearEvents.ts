import { useState, useEffect, useRef } from 'react';
import type { Owner } from '../../../shared/types';

interface ClearEvent {
  id: number;
  rows: number[];
  player: Owner;
}

const CLEAR_ANIMATION_DURATION = 1700; // ms — must be >= LineClearEffect total duration

/**
 * Tracks line clear events and keeps them alive for the full animation duration,
 * even if the game state's clearedRows resets on the next lock.
 */
export function useLineClearEvents(
  lastClear: { id: number; player: Owner } | null,
  clearedRows: number[],
): ClearEvent[] {
  const [events, setEvents] = useState<ClearEvent[]>([]);
  const seenIds = useRef(new Set<number>());

  useEffect(() => {
    if (!lastClear || clearedRows.length === 0) return;
    if (seenIds.current.has(lastClear.id)) return;

    seenIds.current.add(lastClear.id);
    const event: ClearEvent = {
      id: lastClear.id,
      rows: [...clearedRows],
      player: lastClear.player,
    };

    setEvents(prev => [...prev, event]);

    // Remove after animation completes
    const timer = setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== event.id));
      seenIds.current.delete(lastClear.id);
    }, CLEAR_ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [lastClear, clearedRows]);

  return events;
}
