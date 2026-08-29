/**
 * The only module in this codebase that imports the `uuid` package.
 *
 * Everything else goes through `generate` / `generateMany`, so swapping the
 * generator — or adding a version — is a one-file change.
 *
 * Only named exports are imported so that Rollup tree-shakes v3, v5, v6, parse
 * and stringify out of the popup bundle.
 */

import { MAX, NIL, v1, v4, v7 } from 'uuid';

/** Every UUID flavour the popup can produce. Order matches the version tabs. */
export type UuidKind = 'v4' | 'v1' | 'v7' | 'nil' | 'max';

export const KINDS = [
  'v4',
  'v1',
  'v7',
  'nil',
  'max',
] as const satisfies readonly UuidKind[];

/** Tab labels — see docs/DESIGN.md §7.2. */
export const LABELS: Record<UuidKind, string> = {
  v4: 'v4',
  v1: 'v1',
  v7: 'v7',
  nil: 'NIL',
  max: 'MAX',
};

/**
 * NIL and MAX are fixed constants, so "refresh" is meaningless for them and the
 * control is disabled rather than silently doing nothing.
 */
export const IS_CONSTANT: Record<UuidKind, boolean> = {
  v4: false,
  v1: false,
  v7: false,
  nil: true,
  max: true,
};

export const BULK_MIN = 1;
export const BULK_MAX = 100;

/**
 * Coerce anything a number input can produce into a usable bulk count.
 *
 * Inputs arrive from a text field, so this has to survive `NaN`, negatives,
 * fractions and absurd values. Fractions truncate rather than round: a user
 * typing "5.7" asked for five whole UUIDs and a keystroke went astray.
 */
export function clampCount(count: number): number {
  if (!Number.isFinite(count)) return BULK_MIN;
  return Math.min(BULK_MAX, Math.max(BULK_MIN, Math.trunc(count)));
}

/** Generate one UUID of the given kind, unformatted and lowercase. */
export function generate(kind: UuidKind): string {
  switch (kind) {
    case 'v4':
      return v4();
    case 'v1':
      return v1();
    case 'v7':
      return v7();
    case 'nil':
      return NIL;
    case 'max':
      return MAX;
  }
}

/**
 * Generate `count` UUIDs, with `count` clamped to 1..100.
 *
 * For `nil` and `max` this returns `count` copies of the same constant. That is
 * the honest answer — there is exactly one nil UUID — and the UI says so rather
 * than pretending the list is varied.
 */
export function generateMany(kind: UuidKind, count: number): string[] {
  const n = clampCount(count);
  const out = new Array<string>(n);
  for (let i = 0; i < n; i++) out[i] = generate(kind);
  return out;
}
