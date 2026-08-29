import { describe, expect, it } from 'vitest';
import {
  applyFormat,
  DEFAULT_FORMAT,
  nextWrapper,
  WRAPPER_LABEL,
  WRAPPER_NAME,
  WRAPPERS,
  type FormatOpts,
  type Wrapper,
} from './format';

const RAW = '3f2b9c1a-7d4e-4f8b-9a2c-1e5d8f0b6a7c';
const BARE = '3f2b9c1a7d4e4f8b9a2c1e5d8f0b6a7c';

const opts = (o: Partial<FormatOpts> = {}): FormatOpts => ({ ...DEFAULT_FORMAT, ...o });

describe('applyFormat — all 16 combinations', () => {
  it.each<[boolean, boolean, Wrapper, string]>([
    // hyphens, lowercase
    [false, true, 'none', RAW],
    [false, true, 'braces', `{${RAW}}`],
    [false, true, 'quotes', `"${RAW}"`],
    [false, true, 'urn', `urn:uuid:${RAW}`],
    // hyphens, uppercase
    [true, true, 'none', RAW.toUpperCase()],
    [true, true, 'braces', `{${RAW.toUpperCase()}}`],
    [true, true, 'quotes', `"${RAW.toUpperCase()}"`],
    [true, true, 'urn', `urn:uuid:${RAW.toUpperCase()}`],
    // bare, lowercase
    [false, false, 'none', BARE],
    [false, false, 'braces', `{${BARE}}`],
    [false, false, 'quotes', `"${BARE}"`],
    [false, false, 'urn', `urn:uuid:${BARE}`],
    // bare, uppercase
    [true, false, 'none', BARE.toUpperCase()],
    [true, false, 'braces', `{${BARE.toUpperCase()}}`],
    [true, false, 'quotes', `"${BARE.toUpperCase()}"`],
    [true, false, 'urn', `urn:uuid:${BARE.toUpperCase()}`],
  ])('uppercase=%s hyphens=%s wrapper=%s', (uppercase, hyphens, wrapper, expected) => {
    expect(applyFormat(RAW, opts({ uppercase, hyphens, wrapper }))).toBe(expected);
  });
});

describe('rules that must not drift', () => {
  it('defaults to the canonical form, unchanged', () => {
    expect(applyFormat(RAW, DEFAULT_FORMAT)).toBe(RAW);
  });

  it('keeps the urn prefix lowercase even when the UUID is uppercased', () => {
    // RFC 9562 §4 defines the prefix in lowercase. Uppercasing it would produce
    // a string that looks right and is not.
    const out = applyFormat(RAW, opts({ uppercase: true, wrapper: 'urn' }));
    expect(out.startsWith('urn:uuid:')).toBe(true);
    expect(out).not.toContain('URN:UUID:');
  });

  it('never uppercases the wrapper delimiters', () => {
    expect(applyFormat(RAW, opts({ uppercase: true, wrapper: 'quotes' }))).toBe(
      `"${RAW.toUpperCase()}"`,
    );
  });

  it('removes every hyphen, not just the first', () => {
    expect(applyFormat(RAW, opts({ hyphens: false }))).not.toContain('-');
    expect(applyFormat(RAW, opts({ hyphens: false }))).toHaveLength(32);
  });

  it('is pure — the same input always gives the same output', () => {
    const o = opts({ uppercase: true, hyphens: false, wrapper: 'braces' });
    expect(applyFormat(RAW, o)).toBe(applyFormat(RAW, o));
  });

  it('does not mutate the options it is given', () => {
    const o = opts({ uppercase: true });
    applyFormat(RAW, o);
    expect(o).toEqual({ uppercase: true, hyphens: true, wrapper: 'none' });
  });

  it('handles the nil UUID like any other', () => {
    const nil = '00000000-0000-0000-0000-000000000000';
    expect(applyFormat(nil, opts({ hyphens: false }))).toBe('0'.repeat(32));
  });
});

describe('wrapper cycle', () => {
  it('cycles through every wrapper and returns to the start', () => {
    let wrapper: Wrapper = 'none';
    const seen: Wrapper[] = [wrapper];
    for (let i = 0; i < WRAPPERS.length - 1; i++) {
      wrapper = nextWrapper(wrapper);
      seen.push(wrapper);
    }
    expect(seen).toEqual(WRAPPERS);
    expect(nextWrapper(wrapper)).toBe('none');
  });

  it('gives every wrapper a chip label and a spoken name', () => {
    for (const wrapper of WRAPPERS) {
      expect(WRAPPER_LABEL[wrapper]).toBeTruthy();
      expect(WRAPPER_NAME[wrapper]).toBeTruthy();
    }
  });
});
