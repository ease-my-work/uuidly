import { describe, expect, it } from 'vitest';
import { applyFormat, DEFAULT_FORMAT } from './format';
import { toCsv } from './csv';
import { BULK_MAX, generateMany } from './uuid';

/**
 * F-63: bulk-100 generate + render within 50 ms.
 *
 * Only the computation is measured here. jsdom render timing says nothing about
 * Chrome — it is slower and differently shaped — so claiming a render budget
 * from it would be a made-up number. The rendered half is a Checkpoint C
 * measurement in a real browser; this guards the half that is deterministic and
 * would be the first thing to regress if bulk generation grew a hot loop.
 */
const BUDGET_MS = 50;

const measure = (work: () => void): number => {
  const started = performance.now();
  work();
  return performance.now() - started;
};

describe('bulk performance (F-63, computation only)', () => {
  it('generates and formats 100 UUIDs well inside the budget', () => {
    const elapsed = measure(() => {
      const uuids = generateMany('v4', BULK_MAX);
      uuids.map((uuid) => applyFormat(uuid, DEFAULT_FORMAT));
    });

    expect(elapsed).toBeLessThan(BUDGET_MS);
  });

  it('builds the CSV for 100 rows inside the budget too', () => {
    const uuids = generateMany('v7', BULK_MAX);
    const at = '2026-08-29T12:34:56.000Z';

    const elapsed = measure(() => {
      toCsv(
        uuids.map((uuid, index) => ({
          index: index + 1,
          uuid,
          version: 'v7',
          generatedAt: at,
        })),
      );
    });

    expect(elapsed).toBeLessThan(BUDGET_MS);
  });

  it('stays linear — 100 is not disproportionately worse than 10', () => {
    // A cheap guard against an accidental O(n²): quadratic growth would show up
    // as roughly 100x rather than the ~10x the work actually implies.
    const ten = measure(() => generateMany('v4', 10));
    const hundred = measure(() => generateMany('v4', 100));

    // Deliberately loose. This is a shape check, not a benchmark, and timers on
    // a shared CI runner are noisy.
    expect(hundred).toBeLessThan(Math.max(ten * 40, BUDGET_MS));
  });
});
