import { useCallback, useRef } from 'react';
import { APP_VERSION } from '../../../shared/version';

const BASE = import.meta.env.BASE_URL; // '/tetchess/' in prod

/**
 * Returns a function that checks for a newer deployed version.
 * If a newer version is found, the page is hard-reloaded.
 * Safe to call on every screen transition — uses a cooldown to
 * avoid hammering the server and a cache-bust query param.
 */
export function useVersionCheck() {
  const lastCheck = useRef(0);
  const COOLDOWN_MS = 30_000; // check at most every 30s

  const checkVersion = useCallback(async () => {
    const now = Date.now();
    if (now - lastCheck.current < COOLDOWN_MS) return;
    lastCheck.current = now;

    try {
      const res = await fetch(`${BASE}version.json?t=${now}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.version && data.version !== APP_VERSION) {
        // New version available — reload to pick up new assets
        window.location.reload();
      }
    } catch {
      // Network error — silently ignore
    }
  }, []);

  return checkVersion;
}
