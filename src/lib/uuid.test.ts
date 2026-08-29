import { describe, expect, it } from 'vitest';
import {
  BULK_MAX,
  BULK_MIN,
  clampCount,
  generate,
  generateMany,
  IS_CONSTANT,
  KINDS,
  LABELS,
  type UuidKind,
} from './uuid';

/**
 * Assertions are made against the raw string per RFC 9562 rather than against
 * the `uuid` package's own `version()` helper. Checking a library with itself
 * proves only that it is self-consistent.
 *
 * Canonical form: xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
 *                                 ^ version      ^ variant
 */
const CANONICAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The version nibble: first character of the third group (index 14). */
const versionNibble = (uuid: string) => uuid[14];

/** The variant nibble: first character of the fourth group (index 19). */
const variantNibble = (uuid: string) => uuid[19];

const RANDOM_KINDS = ['v4', 'v1', 'v7'] as const;

describe('shape', () => {
  it.each(KINDS)('%s is canonical, lowercase and 36 characters', (kind) => {
    const uuid = generate(kind);
    expect(uuid).toHaveLength(36);
    expect(uuid).toMatch(CANONICAL);
    expect(uuid).toBe(uuid.toLowerCase());
  });

  it.each(RANDOM_KINDS)('%s sets the RFC 9562 variant bits to 10xx', (kind) => {
    // 8, 9, a and b are exactly the nibbles whose top two bits are 10.
    for (let i = 0; i < 100; i++) {
      expect(['8', '9', 'a', 'b']).toContain(variantNibble(generate(kind)));
    }
  });
});

describe('versions', () => {
  it('v4 reports version 4', () => {
    for (let i = 0; i < 100; i++) expect(versionNibble(generate('v4'))).toBe('4');
  });

  it('v1 reports version 1', () => {
    for (let i = 0; i < 100; i++) expect(versionNibble(generate('v1'))).toBe('1');
  });

  it('v7 reports version 7', () => {
    for (let i = 0; i < 100; i++) expect(versionNibble(generate('v7'))).toBe('7');
  });
});

describe('constants', () => {
  it('nil is all zeros', () => {
    expect(generate('nil')).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('max is all ones', () => {
    expect(generate('max')).toBe('ffffffff-ffff-ffff-ffff-ffffffffffff');
  });

  it('constants never change between calls', () => {
    expect(generate('nil')).toBe(generate('nil'));
    expect(generate('max')).toBe(generate('max'));
  });

  it('IS_CONSTANT marks exactly nil and max', () => {
    expect(IS_CONSTANT).toEqual({
      v4: false,
      v1: false,
      v7: false,
      nil: true,
      max: true,
    });
  });
});

describe('uniqueness', () => {
  it('produces 100k distinct v4 UUIDs', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100_000; i++) seen.add(generate('v4'));
    expect(seen.size).toBe(100_000);
  });

  it('produces 10k distinct v7 UUIDs', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10_000; i++) seen.add(generate('v7'));
    expect(seen.size).toBe(10_000);
  });
});

describe('v7 ordering', () => {
  it('is monotonically non-decreasing across 10k sequential calls', () => {
    // This is the whole point of v7: it sorts as a string in creation order,
    // which makes it a usable database key. Many generated inside one
    // millisecond, so this also exercises the intra-millisecond counter.
    const generated = Array.from({ length: 10_000 }, () => generate('v7'));
    const sorted = [...generated].sort();
    expect(generated).toEqual(sorted);
  });
});

describe('v1 privacy', () => {
  it('uses a random node id rather than a MAC address', () => {
    // RFC 9562 §5.1: a randomly generated node id must set the multicast bit —
    // the least significant bit of the node's first octet. A real network card
    // never has it set, so this is what proves no hardware address leaked.
    // See SECURITY.md.
    for (let i = 0; i < 50; i++) {
      const node = generate('v1').split('-')[4] as string;
      const firstOctet = Number.parseInt(node.slice(0, 2), 16);
      expect(firstOctet & 0x01).toBe(1);
    }
  });
});

describe('clampCount', () => {
  it.each([
    [0, BULK_MIN],
    [-5, BULK_MIN],
    [1, 1],
    [50, 50],
    [100, BULK_MAX],
    [101, BULK_MAX],
    [10_000, BULK_MAX],
    [5.7, 5],
    [1.9, 1],
    [Number.NaN, BULK_MIN],
    [Number.POSITIVE_INFINITY, BULK_MIN],
    [Number.NEGATIVE_INFINITY, BULK_MIN],
  ])('clampCount(%p) is %p', (input, expected) => {
    expect(clampCount(input)).toBe(expected);
  });
});

describe('generateMany', () => {
  it('returns exactly the requested count', () => {
    expect(generateMany('v4', 1)).toHaveLength(1);
    expect(generateMany('v4', 37)).toHaveLength(37);
    expect(generateMany('v4', 100)).toHaveLength(100);
  });

  it('clamps out-of-range counts instead of throwing', () => {
    expect(generateMany('v4', 0)).toHaveLength(BULK_MIN);
    expect(generateMany('v4', -5)).toHaveLength(BULK_MIN);
    expect(generateMany('v4', 101)).toHaveLength(BULK_MAX);
    expect(generateMany('v4', Number.NaN)).toHaveLength(BULK_MIN);
  });

  it('produces distinct values for random kinds', () => {
    for (const kind of RANDOM_KINDS) {
      const list = generateMany(kind, 100);
      expect(new Set(list).size).toBe(100);
    }
  });

  it('repeats the constant for nil and max', () => {
    // Documented behaviour, not a bug: there is only one nil UUID.
    const nils = generateMany('nil', 10);
    expect(nils).toHaveLength(10);
    expect(new Set(nils).size).toBe(1);

    const maxes = generateMany('max', 10);
    expect(maxes).toHaveLength(10);
    expect(new Set(maxes).size).toBe(1);
  });

  it('every element of a bulk run is canonical', () => {
    for (const uuid of generateMany('v7', 100)) {
      expect(uuid).toMatch(CANONICAL);
    }
  });
});

describe('metadata', () => {
  it('KINDS lists every kind once, in tab order', () => {
    expect(KINDS).toEqual(['v4', 'v1', 'v7', 'nil', 'max']);
    expect(new Set(KINDS).size).toBe(KINDS.length);
  });

  it('every kind has a label and a constant flag', () => {
    for (const kind of KINDS) {
      expect(LABELS[kind satisfies UuidKind]).toBeTruthy();
      expect(typeof IS_CONSTANT[kind]).toBe('boolean');
    }
  });
});
