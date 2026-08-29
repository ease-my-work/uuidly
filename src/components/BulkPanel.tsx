import { useEffect, useRef, useState } from 'react';
import { BULK_MAX, BULK_MIN, clampCount } from '@/lib/uuid';
import { CopyIcon } from './icons';

/** docs/DESIGN.md §7.7. */

interface BulkPanelProps {
  expanded: boolean;
  onToggle: () => void;
  count: number;
  onCountChange: (count: number) => void;
  /** Formatted values, or null before the first Generate. */
  rows: string[] | null;
  kindLabel: string;
  csvBytes: number;
  onGenerate: () => void;
  onCopyRow: (value: string) => void;
  onCopyAll: () => void;
  onCopyJson: () => void;
  onDownloadCsv: () => void;
  downloadFailed: boolean;
}

const SMALL_BUTTON =
  'bg-surface-2 border-border rounded-control hover:bg-surface-3 h-8 border px-2.5 text-[11px] font-medium transition-colors duration-[120ms]';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function BulkPanel({
  expanded,
  onToggle,
  count,
  onCountChange,
  rows,
  kindLabel,
  csvBytes,
  onGenerate,
  onCopyRow,
  onCopyAll,
  onCopyJson,
  onDownloadCsv,
  downloadFailed,
}: BulkPanelProps) {
  // The field holds a string so it can be empty mid-edit. Committing to a number
  // happens on blur or Enter, not on every keystroke.
  const [draft, setDraft] = useState(String(count));
  const [snapped, setSnapped] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setDraft(String(count)), [count]);

  useEffect(
    () => () => {
      if (flashTimer.current !== null) clearTimeout(flashTimer.current);
    },
    [],
  );

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    const clamped = clampCount(parsed);

    // Flash only when the value was actually corrected, so a clean entry is silent.
    if (String(clamped) !== draft.trim()) {
      setSnapped(true);
      if (flashTimer.current !== null) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setSnapped(false), 300);
    }

    setDraft(String(clamped));
    onCountChange(clamped);
  };

  return (
    <section className="border-border border-t">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls="uuidly-bulk"
        className="text-dim hover:text-text flex h-9 w-full items-center gap-2 px-3.5 text-[12px] font-medium transition-colors duration-[120ms]"
      >
        <span aria-hidden="true" className="text-[9px]">
          {expanded ? '▼' : '▶'}
        </span>
        Bulk generate
        <span className="text-mute ml-auto text-[11px]">
          {BULK_MIN}–{BULK_MAX}
        </span>
      </button>

      {expanded && (
        <div id="uuidly-bulk" className="px-3.5 pb-3.5">
          <div className="flex items-center gap-2.5">
            <label htmlFor="uuidly-count" className="text-dim text-[11px]">
              Count
            </label>
            <input
              id="uuidly-count"
              type="number"
              inputMode="numeric"
              min={BULK_MIN}
              max={BULK_MAX}
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commit();
                }
              }}
              className={`bg-surface-2 rounded-chip h-8 w-14 border px-2 text-center font-mono text-[12px] [font-variant-numeric:tabular-nums] transition-colors duration-[120ms] ${
                snapped ? 'border-danger' : 'border-border'
              }`}
            />
            <input
              type="range"
              aria-label="Count"
              min={BULK_MIN}
              max={BULK_MAX}
              value={clampCount(Number.parseInt(draft, 10))}
              onChange={(event) =>
                onCountChange(clampCount(event.currentTarget.valueAsNumber))
              }
              className="accent-accent h-8 flex-1"
            />
            <button type="button" onClick={onGenerate} className={SMALL_BUTTON}>
              Generate
            </button>
          </div>

          <div className="bg-surface border-border mt-2.5 max-h-[180px] overflow-y-auto rounded-lg border">
            {rows === null ? (
              <p className="text-mute px-3 py-4 text-center text-[11px]">
                Press Generate to create {count} UUIDs
              </p>
            ) : (
              <ul>
                {rows.map((value, index) => (
                  <li
                    key={`${index}-${value}`}
                    className="group hover:bg-surface-2 flex h-7 items-center gap-2 px-2.5"
                  >
                    <span className="text-dim w-6 shrink-0 text-right font-mono text-[11px] [font-variant-numeric:tabular-nums]">
                      {index + 1}
                    </span>
                    <span title={value} className="flex-1 truncate font-mono text-[12px]">
                      {value}
                    </span>
                    <button
                      type="button"
                      aria-label={`Copy ${value}`}
                      onClick={() => onCopyRow(value)}
                      // Hidden until hover, but never hidden from the keyboard.
                      className="text-dim hover:text-accent focus-visible:opacity-100 rounded p-1 opacity-0 transition-opacity duration-[120ms] group-hover:opacity-100"
                    >
                      <CopyIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={onCopyAll}
              disabled={rows === null}
              className={`${SMALL_BUTTON} flex-1 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Copy all
            </button>
            <button
              type="button"
              onClick={onCopyJson}
              disabled={rows === null}
              className={`${SMALL_BUTTON} flex-1 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Copy JSON
            </button>
            <button
              type="button"
              onClick={onDownloadCsv}
              disabled={rows === null}
              className={`${SMALL_BUTTON} text-accent flex-1 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              ⤓ CSV
            </button>
          </div>

          {downloadFailed && (
            <p className="text-danger mt-2 text-[11px]">
              Download blocked. Use Copy all instead.
            </p>
          )}

          {rows !== null && (
            <p className="text-mute mt-2 text-center text-[11px]">
              {rows.length} UUIDs · {kindLabel} · {formatBytes(csvBytes)}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
