import { useCallback, useEffect, useRef, useState } from 'react';
import { copyText } from '@/lib/clipboard';

export type CopyState = 'idle' | 'copied' | 'failed';

/** How long the confirmation stays on screen — docs/DESIGN.md §7.4. */
const RESET_MS = 1200;

/**
 * Owns the transient copy confirmation.
 *
 * The state reverts on a timer rather than persisting, because the confirmation
 * is feedback about an action, not a property of the value.
 */
export function useCopy(resetMs: number = RESET_MS) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyText(text);
      setState(ok ? 'copied' : 'failed');

      // Restart rather than stack, so copying twice does not end the
      // confirmation early on the first timer.
      clearTimer();
      timer.current = setTimeout(() => setState('idle'), resetMs);
      return ok;
    },
    [clearTimer, resetMs],
  );

  /** Drop the confirmation immediately — the value it referred to has changed. */
  const reset = useCallback(() => {
    clearTimer();
    setState('idle');
  }, [clearTimer]);

  return { state, copy, reset };
}
