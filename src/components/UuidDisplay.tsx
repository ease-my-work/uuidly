import type { CopyState } from '@/hooks/useCopy';
import { CheckIcon, CopyIcon, RefreshIcon } from './icons';

/** docs/DESIGN.md §7.3, §7.4, §7.5. */

interface UuidDisplayProps {
  value: string;
  copyState: CopyState;
  onCopy: () => void;
  /** False for NIL and MAX, which are fixed constants. */
  canRefresh: boolean;
  /** Set briefly when refresh was attempted on a constant — DESIGN.md §8. */
  shake: boolean;
  onRefresh: () => void;
  onShakeEnd: () => void;
  /** Ties this panel to the version tablist. */
  panelId: string;
  labelledBy: string;
}

const HINT: Record<CopyState, string> = {
  idle: 'click to copy',
  copied: '✓ Copied',
  failed: 'Copy failed — select and press Ctrl+C',
};

const ICON_BUTTON =
  'bg-surface-2 border-border flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] border transition-colors duration-[120ms]';

export function UuidDisplay({
  value,
  copyState,
  onCopy,
  canRefresh,
  shake,
  onRefresh,
  onShakeEnd,
  panelId,
  labelledBy,
}: UuidDisplayProps) {
  const copied = copyState === 'copied';
  const failed = copyState === 'failed';

  const border = copied
    ? 'border-success'
    : failed
      ? 'border-danger'
      : 'border-border hover:border-accent/40';

  const hint = copied ? 'text-success' : failed ? 'text-danger' : 'text-mute';

  return (
    <div role="tabpanel" id={panelId} aria-labelledby={labelledBy} className="px-3 pt-3">
      <div
        className={`bg-surface rounded-card group border px-3 pt-3 pb-2 transition-colors duration-[120ms] ${border}`}
      >
        <div className="flex items-center gap-2">
          {/*
            The copy target is the value alone, not the whole card. A card with
            role="button" wrapping these two buttons would be nested-interactive:
            invalid ARIA, and unusable with a screen reader.
          */}
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
            // Never wraps. Formats longer than the frame — `urn:uuid:` is 45
            // characters — scroll sideways rather than wrapping or truncating.
            // A truncated UUID looks exactly like a whole one, which is worse
            // than an obviously clipped one.
            className="min-w-0 flex-1 cursor-pointer overflow-x-auto whitespace-nowrap"
          >
            <span
              data-testid="uuid-value"
              className={`font-mono text-[13.5px] leading-[1.5] font-medium tracking-[0.01em] [font-variant-numeric:tabular-nums] ${
                failed ? 'select-text' : 'select-none'
              }`}
            >
              {value}
            </span>
          </div>

          <button
            type="button"
            aria-label="Copy"
            // The name stays "Copy" so repeat activation is predictable; the
            // confirmation is carried by the live region and the hint line.
            data-state={copied ? 'copied' : 'idle'}
            onClick={onCopy}
            className={`${ICON_BUTTON} hover:bg-surface-3 ${copied ? 'text-success' : 'text-accent'}`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>

          <button
            type="button"
            aria-label="Refresh"
            onClick={onRefresh}
            aria-disabled={!canRefresh}
            title={
              canRefresh
                ? undefined
                : 'NIL and MAX are fixed constants — there is nothing to refresh'
            }
            onAnimationEnd={onShakeEnd}
            className={`${ICON_BUTTON} text-text ${
              canRefresh ? 'hover:bg-surface-3' : 'cursor-not-allowed opacity-40'
            } ${shake ? 'animate-shake' : ''}`}
          >
            <RefreshIcon />
          </button>
        </div>

        {/*
          Decorative: the copy control's own label already says what it does, and
          the copied/failed states are announced by the live region below. Its
          height is reserved so revealing it never shifts the layout.
        */}
        <p
          aria-hidden="true"
          data-state={copyState}
          className={`mt-1 h-4 text-right text-[11px] leading-4 transition-opacity duration-[120ms] ${hint} ${
            // At rest the hint is noise once you know the interaction. On hover
            // it explains; on focus-within it does the same for keyboard users,
            // who never hover.
            copied || failed
              ? 'opacity-100'
              : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'
          }`}
        >
          {HINT[copyState]}
        </p>
      </div>

      <span aria-live="polite" className="sr-only">
        {copied ? `Copied ${value}` : failed ? 'Copy failed' : ''}
      </span>
    </div>
  );
}
