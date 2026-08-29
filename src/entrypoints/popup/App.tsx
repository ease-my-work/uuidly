import { useCallback, useState } from 'react';
import { ActionRow } from '@/components/ActionRow';
import { Header } from '@/components/Header';
import { UuidDisplay } from '@/components/UuidDisplay';
import { tabId, VersionTabs } from '@/components/VersionTabs';
import { useCopy } from '@/hooks/useCopy';
import { useHotkeys } from '@/hooks/useHotkeys';
import { generate, IS_CONSTANT, type UuidKind } from '@/lib/uuid';

const PANEL_ID = 'uuidly-value-panel';

interface AppProps {
  /**
   * Generated synchronously in `main.tsx` before the root is created, so the
   * first paint already shows a value. See docs/TECHNICAL.md §4.
   */
  initialUuid: string;
}

export default function App({ initialUuid }: AppProps) {
  const [kind, setKind] = useState<UuidKind>('v4');
  const [uuid, setUuid] = useState(initialUuid);
  const [shake, setShake] = useState(false);
  const { state, copy, reset } = useCopy();

  const canRefresh = !IS_CONSTANT[kind];

  const handleCopy = useCallback(() => {
    void copy(uuid);
  }, [copy, uuid]);

  const handleSelect = useCallback(
    (next: UuidKind) => {
      setKind(next);
      setUuid(generate(next));
      // The confirmation referred to the previous value.
      reset();
    },
    [reset],
  );

  const handleRefresh = useCallback(() => {
    if (IS_CONSTANT[kind]) {
      // Nothing to refresh, and saying so with a message would overstate it.
      setShake(true);
      return;
    }
    setUuid(generate(kind));
    reset();
  }, [kind, reset]);

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
        value={uuid}
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
    </main>
  );
}
