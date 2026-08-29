import { useCallback, useState } from 'react';
import { ActionRow } from '@/components/ActionRow';
import { Header } from '@/components/Header';
import { UuidDisplay } from '@/components/UuidDisplay';
import { useCopy } from '@/hooks/useCopy';
import { generate } from '@/lib/uuid';

interface AppProps {
  /**
   * Generated synchronously in `main.tsx` before the root is created, so the
   * first paint already shows a value. See docs/TECHNICAL.md §4.
   */
  initialUuid: string;
}

export default function App({ initialUuid }: AppProps) {
  const [uuid, setUuid] = useState(initialUuid);
  const { state, copy, reset } = useCopy();

  const handleCopy = useCallback(() => {
    void copy(uuid);
  }, [copy, uuid]);

  const handleRefresh = useCallback(() => {
    setUuid(generate('v4'));
    // The confirmation referred to the previous value. Leaving it up would be a
    // lie about what is on the clipboard.
    reset();
  }, [reset]);

  return (
    <main>
      <Header />
      <UuidDisplay value={uuid} copyState={state} onCopy={handleCopy} />
      <ActionRow
        copied={state === 'copied'}
        onCopy={handleCopy}
        onRefresh={handleRefresh}
      />
    </main>
  );
}
