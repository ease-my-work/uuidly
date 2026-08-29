import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import App from './App';
import { generate } from '@/lib/uuid';

// The popup persists the selected version from T3.2 onward, so each test needs a
// clean store — otherwise one test's choice hydrates into the next.
beforeEach(() => {
  fakeBrowser.reset();
});

const NIL = '00000000-0000-0000-0000-000000000000';
const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

let writeText: ReturnType<typeof vi.fn>;

/** Our clipboard stub has to be installed after user-event's — see App.test.tsx. */
function setup() {
  const user = userEvent.setup();
  writeText = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  render(<App initialUuid={generate('v4')} />);
  return user;
}

const displayed = () => screen.getByTestId('uuid-value').textContent ?? '';
const tab = (name: string) => screen.getByRole('tab', { name });
const versionNibble = () => displayed()[14];

describe('version tabs', () => {
  it('offers every kind, in the documented order', () => {
    setup();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'v4',
      'v1',
      'v7',
      'NIL',
      'MAX',
    ]);
  });

  it('starts on v4', () => {
    setup();
    expect(tab('v4')).toHaveAttribute('aria-selected', 'true');
  });

  it.each([
    ['v1', '1'],
    ['v7', '7'],
    ['v4', '4'],
  ])('selecting %s produces a version %s UUID', async (label, nibble) => {
    const user = setup();
    await user.click(tab(label));
    expect(versionNibble()).toBe(nibble);
    expect(tab(label)).toHaveAttribute('aria-selected', 'true');
  });

  it('selecting NIL shows the nil UUID', async () => {
    const user = setup();
    await user.click(tab('NIL'));
    expect(displayed()).toBe(NIL);
  });

  it('selecting MAX shows the max UUID', async () => {
    const user = setup();
    await user.click(tab('MAX'));
    expect(displayed()).toBe(MAX);
  });

  it('keeps exactly one tab in the tab order (roving tabindex)', async () => {
    const user = setup();
    await user.click(tab('v7'));

    const inOrder = screen.getAllByRole('tab').filter((t) => t.tabIndex === 0);
    expect(inOrder).toHaveLength(1);
    expect(inOrder[0]).toHaveTextContent('v7');
  });

  it('points the value panel at whichever tab is selected', async () => {
    const user = setup();
    await user.click(tab('NIL'));

    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', tab('NIL').id);
    expect(tab('NIL')).toHaveAttribute('aria-controls', panel.id);
  });
});

describe('tab keyboard navigation', () => {
  it('moves and selects with the arrow keys', async () => {
    const user = setup();
    tab('v4').focus();

    await user.keyboard('{ArrowRight}');
    expect(tab('v1')).toHaveAttribute('aria-selected', 'true');
    expect(versionNibble()).toBe('1');

    await user.keyboard('{ArrowRight}');
    expect(tab('v7')).toHaveAttribute('aria-selected', 'true');
  });

  it('wraps around at both ends', async () => {
    const user = setup();
    tab('v4').focus();

    await user.keyboard('{ArrowLeft}');
    expect(tab('MAX')).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowRight}');
    expect(tab('v4')).toHaveAttribute('aria-selected', 'true');
  });

  it('jumps to the ends with Home and End', async () => {
    const user = setup();
    tab('v4').focus();

    await user.keyboard('{End}');
    expect(tab('MAX')).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(tab('v4')).toHaveAttribute('aria-selected', 'true');
  });
});

describe('hotkeys', () => {
  it.each([
    ['1', 'v4'],
    ['2', 'v1'],
    ['3', 'v7'],
    ['4', 'NIL'],
    ['5', 'MAX'],
  ])('%s selects %s', async (key, label) => {
    const user = setup();
    await user.keyboard(key);
    expect(tab(label)).toHaveAttribute('aria-selected', 'true');
  });

  it('R generates a new value', async () => {
    const user = setup();
    const before = displayed();
    await user.keyboard('r');
    expect(displayed()).not.toBe(before);
  });

  it('C copies the displayed value', async () => {
    const user = setup();
    await user.keyboard('c');
    expect(writeText).toHaveBeenCalledExactlyOnceWith(displayed());
  });

  it('Ctrl+C copies when nothing is selected', async () => {
    const user = setup();
    await user.keyboard('{Control>}c{/Control}');
    expect(writeText).toHaveBeenCalledExactlyOnceWith(displayed());
  });

  it('Escape closes the popup', async () => {
    const close = vi.spyOn(window, 'close').mockImplementation(() => {});
    const user = setup();
    await user.keyboard('{Escape}');
    expect(close).toHaveBeenCalledOnce();
    close.mockRestore();
  });

  it('Space refreshes when no control has focus', async () => {
    const user = setup();
    document.body.focus();
    const before = displayed();

    await user.keyboard(' ');

    expect(displayed()).not.toBe(before);
  });

  it('Space belongs to a focused control, not to refresh', async () => {
    const user = setup();
    const before = displayed();

    // Space on the Copy button must copy and leave the value alone. If the
    // global handler also claimed Space, the value would change underneath.
    screen.getByRole('button', { name: 'Copy' }).focus();
    await user.keyboard(' ');

    expect(writeText).toHaveBeenCalledExactlyOnceWith(before);
    expect(displayed()).toBe(before);
  });
});

describe('constants cannot be refreshed', () => {
  it.each([
    ['NIL', NIL],
    ['MAX', MAX],
  ])('%s marks Refresh as disabled and explains why', async (label) => {
    const user = setup();
    await user.click(tab(label));

    const refresh = screen.getByRole('button', { name: 'Refresh' });
    expect(refresh).toHaveAttribute('aria-disabled', 'true');
    expect(refresh).toHaveAttribute('title', expect.stringContaining('fixed constants'));
  });

  it.each([
    ['NIL', NIL],
    ['MAX', MAX],
  ])('clicking Refresh on %s leaves the value alone', async (label, expected) => {
    const user = setup();
    await user.click(tab(label));

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(displayed()).toBe(expected);
  });

  it('R on a constant is a no-op', async () => {
    const user = setup();
    await user.click(tab('NIL'));

    await user.keyboard('r');

    expect(displayed()).toBe(NIL);
  });

  it('leaves Refresh enabled for the generated kinds', async () => {
    const user = setup();
    for (const label of ['v4', 'v1', 'v7']) {
      await user.click(tab(label));
      expect(screen.getByRole('button', { name: 'Refresh' })).toHaveAttribute(
        'aria-disabled',
        'false',
      );
    }
  });
});

describe('switching kinds clears stale state', () => {
  it('drops the copy confirmation, which referred to the old value', async () => {
    const user = setup();

    await user.click(screen.getByRole('button', { name: /^Copy UUID/ }));
    expect(await screen.findByText('✓ Copied')).toBeInTheDocument();

    await user.click(tab('v7'));

    await waitFor(() => {
      expect(screen.getByText('click to copy')).toBeInTheDocument();
    });
  });
});
