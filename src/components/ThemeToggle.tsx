import { THEME_LABEL, useTheme } from '@/hooks/useTheme';

/** docs/DESIGN.md §7.1. */

const GLYPH = {
  system: '◐',
  light: '☀',
  dark: '☾',
} as const;

export function ThemeToggle() {
  const { theme, cycle } = useTheme();

  return (
    <button
      type="button"
      onClick={cycle}
      // The glyph alone cannot say which of three states is active, and the
      // control cycles rather than toggles, so the label carries both.
      aria-label={`${THEME_LABEL[theme]}. Activate to change`}
      title={THEME_LABEL[theme]}
      className="text-dim hover:text-text hover:bg-surface-2 flex h-7 w-7 items-center justify-center rounded text-[13px] transition-colors duration-[120ms]"
    >
      <span aria-hidden="true">{GLYPH[theme]}</span>
    </button>
  );
}
