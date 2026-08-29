/**
 * Generates public/icon/{16,32,48,96,128}.png from a single vector definition.
 *
 * Mark (docs/DESIGN.md §11): a rotated square with a hollow centre — reads as
 * both a "u" counter-form and a node. Single colour so it works on any toolbar
 * theme. PNG encoding lives in scripts/lib/png.mjs.
 *
 * Usage: pnpm icons
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blend, diamondCoverage, encodePng, roundedSquareCoverage } from './lib/png.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/icon');

const ACCENT = [0xa7, 0x8b, 0xfa]; // --accent (dark theme)
const TILE_BG = [0x0a, 0x0a, 0x0a]; // --bg, used for the 128px store tile

const SIZES = [16, 32, 48, 96, 128];

function renderIcon(size) {
  const rgba = new Uint8Array(size * size * 4);

  // At 16px a hollow centre turns to mush, so the small icon stays solid.
  const outer = 0.44;
  const inner = size >= 32 ? 0.19 : 0;
  const isTile = size === 128;
  const tileRadius = size * 0.18;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (isTile) {
        blend(rgba, i, TILE_BG, roundedSquareCoverage(x, y, size, tileRadius));
      }
      blend(rgba, i, ACCENT, diamondCoverage(x, y, size, outer, inner));
    }
  }

  return encodePng(size, size, rgba);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  writeFileSync(resolve(OUT_DIR, `${size}.png`), renderIcon(size));
  console.warn(`icon ${size}x${size} -> public/icon/${size}.png`);
}
