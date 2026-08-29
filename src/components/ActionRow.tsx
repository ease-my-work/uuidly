import { CheckIcon, CopyIcon, RefreshIcon } from './icons';

/** docs/DESIGN.md §7.5. */

interface ActionRowProps {
  copied: boolean;
  onCopy: () => void;
  onRefresh: () => void;
}

const BUTTON =
  'bg-surface-2 border-border rounded-control hover:bg-surface-3 flex h-9 flex-1 items-center justify-center gap-1.5 border text-[12px] font-medium tracking-[0.01em] transition-colors duration-[120ms]';

export function ActionRow({ copied, onCopy, onRefresh }: ActionRowProps) {
  return (
    <div className="flex gap-2 px-4 pt-2.5 pb-3.5">
      <button
        type="button"
        onClick={onCopy}
        className={`${BUTTON} ${copied ? 'text-success' : 'text-accent'}`}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? 'Copied' : 'Copy'}
      </button>

      <button type="button" onClick={onRefresh} className={`${BUTTON} text-text`}>
        <RefreshIcon />
        Refresh
      </button>
    </div>
  );
}
