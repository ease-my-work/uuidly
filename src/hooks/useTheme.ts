import { useCallback, useEffect, useState } from 'react';
import { themePref, type Theme } from '@/lib/prefs';

export const THEMES: Theme[] = ['system', 'light', 'dark'];

export const THEME_LABEL: Record<Theme, string> = {
  system: 'System theme',
  light: 'Light theme',
  dark: 'Dark theme',
};

/**
 * Theme choice, applied by setting `data-theme` on the document element.
 *
 * `system` removes the attribute entirely rather than resolving the preference
 * itself, so `prefers-color-scheme` in the stylesheet stays in charge and the
 * popup follows the OS live. See src/assets/tailwind.css.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    let cancelled = false;
    void themePref.getValue().then((stored) => {
      if (!cancelled) setThemeState(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);

  const cycle = useCallback(() => {
    setThemeState((current) => {
      const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]!;
      void themePref.setValue(next);
      return next;
    });
  }, []);

  return { theme, cycle };
}
