import type { CopyState } from '@/hooks/useCopy';

/** docs/DESIGN.md §7.3 and §7.4. */

interface UuidDisplayProps {
  value: string;
  copyState: CopyState;
  onCopy: () => void;
}

const HINT: Record<CopyState, string> = {
  idle: 'click to copy',
  copied: '✓ Copied',
  failed: 'Copy failed — select and press Ctrl+C',
};

export function UuidDisplay({ value, copyState, onCopy }: UuidDisplayProps) {
  const copied = copyState === 'copied';
  const failed = copyState === 'failed';

  const border = copied
    ? 'border-success'
    : failed
      ? 'border-danger'
      : 'border-border hover:border-accent/40';

  const hint = copied ? 'text-success' : failed ? 'text-danger' : 'text-mute';

  return (
    <div className="px-4 pt-4">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Copy UUID ${value}`}
        onClick={onCopy}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onCopy();
          }
        }}
        className={`bg-surface rounded-card flex min-h-[76px] cursor-pointer flex-col justify-between border px-4 py-3.5 transition-colors duration-[120ms] ${border}`}
      >
        <span
          data-testid="uuid-value"
          // `anywhere` rather than `break-all` so the value still wraps at a
          // sensible point instead of mid-group — DESIGN.md §7.3.
          className={`font-mono text-[15px] leading-[1.55] font-medium tracking-[0.01em] [font-variant-numeric:tabular-nums] [overflow-wrap:anywhere] ${
            failed ? 'select-text' : 'select-none'
          }`}
        >
          {value}
        </span>

        <span className={`mt-2 self-end text-[11px] ${hint}`}>{HINT[copyState]}</span>
      </div>

      {/* Announced to screen readers; the visual hint above is aria-hidden from
          this region's perspective because it is not inside it. */}
      <span aria-live="polite" className="sr-only">
        {copied ? `Copied ${value}` : failed ? 'Copy failed' : ''}
      </span>
    </div>
  );
}
