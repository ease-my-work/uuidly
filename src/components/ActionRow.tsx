import { CheckIcon, CopyIcon, RefreshIcon } from './icons';

/** docs/DESIGN.md §7.5. */

interface ActionRowProps {
  copied: boolean;
  /** False for NIL and MAX, which are fixed constants. */
  canRefresh: boolean;
  /** Set briefly when refresh was attempted on a constant — DESIGN.md §8. */
  shake: boolean;
  onCopy: () => void;
  onRefresh: () => void;
  onShakeEnd: () => void;
}

const BUTTON =
  'bg-surface-2 border-border rounded-control flex h-9 flex-1 items-center justify-center gap-1.5 border text-[12px] font-medium tracking-[0.01em] transition-colors duration-[120ms]';

export function ActionRow({
  copied,
  canRefresh,
  shake,
  onCopy,
  onRefresh,
  onShakeEnd,
}: ActionRowProps) {
  return (
    <div className="flex gap-2 px-4 pt-2.5 pb-3.5">
      <button
        type="button"
        onClick={onCopy}
        className={`${BUTTON} hover:bg-surface-3 ${copied ? 'text-success' : 'text-accent'}`}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? 'Copied' : 'Copy'}
      </button>

      <button
        type="button"
        onClick={onRefresh}
        aria-disabled={!canRefresh}
        title={
          canRefresh
            ? undefined
            : 'NIL and MAX are fixed constants — there is nothing to refresh'
        }
        onAnimationEnd={onShakeEnd}
        className={`${BUTTON} text-text ${
          canRefresh ? 'hover:bg-surface-3' : 'cursor-not-allowed opacity-40'
        } ${shake ? 'animate-shake' : ''}`}
      >
        <RefreshIcon />
        Refresh
      </button>
    </div>
  );
}
