import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import App from './App';
import { countPref } from '@/lib/prefs';
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
  render(<App initialUuid={generate('v4')} />);
  return user;
}

const openBulk = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /Bulk generate/ }));
};

const countField = () =>
  screen.getByLabelText('Count', { selector: 'input#uuidly-count' });
const generateButton = () => screen.getByRole('button', { name: 'Generate' });
const listRows = () => screen.queryAllByRole('listitem');

const setCount = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  await user.clear(countField());
  if (value !== '') await user.type(countField(), value);
  await user.tab();
};

beforeEach(() => {
  fakeBrowser.reset();
});

describe('the panel stays out of the way until asked', () => {
  it('is collapsed on open', () => {
    setup();
    expect(screen.getByRole('button', { name: /Bulk generate/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('button', { name: 'Generate' })).not.toBeInTheDocument();
  });

  it('expands on click and collapses again', async () => {
    const user = setup();
    await openBulk(user);
    expect(generateButton()).toBeInTheDocument();

    await openBulk(user);
    expect(screen.queryByRole('button', { name: 'Generate' })).not.toBeInTheDocument();
  });

  it('toggles with the B hotkey', async () => {
    const user = setup();
    await user.keyboard('b');
    expect(generateButton()).toBeInTheDocument();
  });

  it('explains what Generate will do before anything exists', async () => {
    const user = setup();
    await openBulk(user);
    expect(screen.getByText(/Press Generate to create 10 UUIDs/)).toBeInTheDocument();
  });
});

describe('generating', () => {
  it('produces exactly the requested number of rows', async () => {
    const user = setup();
    await openBulk(user);
    await setCount(user, '25');
    await user.click(generateButton());

    expect(listRows()).toHaveLength(25);
  });

  it('produces 100 distinct UUIDs at the maximum', async () => {
    const user = setup();
    await openBulk(user);
    await setCount(user, '100');
    await user.click(generateButton());

    const rows = listRows().map((li) => li.textContent ?? '');
    expect(rows).toHaveLength(100);
    // Row text is "<index><uuid>", so uniqueness of the whole line is enough.
    expect(new Set(rows).size).toBe(100);
  });

  it('generates the selected version, not always v4', async () => {
    const user = setup();
    await user.click(screen.getByRole('tab', { name: 'v7' }));
    await openBulk(user);
    await user.click(generateButton());

    for (const row of listRows()) {
      const value = within(row).getByTitle(/^[0-9a-f-]+$/).textContent ?? '';
      expect(value[14]).toBe('7');
    }
  });

  it('applies the active format to every row', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /^Uppercase/ }));
    await openBulk(user);
    await setCount(user, '5');
    await user.click(generateButton());

    for (const row of listRows()) {
      expect(row.textContent).toMatch(/[0-9A-F]{8}-/);
    }
  });

  it('reformats existing rows without regenerating them', async () => {
    const user = setup();
    await openBulk(user);
    await setCount(user, '3');
    await user.click(generateButton());
    const before = listRows().map((li) => li.textContent ?? '');

    await user.click(screen.getByRole('button', { name: /^Uppercase/ }));

    const after = listRows().map((li) => li.textContent ?? '');
    expect(after).toEqual(before.map((row) => row.toUpperCase()));
  });
});

describe('count is clamped, never rejected', () => {
  it.each([
    ['0', 1],
    ['-5', 1],
    ['101', 100],
    ['9999', 100],
    ['abc', 1],
    ['', 1],
  ])('%s becomes %i', async (input, expected) => {
    const user = setup();
    await openBulk(user);
    await setCount(user, input);

    expect(countField()).toHaveValue(expected);
  });

  it('truncates a fractional entry rather than rounding it up', async () => {
    const user = setup();
    await openBulk(user);
    await setCount(user, '5.7');
    // "5.7" asked for five whole UUIDs and a stray keystroke.
    expect(countField()).toHaveValue(5);
  });

  it('accepts valid input untouched', async () => {
    const user = setup();
    await openBulk(user);
    await setCount(user, '42');
    expect(countField()).toHaveValue(42);
  });

  it('commits on Enter as well as on blur', async () => {
    const user = setup();
    await openBulk(user);
    await user.clear(countField());
    await user.type(countField(), '250{Enter}');

    expect(countField()).toHaveValue(100);
  });

  it('remembers the count for next time', async () => {
    const user = setup();
    await openBulk(user);
    await setCount(user, '30');

    await waitFor(async () => {
      expect(await countPref.getValue()).toBe(30);
    });
  });
});

