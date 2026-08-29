import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import App from './App';
import { themePref } from '@/lib/prefs';
import { generate } from '@/lib/uuid';

function setup() {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn(() => Promise.resolve()) },
    configurable: true,
    writable: true,
  });
  render(<App initialUuid={generate('v4')} />);
  return user;
}

const toggle = () => screen.getByRole('button', { name: /theme/i });
const dataTheme = () => document.documentElement.getAttribute('data-theme');

beforeEach(() => {
  fakeBrowser.reset();
  document.documentElement.removeAttribute('data-theme');
});

describe('theme', () => {
  it('follows the system by default, setting no attribute at all', () => {
    setup();
    // No `data-theme` means prefers-color-scheme in the stylesheet stays in
    // charge, so the popup tracks the OS live rather than snapshotting it.
    expect(dataTheme()).toBeNull();
    expect(toggle()).toHaveAccessibleName(/System theme/);
  });

  it('cycles system → light → dark → system', async () => {
    const user = setup();

    await user.click(toggle());
    expect(dataTheme()).toBe('light');
    expect(toggle()).toHaveAccessibleName(/Light theme/);

    await user.click(toggle());
    expect(dataTheme()).toBe('dark');
    expect(toggle()).toHaveAccessibleName(/Dark theme/);

    await user.click(toggle());
    expect(dataTheme()).toBeNull();
    expect(toggle()).toHaveAccessibleName(/System theme/);
  });

  it('remembers the choice', async () => {
    const user = setup();
    await user.click(toggle());

    await waitFor(async () => {
      expect(await themePref.getValue()).toBe('light');
    });
  });

  it('restores a stored choice on the next open', async () => {
    await themePref.setValue('dark');
    setup();

    await waitFor(() => {
      expect(dataTheme()).toBe('dark');
    });
  });

  it('says which state is active, since one glyph cannot', async () => {
    const user = setup();
    // The control cycles through three states, so the name has to carry the
    // current one — a sun or moon alone is ambiguous to a screen reader.
    expect(toggle()).toHaveAttribute('title', 'System theme');
    await user.click(toggle());
    expect(toggle()).toHaveAttribute('title', 'Light theme');
  });
});
