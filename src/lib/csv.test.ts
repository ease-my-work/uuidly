import { describe, expect, it, vi } from 'vitest';
import {
  CSV_BOM,
  CSV_HEADER,
  csvByteLength,
  csvFilename,
  downloadCsv,
  escapeField,
  toCsv,
  type CsvRow,
} from './csv';

const AT = '2026-08-29T12:34:56.000Z';

const row = (index: number, uuid: string, version = 'v4'): CsvRow => ({
  index,
  uuid,
  version,
  generatedAt: AT,
});

describe('escapeField', () => {
  it('leaves ordinary fields alone', () => {
    expect(escapeField('3f2b9c1a-7d4e-4f8b-9a2c-1e5d8f0b6a7c')).toBe(
      '3f2b9c1a-7d4e-4f8b-9a2c-1e5d8f0b6a7c',
    );
    expect(escapeField('v7')).toBe('v7');
  });

  it('quotes and doubles embedded quotes', () => {
    // Reachable in practice: the "quotes" wrapper produces exactly this.
    expect(escapeField('"abc"')).toBe('"""abc"""');
  });

  it('quotes fields containing a comma', () => {
    expect(escapeField('a,b')).toBe('"a,b"');
  });

  it.each([
    ['line\nbreak', '"line\nbreak"'],
    ['carriage\rreturn', '"carriage\rreturn"'],
  ])('quotes fields containing %s', (input, expected) => {
    expect(escapeField(input)).toBe(expected);
  });
});

describe('toCsv', () => {
  it('starts with the documented header', () => {
    expect(toCsv([]).split('\r\n')[0]).toBe('index,uuid,version,generated_at');
    expect(CSV_HEADER).toEqual(['index', 'uuid', 'version', 'generated_at']);
  });

  it('uses CRLF line endings', () => {
    const csv = toCsv([row(1, 'aaa'), row(2, 'bbb')]);
    expect(csv).toContain('\r\n');
    // No bare LF anywhere.
    expect(csv.replaceAll('\r\n', '')).not.toContain('\n');
  });

  it('ends with a trailing newline', () => {
    expect(toCsv([row(1, 'aaa')]).endsWith('\r\n')).toBe(true);
  });

  it('writes one line per row plus the header', () => {
    const rows = Array.from({ length: 100 }, (_, i) => row(i + 1, `uuid-${i}`));
    const lines = toCsv(rows).trimEnd().split('\r\n');
    expect(lines).toHaveLength(101);
  });

  it('numbers rows from 1', () => {
    const csv = toCsv([row(1, 'aaa'), row(2, 'bbb')]);
    const lines = csv.trimEnd().split('\r\n');
    expect(lines[1]!.startsWith('1,')).toBe(true);
    expect(lines[2]!.startsWith('2,')).toBe(true);
  });

  it('survives a quoted UUID without corrupting the columns', () => {
    // The "quotes" format wrapper, exported. Four columns must survive.
    const csv = toCsv([row(1, '"3f2b9c1a-7d4e-4f8b-9a2c-1e5d8f0b6a7c"')]);
    const line = csv.trimEnd().split('\r\n')[1]!;
    expect(line).toBe(`1,"""3f2b9c1a-7d4e-4f8b-9a2c-1e5d8f0b6a7c""",v4,${AT}`);
  });

  it('handles an empty row set', () => {
    expect(toCsv([])).toBe('index,uuid,version,generated_at\r\n');
  });
});

describe('csvByteLength', () => {
  it('counts the BOM', () => {
    const csv = toCsv([row(1, 'aaa')]);
    expect(csvByteLength(csv)).toBe(new TextEncoder().encode(CSV_BOM + csv).length);
    expect(csvByteLength(csv)).toBeGreaterThan(csv.length);
  });
});

describe('csvFilename', () => {
  it('matches the documented pattern', () => {
    const name = csvFilename('v7', 100, new Date(AT));
    expect(name).toBe('uuidly-v7-100-20260829-123456.csv');
    expect(name).toMatch(/^uuidly-[a-z0-9]+-\d+-\d{8}-\d{6}\.csv$/);
  });

  it('zero-pads every component', () => {
    expect(csvFilename('v4', 1, new Date('2026-01-02T03:04:05.000Z'))).toBe(
      'uuidly-v4-1-20260102-030405.csv',
    );
  });

  it('stamps in UTC, so it agrees with the generated_at column', () => {
    // Same instant, whatever the local zone: the name must not drift from the data.
    expect(csvFilename('v4', 1, new Date('2026-06-15T23:59:59.000Z'))).toContain(
      '20260615-235959',
    );
  });
});

describe('downloadCsv', () => {
  it('creates a blob URL, clicks an anchor, and cleans up after itself', () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:fake');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    const ok = downloadCsv('uuidly-v4-1-20260829-123456.csv', toCsv([row(1, 'aaa')]));

    expect(ok).toBe(true);
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    // No leftover anchor in the document.
    expect(document.querySelector('a[download]')).toBeNull();

    // Revocation is deferred; doing it synchronously can cancel the download.
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');

    click.mockRestore();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('reports failure instead of throwing', () => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: () => {
        throw new Error('blocked');
      },
      revokeObjectURL: vi.fn(),
    });

    expect(downloadCsv('x.csv', 'a,b\r\n')).toBe(false);

    vi.unstubAllGlobals();
  });
});
