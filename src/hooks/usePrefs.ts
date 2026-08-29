import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_FORMAT, type FormatOpts } from '@/lib/format';
import { countPref, formatPref, kindPref } from '@/lib/prefs';
import { clampCount, DEFAULT_KIND, type UuidKind } from '@/lib/uuid';

/**
 * Preferences, loaded *after* the first paint.
 *
 * The popup renders with defaults immediately and swaps in stored values when
 * they arrive. Awaiting storage before the first render would trade a real
 * property of the product — that a UUID is on screen instantly — for the
 * cosmetic gain of never showing the default. See docs/TECHNICAL.md §4.
 */
export function usePrefs() {
  const [kind, setKindState] = useState<UuidKind>(DEFAULT_KIND);
  const [format, setFormatState] = useState<FormatOpts>(DEFAULT_FORMAT);
  const [count, setCountState] = useState(10);
  const [hydrated, setHydrated] = useState(false);

  /**
   * Set as soon as the user changes anything. Storage is fast, but it is not
   * instant, and a preference arriving after a deliberate choice must not
   * overwrite it.
   */
  const touched = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [storedKind, storedFormat, storedCount] = await Promise.all([
        kindPref.getValue(),
        formatPref.getValue(),
        countPref.getValue(),
      ]);

      if (cancelled) return;
      if (!touched.current) {
        setKindState(storedKind);
        setFormatState(storedFormat);
        // Clamped on read: storage is only as trustworthy as whatever last wrote it.
        setCountState(clampCount(storedCount));
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setKind = useCallback((next: UuidKind) => {
    touched.current = true;
    setKindState(next);
    void kindPref.setValue(next);
  }, []);

  const setFormat = useCallback((next: FormatOpts) => {
    touched.current = true;
    setFormatState(next);
    void formatPref.setValue(next);
  }, []);

  const setCount = useCallback((next: number) => {
    touched.current = true;
    const clamped = clampCount(next);
    setCountState(clamped);
    void countPref.setValue(clamped);
  }, []);

  return { kind, format, count, hydrated, setKind, setFormat, setCount };
}
