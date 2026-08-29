import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import axe from 'axe-core';
import App from './App';
import { generate } from '@/lib/uuid';

/**
 * jsdom has no layout engine, so axe cannot measure contrast here. Colour pairs
 * are specified in docs/DESIGN.md §5 with their ratios and verified in a real
 * browser during the Checkpoint C pass; asserting them in jsdom would be
 * theatre. Everything axe *can* decide statically is enforced below.
 */
const AXE_OPTIONS: axe.RunOptions = {
  rules: { 'color-contrast': { enabled: false } },
};

async function expectNoViolations() {
  const results = await axe.run(document.body, AXE_OPTIONS);
  const summary = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes
        .map((node) => node.html)
        .join(', ')}`,
  );
  expect(summary).toEqual([]);
}

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

beforeEach(() => {
  fakeBrowser.reset();
});

describe('accessibility', () => {
  it('has no violations on open', async () => {
    setup();
    await expectNoViolations();
  });

  it('has no violations with the bulk panel expanded', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /Bulk generate/ }));
    await expectNoViolations();
  });

  it('has no violations with a bulk list rendered', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /Bulk generate/ }));
    await user.click(screen.getByRole('button', { name: 'Generate' }));
    await expectNoViolations();
  });

  it('has no violations on a constant, where Refresh is disabled', async () => {
    const user = setup();
    await user.click(screen.getByRole('tab', { name: 'NIL' }));
    await expectNoViolations();
  });

  it('has no violations after a copy, while the live region is populated', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /^Copy UUID/ }));
    await screen.findByText(/^Copied /);
    await expectNoViolations();
  });
});

describe('every control is reachable and named', () => {
  it('gives every button an accessible name', () => {
    setup();
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAccessibleName();
    }
  });

  it('names the icon-only links too', () => {
    setup();
    // An icon carries no accessible name of its own, so an unlabelled icon link
    // reads as the bare URL, or as nothing at all.
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAccessibleName();
    }
    expect(screen.getByRole('link', { name: 'uuidly on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/ease-my-work/uuidly',
    );
  });

  it('names every control once the bulk panel is open', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /Bulk generate/ }));
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAccessibleName();
    }
    expect(screen.getByRole('spinbutton')).toHaveAccessibleName();
    expect(screen.getByRole('slider')).toHaveAccessibleName();
  });

  it('exposes the copy confirmation through a live region', async () => {
    const user = setup();

    await user.click(screen.getByRole('button', { name: /^Copy UUID/ }));

    const live = document.querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();
    expect(live).toHaveTextContent(/^Copied /);
  });
});
