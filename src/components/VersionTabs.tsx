import { useRef } from 'react';
import { KINDS, LABELS, type UuidKind } from '@/lib/uuid';

/** docs/DESIGN.md §7.2. */

interface VersionTabsProps {
  active: UuidKind;
  onSelect: (kind: UuidKind) => void;
  /** id of the element this tablist controls, for `aria-controls`. */
  panelId: string;
}

export const tabId = (kind: UuidKind) => `uuidly-tab-${kind}`;

export function VersionTabs({ active, onSelect, panelId }: VersionTabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Roving tabindex with automatic activation: arrow keys move focus and select
   * in one step. Standard for tabs, and correct here because switching is free —
   * there is nothing to load and nothing to lose by landing on a tab.
   */
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = KINDS.length - 1;
    let next: number | null = null;

    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;

    if (next === null) return;

    event.preventDefault();
    // KINDS is a fixed-length tuple, and `next` is derived from its bounds.
    onSelect(KINDS[next]!);
    refs.current[next]?.focus();
  };

  return (
    <div className="px-3.5 pt-4">
      <div
        role="tablist"
        aria-label="UUID version"
        className="bg-surface-2 rounded-control flex gap-0.5 p-0.5"
      >
        {KINDS.map((kind, index) => {
          const selected = kind === active;
          return (
            <button
              key={kind}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={tabId(kind)}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(kind)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`rounded-chip h-7 flex-1 text-[12px] font-medium tracking-[0.01em] transition-colors duration-[120ms] ${
                selected
                  ? 'bg-accent-bg text-accent'
                  : 'text-dim hover:bg-surface-3 bg-transparent'
              }`}
            >
              {LABELS[kind]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
