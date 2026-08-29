import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

/**
 * The landing page demo is a standalone reimplementation — it has no build step
 * and cannot import the extension's `lib/uuid`. That means the risky part, the
 * v1 and v7 bit layout, is hand-written a second time and is not covered by any
 * of the extension's tests.
 *
 * It is also the first thing a visitor interacts with, so a wrong version nibble
 * there undermines the product on the page selling it. These tests run the real
 * `site/demo.js` against the real markup from `site/index.html`.
 */

// Vitest runs with the project root as cwd, which avoids depending on whether
// __dirname exists under the module format this file ends up in.
const ROOT = process.cwd();
const html = readFileSync(resolve(ROOT, 'site/index.html'), 'utf8');
const script = readFileSync(resolve(ROOT, 'site/demo.js'), 'utf8');

const CANONICAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The demo block, lifted verbatim so the test cannot drift from the page. */
const demoMarkup = (() => {
  const start = html.indexOf('<div class="demo"');
  const end = html.indexOf('</section>', start);
  if (start === -1 || end === -1)
    throw new Error('demo block not found in site/index.html');
  return html.slice(start, end);
})();

function boot() {
  document.body.innerHTML = demoMarkup;
  // The script is an IIFE that reads the DOM on execution.
  new Function(script)();
}

const value = () => document.getElementById('value')!.textContent ?? '';
const tab = (kind: string) =>
  document.querySelector<HTMLButtonElement>(`.tabs button[data-kind="${kind}"]`)!;
const chip = (id: string) => document.getElementById(id) as HTMLButtonElement;

beforeEach(() => {
  boot();
});

describe('the demo generates real UUIDs', () => {
  it('starts on v4 with a canonical value', () => {
    expect(value()).toMatch(CANONICAL);
    expect(value()[14]).toBe('4');
    expect(['8', '9', 'a', 'b']).toContain(value()[19]);
  });

  it.each([
    ['v1', '1'],
    ['v7', '7'],
    ['v4', '4'],
  ])('%s produces a version %s UUID', (kind, nibble) => {
    tab(kind).click();
    expect(value()).toMatch(CANONICAL);
    expect(value()[14]).toBe(nibble);
    expect(['8', '9', 'a', 'b']).toContain(value()[19]);
  });

  it('shows the nil and max constants exactly', () => {
    tab('nil').click();
    expect(value()).toBe('00000000-0000-0000-0000-000000000000');
    tab('max').click();
    expect(value()).toBe('ffffffff-ffff-ffff-ffff-ffffffffffff');
  });

  it('sets the multicast bit on v1, so no MAC address is implied', () => {
    // The page claims this in the "What it does not do" section. If the demo
    // produced a v1 without it, the page would be contradicting itself.
    tab('v1').click();
    for (let i = 0; i < 30; i++) {
      const node = value().split('-')[4]!;
      expect(Number.parseInt(node.slice(0, 2), 16) & 0x01).toBe(1);
      document.getElementById('refresh')!.click();
    }
  });

  it('keeps v7 non-decreasing across refreshes', () => {
    tab('v7').click();
    const seen: string[] = [];
    const refresh = document.getElementById('refresh')!;
    for (let i = 0; i < 300; i++) {
      seen.push(value());
      refresh.click();
    }
    expect(seen).toEqual([...seen].sort());
  });

  it('produces distinct values on refresh', () => {
    const refresh = document.getElementById('refresh')!;
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seen.add(value());
      refresh.click();
    }
    expect(seen.size).toBe(50);
  });

  it('does not refresh the constants', () => {
    tab('nil').click();
    document.getElementById('refresh')!.click();
    expect(value()).toBe('00000000-0000-0000-0000-000000000000');
    expect(document.getElementById('refresh')).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('the page loads nothing from anywhere else', () => {
  const css = readFileSync(resolve(ROOT, 'site/styles.css'), 'utf8');

  it('has no remote scripts, stylesheets or images', () => {
    // The page's pitch is that the extension makes no network requests. A
    // tracking pixel or a CDN font on the page selling that would be absurd.
    expect(html).not.toMatch(/<script[^>]+src\s*=\s*["']https?:/i);
    expect(html).not.toMatch(
      /<link[^>]+rel=["']stylesheet["'][^>]+href\s*=\s*["']https?:/i,
    );
    expect(html).not.toMatch(/<img[^>]+src\s*=\s*["']https?:/i);
  });

  it('loads no remote fonts or assets from CSS', () => {
    expect(css).not.toMatch(/@import/i);
    expect(css).not.toMatch(/url\(\s*["']?https?:/i);
  });

  it('carries the SEO tags a shared link needs', () => {
    for (const tag of [
      'rel="canonical"',
      'property="og:title"',
      'property="og:description"',
      'property="og:image"',
      'name="twitter:card"',
      'application/ld+json',
    ]) {
      expect(html).toContain(tag);
    }
  });
});

describe('formatting matches the extension', () => {
  it('uppercases without regenerating', () => {
    const before = value();
    chip('case').click();
    expect(value()).toBe(before.toUpperCase());
  });

  it('removes hyphens without regenerating', () => {
    const before = value();
    chip('hyphens').click();
    expect(value()).toBe(before.replaceAll('-', ''));
  });

  it('cycles the wrapper through braces, quotes and urn', () => {
    const raw = value();
    chip('wrapper').click();
    expect(value()).toBe(`{${raw}}`);
    chip('wrapper').click();
    expect(value()).toBe(`"${raw}"`);
    chip('wrapper').click();
    expect(value()).toBe(`urn:uuid:${raw}`);
    chip('wrapper').click();
    expect(value()).toBe(raw);
  });

  it('keeps the urn prefix lowercase when the UUID is uppercased', () => {
    chip('case').click();
    chip('wrapper').click();
    chip('wrapper').click();
    chip('wrapper').click();
    expect(value().startsWith('urn:uuid:')).toBe(true);
  });
});
