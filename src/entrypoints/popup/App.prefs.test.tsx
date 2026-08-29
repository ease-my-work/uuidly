import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import App from './App';
import { formatPref, kindPref } from '@/lib/prefs';
import { generate } from '@/lib/uuid';

const CANONICAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

let writeText: ReturnType<typeof vi.fn>;

function setup() {
  const user = userEvent.setup();
  writeText = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  const initialUuid = generate('v4');
  return { user, initialUuid, ...render(<App initialUuid={initialUuid} />) };
}

const displayed = () => screen.getByTestId('uuid-value').textContent ?? '';
const chip = (name: RegExp) => screen.getByRole('button', { name });
const caseChip = () => chip(/^Uppercase/);
const hyphenChip = () => chip(/^Hyphens/);
const wrapperChip = () => chip(/^Wrapper:/);

/** Recover the underlying UUID from whatever formatting is applied. */
const stripped = () =>
  displayed()
    .replace(/^urn:uuid:/, '')
    .replace(/^[{"]|[}"]$/g, '')
    .toLowerCase();

beforeEach(() => {
  fakeBrowser.reset();
});

describe('formatting changes presentation, not the value', () => {
  it('uppercases without regenerating', async () => {
    const { user } = setup();
    const before = displayed();

    await user.click(caseChip());

    expect(displayed()).toBe(before.toUpperCase());
    expect(stripped()).toBe(before);
  });

  it('removes hyphens without regenerating', async () => {
    const { user } = setup();
    const before = displayed();

    await user.click(hyphenChip());

    expect(displayed()).toBe(before.replaceAll('-', ''));
    expect(displayed()).toHaveLength(32);
  });

  it('cycles the wrapper through braces, quotes and urn, then back', async () => {
    const { user } = setup();
    const raw = displayed();

    await user.click(wrapperChip());
    expect(displayed()).toBe(`{${raw}}`);

    await user.click(wrapperChip());
    expect(displayed()).toBe(`"${raw}"`);

    await user.click(wrapperChip());
    expect(displayed()).toBe(`urn:uuid:${raw}`);

    await user.click(wrapperChip());
    expect(displayed()).toBe(raw);
  });

  it('leaves the underlying UUID untouched across every toggle', async () => {
    const { user } = setup();
    const raw = displayed();

    await user.click(caseChip());
    await user.click(hyphenChip());
    await user.click(wrapperChip());

    // Formatting is presentation. Regenerating here would silently hand the user
    // a different UUID than the one they were looking at.
    expect(stripped().replace(/-/g, '')).toBe(raw.replaceAll('-', ''));
  });

  it('copies the formatted string, not the raw one', async () => {
    const { user } = setup();
    await user.click(caseChip());
    await user.click(wrapperChip());

    await user.click(screen.getByRole('button', { name: /^Copy UUID/ }));

    expect(writeText).toHaveBeenCalledExactlyOnceWith(displayed());
    expect(displayed()).toMatch(/^\{[0-9A-F-]+\}$/);
  });

  it('clears a copy confirmation that no longer describes the clipboard', async () => {
    const { user } = setup();

    const copyButton = () => screen.getByRole('button', { name: 'Copy' });

    await user.click(screen.getByRole('button', { name: /^Copy UUID/ }));
    await waitFor(() => {
      expect(copyButton()).toHaveAttribute('data-state', 'copied');
    });

    await user.click(caseChip());

    await waitFor(() => {
      expect(copyButton()).toHaveAttribute('data-state', 'idle');
    });
  });

  it('reflects state on the chips for assistive technology', async () => {
    const { user } = setup();
    expect(caseChip()).toHaveAttribute('aria-pressed', 'false');
    // Hyphens are on by default, so its chip starts pressed.
    expect(hyphenChip()).toHaveAttribute('aria-pressed', 'true');

    await user.click(caseChip());
    expect(caseChip()).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('preferences persist', () => {
  it('restores the stored version on the next open', async () => {
    await kindPref.setValue('v7');
    setup();

    // Both assertions inside the wait: adopting the stored kind and regenerating
    // the value happen in successive renders, so the tab flips first.
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'v7' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(displayed()[14]).toBe('7');
    });
  });

  it('restores the stored format on the next open', async () => {
    await formatPref.setValue({ uppercase: true, hyphens: false, wrapper: 'braces' });
    setup();

    await waitFor(() => {
      expect(displayed()).toMatch(/^\{[0-9A-F]{32}\}$/);
    });
  });

  it('writes the version when the user picks one', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'v1' }));

    await waitFor(async () => {
      expect(await kindPref.getValue()).toBe('v1');
    });
  });

  it('writes the format when the user changes it', async () => {
    const { user } = setup();
    await user.click(caseChip());

    await waitFor(async () => {
      expect((await formatPref.getValue()).uppercase).toBe(true);
    });
  });

  it('falls back to defaults when nothing is stored', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'v4' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
    expect(displayed()).toMatch(CANONICAL);
  });
});

describe('hydration never blocks the first paint', () => {
  it('shows a UUID before storage has answered', async () => {
    // Storage that has not resolved yet is the normal case on open, not an edge
    // case: if the popup waited for it, it would render empty every single time.
    let release: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const getValue = vi.spyOn(kindPref, 'getValue').mockImplementation(async () => {
      await pending;
      return 'v7';
    });

    setup();

    // Synchronously after render, with storage still outstanding.
    expect(displayed()).toMatch(CANONICAL);
    expect(displayed()[14]).toBe('4');

    release?.();
    await waitFor(() => {
      expect(displayed()[14]).toBe('7');
    });

    getValue.mockRestore();
  });

  it('does not overwrite a choice the user made while storage was loading', async () => {
    let release: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const getValue = vi.spyOn(kindPref, 'getValue').mockImplementation(async () => {
      await pending;
      return 'v7';
    });

    const { user } = setup();

    // The user is faster than storage. Their choice wins.
    await user.click(screen.getByRole('tab', { name: 'NIL' }));
    release?.();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'NIL' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
    expect(displayed()).toBe('00000000-0000-0000-0000-000000000000');

    getValue.mockRestore();
  });
});
