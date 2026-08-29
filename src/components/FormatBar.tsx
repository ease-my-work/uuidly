import { nextWrapper, WRAPPER_LABEL, WRAPPER_NAME, type FormatOpts } from '@/lib/format';

/** docs/DESIGN.md §7.6. */

interface FormatBarProps {
  format: FormatOpts;
  onChange: (next: FormatOpts) => void;
}

const CHIP =
  'rounded-chip h-7 min-w-9 px-2 text-[12px] font-medium transition-colors duration-[120ms]';

const active = 'bg-accent-bg text-accent';
const inactive = 'bg-surface-2 text-dim hover:bg-surface-3';

export function FormatBar({ format, onChange }: FormatBarProps) {
  const wrapped = format.wrapper !== 'none';

  return (
    <div className="border-border flex items-center gap-1.5 border-t px-3.5 py-1.5">
      <span className="text-dim mr-0.5 text-[11px] font-medium tracking-[0.04em] uppercase">
        Format
      </span>

      <button
        type="button"
        aria-pressed={format.uppercase}
        aria-label={format.uppercase ? 'Uppercase, on' : 'Uppercase, off'}
        onClick={() => onChange({ ...format, uppercase: !format.uppercase })}
        className={`${CHIP} ${format.uppercase ? active : inactive}`}
      >
        aA
      </button>

      <button
        type="button"
        aria-pressed={format.hyphens}
        aria-label={format.hyphens ? 'Hyphens, on' : 'Hyphens, off'}
        onClick={() => onChange({ ...format, hyphens: !format.hyphens })}
        className={`${CHIP} ${format.hyphens ? active : inactive}`}
      >
        {'‑'}
      </button>

      <button
        type="button"
        aria-pressed={wrapped}
        // A glyph alone says nothing aloud, and this control cycles rather than
        // toggles, so the label names both the state and what comes next.
        aria-label={`Wrapper: ${WRAPPER_NAME[format.wrapper]}. Activate for ${
          WRAPPER_NAME[nextWrapper(format.wrapper)]
        }`}
        onClick={() => onChange({ ...format, wrapper: nextWrapper(format.wrapper) })}
        className={`${CHIP} ${wrapped ? active : inactive}`}
      >
        {WRAPPER_LABEL[format.wrapper]}
      </button>
    </div>
  );
}
