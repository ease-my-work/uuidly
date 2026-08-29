import { useCallback, useEffect, useState } from 'react';
import { ActionRow } from '@/components/ActionRow';
import { FormatBar } from '@/components/FormatBar';
import { Header } from '@/components/Header';
import { UuidDisplay } from '@/components/UuidDisplay';
import { tabId, VersionTabs } from '@/components/VersionTabs';
import { useCopy } from '@/hooks/useCopy';
import { useHotkeys } from '@/hooks/useHotkeys';
import { usePrefs } from '@/hooks/usePrefs';
import { applyFormat, type FormatOpts } from '@/lib/format';
import { DEFAULT_KIND, generate, IS_CONSTANT, type UuidKind } from '@/lib/uuid';

const PANEL_ID = 'uuidly-value-panel';

interface AppProps {
  /**
   * Generated synchronously in `main.tsx` before the root is created, so the
   * first paint already shows a value. See docs/TECHNICAL.md §4.
   */
  initialUuid: string;
}

export default function App({ initialUuid }: AppProps) {
  const { kind, format, hydrated, setKind, setFormat } = usePrefs();
  const [raw, setRaw] = useState(initialUuid);
  const [shake, setShake] = useState(false);
  const { state, copy, reset } = useCopy();

  // What the user sees, and exactly what gets copied.
  const value = applyFormat(raw, format);
  const canRefresh = !IS_CONSTANT[kind];

  /**
   * Adopt the stored version once preferences arrive.
   *
   * `raw === initialUuid` means the user has not acted yet. If they have, their
   * choice already replaced the seeded value and must not be overwritten by a
   * preference that was merely slower to load.
   */
  useEffect(() => {
    if (!hydrated) return;
    if (kind !== DEFAULT_KIND && raw === initialUuid) setRaw(generate(kind));
  }, [hydrated, kind, raw, initialUuid]);

  const handleCopy = useCallback(() => {
    void copy(value);
  }, [copy, value]);

  const handleSelect = useCallback(
    (next: UuidKind) => {
      setKind(next);
      setRaw(generate(next));
      // The confirmation referred to the previous value.
      reset();
    },
    [reset, setKind],
  );

  const handleRefresh = useCallback(() => {
    if (IS_CONSTANT[kind]) {
      // Nothing to refresh, and saying so with a message would overstate it.
      setShake(true);
      return;
    }
    setRaw(generate(kind));
    reset();
  }, [kind, reset]);

  const handleFormat = useCallback(
    (next: FormatOpts) => {
      setFormat(next);
      // The UUID is untouched, but the string on the clipboard is now stale.
      reset();
    },
    [reset, setFormat],
  );

  const handleClose = useCallback(() => {
    window.close();
  }, []);

  useHotkeys({
    onSelect: handleSelect,
    onRefresh: handleRefresh,
    onCopy: handleCopy,
    onClose: handleClose,
  });

  return (
    <main>
      <Header />
      <VersionTabs active={kind} onSelect={handleSelect} panelId={PANEL_ID} />
      <UuidDisplay
        value={value}
        copyState={state}
        onCopy={handleCopy}
        panelId={PANEL_ID}
        labelledBy={tabId(kind)}
      />
      <ActionRow
        copied={state === 'copied'}
        canRefresh={canRefresh}
        shake={shake}
        onCopy={handleCopy}
        onRefresh={handleRefresh}
        onShakeEnd={() => setShake(false)}
      />
      <FormatBar format={format} onChange={handleFormat} />
    </main>
  );
}