describe('copying in bulk', () => {
  it('copies one row from its own button', async () => {
    const user = setup();
    await openBulk(user);
    await setCount(user, '3');
    await user.click(generateButton());

    const firstRow = listRows()[0]!;
    const value = within(firstRow).getByTitle(CANONICAL).textContent ?? '';
    await user.click(within(firstRow).getByRole('button', { name: /^Copy / }));

    expect(writeText).toHaveBeenCalledExactlyOnceWith(value);
  });

  it('copies all rows as newline-separated text', async () => {
    const user = setup();
    await openBulk(user);
    await setCount(user, '7');
    await user.click(generateButton());

    await user.click(screen.getByRole('button', { name: 'Copy all' }));

    const copied = writeText.mock.calls[0]![0] as string;
    expect(copied.split('\n')).toHaveLength(7);
    expect(copied.split('\n').every((line) => CANONICAL.test(line))).toBe(true);
  });

  it('copies all rows as a JSON array', async () => {
    const user = setup();
    await openBulk(user);
    await setCount(user, '4');
    await user.click(generateButton());

    await user.click(screen.getByRole('button', { name: 'Copy JSON' }));

    const parsed = JSON.parse(writeText.mock.calls[0]![0] as string) as string[];
    expect(parsed).toHaveLength(4);
    expect(parsed.every((uuid) => CANONICAL.test(uuid))).toBe(true);
  });

  it('disables the bulk actions until something has been generated', async () => {
    const user = setup();
    await openBulk(user);

    expect(screen.getByRole('button', { name: 'Copy all' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /CSV/ })).toBeDisabled();
  });
});

describe('CSV download', () => {
  it('downloads a file named to the documented pattern', async () => {
    const createObjectURL = vi.fn(() => 'blob:fake');
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadName = this.download;
      });
    let downloadName = '';

    const user = setup();
    await openBulk(user);
    await setCount(user, '12');
    await user.click(generateButton());
    await user.click(screen.getByRole('button', { name: /CSV/ }));

    expect(downloadName).toMatch(/^uuidly-v4-12-\d{8}-\d{6}\.csv$/);
    expect(createObjectURL).toHaveBeenCalledOnce();

    click.mockRestore();
    vi.unstubAllGlobals();
  });

  it('offers a way out when the download is blocked', async () => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: () => {
        throw new Error('blocked');
      },
      revokeObjectURL: vi.fn(),
    });

    const user = setup();
    await openBulk(user);
    await user.click(generateButton());
    await user.click(screen.getByRole('button', { name: /CSV/ }));

    expect(screen.getByText(/Download blocked/)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('reports the row count, version and file size', async () => {
    const user = setup();
    await user.click(screen.getByRole('tab', { name: 'v7' }));
    await openBulk(user);
    await setCount(user, '10');
    await user.click(generateButton());

    expect(screen.getByText(/10 UUIDs · v7 · [\d.]+ (B|KB)/)).toBeInTheDocument();
  });
});

describe('constants in bulk', () => {
  it('repeats the constant, and says how many', async () => {
    const user = setup();
    await user.click(screen.getByRole('tab', { name: 'NIL' }));
    await openBulk(user);
    await setCount(user, '5');
    await user.click(generateButton());

    const rows = listRows();
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      expect(row).toHaveTextContent('00000000-0000-0000-0000-000000000000');
    }
  });
});
