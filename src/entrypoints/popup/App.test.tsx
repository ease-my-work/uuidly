import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import App from './App';
import { generate } from '@/lib/uuid';

beforeEach(() => {
  fakeBrowser.reset();
});

const CANONICAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

let writeText: ReturnType<typeof vi.fn>;

/**
 * jsdom has no clipboard, so stand one up and watch what reaches it.
 *
 * Order matters: `userEvent.setup()` installs its own clipboard stub, so ours
 * has to go in afterwards — otherwise every assertion here would be testing
 * user-event's stub rather than the extension.
 */
function setup(impl: () => Promise<void> = () => Promise.resolve()) {
  const user = userEvent.setup();

  writeText = vi.fn(impl);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  });

  return user;
}

const renderPopup = () => {
  const initialUuid = generate('v4');
  return { initialUuid, ...render(<App initialUuid={initialUuid} />) };
};

const displayed = () => screen.getByTestId('uuid-value').textContent ?? '';

describe('first paint', () => {
  it('shows a UUID with no interaction at all', () => {
    renderPopup();
    expect(displayed()).toMatch(CANONICAL);
  });

  it('shows a v4 UUID', () => {
    renderPopup();
    // Version nibble at index 14, variant nibble at index 19.
    expect(displayed()[14]).toBe('4');
    expect(['8', '9', 'a', 'b']).toContain(displayed()[19]);
  });

  it('renders exactly the UUID it was seeded with', () => {
    const { initialUuid } = renderPopup();
    expect(displayed()).toBe(initialUuid);
  });

  it('invites the user to copy', () => {
    renderPopup();
    expect(screen.getByText('click to copy')).toBeInTheDocument();
  });
});

describe('copying', () => {
  it('copies the exact string that is on screen when the display is clicked', async () => {
    const user = setup();
    renderPopup();
    const onScreen = displayed();

    await user.click(screen.getByRole('button', { name: /^Copy UUID/ }));

    // Byte-for-byte. "Copied something subtly different from what I saw" is the
    // worst bug this extension could ship.
    expect(writeText).toHaveBeenCalledExactlyOnceWith(onScreen);
  });

  it('copies from the Copy button too', async () => {
    const user = setup();
    renderPopup();
    const onScreen = displayed();

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledExactlyOnceWith(onScreen);
  });

  it('copies when the display is activated with the keyboard', async () => {
    const user = setup();
    renderPopup();
    const onScreen = displayed();

    screen.getByRole('button', { name: /^Copy UUID/ }).focus();
    await user.keyboard('{Enter}');

    expect(writeText).toHaveBeenCalledExactlyOnceWith(onScreen);
  });

  it('confirms the copy visually and to screen readers', async () => {
    const user = setup();
    renderPopup();
    const onScreen = displayed();

    await user.click(screen.getByRole('button', { name: /^Copy UUID/ }));

    expect(await screen.findByText('✓ Copied')).toBeInTheDocument();
    expect(screen.getByText(`Copied ${onScreen}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('reports failure without losing the value', async () => {
    // Both paths fail: the clipboard API rejects, and jsdom has no
    // `document.execCommand` for the fallback to reach.
    const user = setup(() => Promise.reject(new Error('denied')));
    renderPopup();
    const onScreen = displayed();

    await user.click(screen.getByRole('button', { name: /^Copy UUID/ }));

    // The visible hint, not the aria-live region — both say "Copy failed".
    expect(await screen.findByText(/^Copy failed —/)).toBeInTheDocument();
    expect(displayed()).toBe(onScreen);
  });
});

describe('refreshing', () => {
  it('replaces the value with a different valid v4', async () => {
    const user = setup();
    renderPopup();
    const before = displayed();

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    const after = displayed();
    expect(after).not.toBe(before);
    expect(after).toMatch(CANONICAL);
    expect(after[14]).toBe('4');
  });

  it('clears the copy confirmation, which referred to the old value', async () => {
    const user = setup();
    renderPopup();

    await user.click(screen.getByRole('button', { name: /^Copy UUID/ }));
    expect(await screen.findByText('✓ Copied')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(screen.getByText('click to copy')).toBeInTheDocument();
    });
  });

  it('produces distinct values across repeated refreshes', async () => {
    const user = setup();
    renderPopup();
    const seen = new Set([displayed()]);

    const refresh = screen.getByRole('button', { name: 'Refresh' });
    for (let i = 0; i < 20; i++) {
      await user.click(refresh);
      seen.add(displayed());
    }

    expect(seen.size).toBe(21);
  });
});

describe('accessibility', () => {
  it('labels the display with the value it will copy', () => {
    const { initialUuid } = renderPopup();
    expect(
      screen.getByRole('button', { name: `Copy UUID ${initialUuid}` }),
    ).toBeInTheDocument();
  });

  it('puts the display in the tab order', () => {
    renderPopup();
    expect(screen.getByRole('button', { name: /^Copy UUID/ })).toHaveAttribute(
      'tabindex',
      '0',
    );
  });
});
