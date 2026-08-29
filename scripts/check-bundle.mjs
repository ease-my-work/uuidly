/**
 * Enforces F-50 and F-52 against the built extension.
 *
 * This is a script rather than a Vitest test on purpose: it asserts things about
 * build output, so as a unit test it would either silently skip when `.output`
 * is stale — which is worse than no check — or make `pnpm test` depend on having
 * built first. CI runs it straight after `pnpm build`.
 *
 * Usage: pnpm guard
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const OUT_DIR = resolve(process.cwd(), '.output/chrome-mv3');

/** Anything that could reach the network. F-50: there must be none. */
const NETWORK_APIS = [
  'fetch(',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'navigator.sendBeacon',
  'importScripts(',
];

/** The complete permission set. Growing it is a deliberate act, not a drift. */
const ALLOWED_PERMISSIONS = ['storage'];

const failures = [];
const checks = [];

function pass(message) {
  checks.push(message);
}

function fail(message) {
  failures.push(message);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

let files;
try {
  files = await walk(OUT_DIR);
} catch {
  console.error(`No build found at ${OUT_DIR}. Run \`pnpm build\` first.`);
  process.exit(1);
}

// --- Permissions ------------------------------------------------------------

const manifest = JSON.parse(await readFile(join(OUT_DIR, 'manifest.json'), 'utf8'));
const permissions = manifest.permissions ?? [];

if (JSON.stringify(permissions) === JSON.stringify(ALLOWED_PERMISSIONS)) {
  pass(`permissions are exactly ${JSON.stringify(ALLOWED_PERMISSIONS)}`);
} else {
  fail(
    `manifest permissions changed: expected ${JSON.stringify(ALLOWED_PERMISSIONS)}, ` +
      `found ${JSON.stringify(permissions)}. If this is intended, update SECURITY.md, ` +
      `docs/PUBLISHING.md and this script together.`,
  );
}

if (manifest.host_permissions?.length) {
  fail(
    `host_permissions must stay empty, found ${JSON.stringify(manifest.host_permissions)}`,
  );
} else {
  pass('no host permissions');
}

if (manifest.content_scripts?.length) {
  fail('content_scripts must stay empty — the extension never runs inside a page');
} else {
  pass('no content scripts');
}

// --- No network -------------------------------------------------------------

const scripts = files.filter((file) => file.endsWith('.js'));
const pages = files.filter((file) => file.endsWith('.html'));

for (const file of scripts) {
  const source = await readFile(file, 'utf8');
  for (const api of NETWORK_APIS) {
    if (source.includes(api)) {
      fail(
        `${file} references ${api} — the extension must make no network requests (F-50)`,
      );
    }
  }
}
if (scripts.length === 0)
  fail('no JavaScript found in the build — is it actually built?');
else pass(`${scripts.length} script file(s) contain no network APIs`);

// --- No remote resources ----------------------------------------------------

/**
 * Only markup is scanned, and only in attributes that actually load something.
 *
 * Scanning JavaScript for bare URLs looks thorough and is not: dependencies put
 * documentation links in their error messages, and a string in a thrown error
 * cannot fetch anything. The genuine risks — a CDN script tag, a remote
 * stylesheet, a tracking pixel — all live in `src` or `href`, and any runtime
 * request would have to go through the network APIs checked above.
 */
for (const file of pages) {
  const source = await readFile(file, 'utf8');
  const loaded = [...source.matchAll(/(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi)];
  if (loaded.length) {
    fail(
      `${file} loads remote resources: ${[...new Set(loaded.map((m) => m[1]))].join(', ')}`,
    );
  }
}
pass(`${pages.length} page(s) load no remote resources`);

// --- Report -----------------------------------------------------------------

for (const check of checks) console.warn(`  ok  ${check}`);

if (failures.length) {
  console.error('\nBundle guard failed:\n');
  for (const failure of failures) console.error(`  ✗  ${failure}`);
  process.exit(1);
}

console.warn('\nBundle guard passed.');
