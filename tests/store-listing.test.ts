import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The store listing makes specific claims about what the extension does and what
 * it is allowed to do. Those claims are reviewed by a human at Google once and
 * then live for the life of the listing, while the code keeps moving.
 *
 * These tests tie the two together where that is mechanically possible, so a
 * change that would make the listing untrue fails here rather than in review —
 * or worse, not at all.
 */

const ROOT = process.cwd();
const listing = readFileSync(resolve(ROOT, 'docs/STORE-LISTING.md'), 'utf8');
const wxtConfig = readFileSync(resolve(ROOT, 'wxt.config.ts'), 'utf8');

describe('the short description fits', () => {
  it('is within the 132-character limit', () => {
    const match = listing.match(/```\n(Generate and copy UUID[^\n]*)\n```/);
    expect(
      match,
      'short description block not found in docs/STORE-LISTING.md',
    ).toBeTruthy();

    const text = match![1]!;
    // The Chrome Web Store truncates silently rather than rejecting, so going
    // over shows up as a sentence that stops mid-word on the listing page.
    expect(text.length).toBeLessThanOrEqual(132);
    expect(text.length).toBeGreaterThan(80);
  });
});

describe('the listing agrees with the manifest', () => {
  it('claims exactly the permissions the extension requests', () => {
    const declared = wxtConfig.match(/permissions:\s*\[([^\]]*)\]/);
    expect(declared, 'permissions not found in wxt.config.ts').toBeTruthy();

    const permissions = declared![1]!
      .split(',')
      .map((p) => p.trim().replace(/['"]/g, ''))
      .filter(Boolean);

    expect(permissions).toEqual(['storage']);
    // Patterns rather than exact strings: Prettier pads these markdown tables to
    // align them, so column widths shift whenever a neighbouring row changes.
    expect(listing).toMatch(/\|\s*`storage` justification\s*\|/);
    expect(listing).toMatch(/\|\s*Other permissions\s*\|\s*None requested\./);
  });

  it('still promises no data collection and no remote code', () => {
    expect(listing).toMatch(/\|\s*Remote code\s*\|\s*No\./);
    expect(listing).toMatch(/\|\s*Data collection\s*\|\s*None\./);
  });
});

describe('the privacy claims match what is actually stored', () => {
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];

  const prefs = readFileSync(resolve(ROOT, 'src/lib/prefs.ts'), 'utf8');
  const security = readFileSync(resolve(ROOT, 'SECURITY.md'), 'utf8');
  const privacy = readFileSync(resolve(ROOT, 'site/privacy.html'), 'utf8');

  /** Every `storage.defineItem('local:…')` is one thing this extension keeps. */
  const storedKeys = [...prefs.matchAll(/defineItem<[^>]*>\(\s*'local:([a-z]+)'/g)].map(
    (m) => m[1]!,
  );

  it('stores only the keys the documents describe', () => {
    expect(storedKeys.sort()).toEqual(['count', 'format', 'kind', 'theme']);
  });

  it.each([
    ['SECURITY.md', () => security],
    ['site/privacy.html', () => privacy],
    ['docs/STORE-LISTING.md', () => listing],
  ])('%s states the right number of stored values', (_name, read) => {
    // This has already gone stale once: the theme preference was added and three
    // documents kept saying "three values". A store listing that understates what
    // an extension stores is the kind of inaccuracy that matters.
    const word = WORDS[storedKeys.length]!;
    expect(read().toLowerCase()).toContain(word);
    for (const stale of WORDS.filter((_word, i) => i !== storedKeys.length && i > 1)) {
      expect(read().toLowerCase()).not.toMatch(
        new RegExp(`${stale} (values|interface preferences)`),
      );
    }
  });

  it('publishes a privacy policy that names every stored item', () => {
    expect(privacy).toContain('chrome.storage.local');
    expect(privacy).toMatch(/UUID version/i);
    expect(privacy).toMatch(/formatting/i);
    expect(privacy).toMatch(/bulk generation count/i);
    expect(privacy).toMatch(/theme choice/i);
    // The URL submitted to the store has to resolve to this file.
    expect(privacy).toContain('https://ease-my-work.github.io/uuidly/privacy.html');
    expect(listing).toContain('https://ease-my-work.github.io/uuidly/privacy.html');
  });
});
