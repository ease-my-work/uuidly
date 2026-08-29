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

/**
 * The Chrome Web Store icon, which is a different asset from the toolbar icons
 * despite sharing a size with one of them.
 *
 * Google's guidance is that the artwork occupies roughly 96x96 inside a 128x128
 * canvas. The toolbar icons are deliberately full-bleed — a browser toolbar gives
 * you 16 pixels and wasting four of them on margin is absurd — but the store
 * applies its own masking and shadow, and full-bleed art gets clipped by it.
 *
 * The margin stays transparent so the tile reads as a shape against both the
 * light and dark surfaces the store renders it on.
 */
function renderStoreIcon() {
  const size = 128;
  const inset = 16;
  const tile = size - inset * 2; // 96
  const rgba = new Uint8Array(size * size * 4);

  for (let y = 0; y < tile; y++) {
    for (let x = 0; x < tile; x++) {
      const i = ((y + inset) * size + (x + inset)) * 4;
      blend(rgba, i, TILE_BG, roundedSquareCoverage(x, y, tile, tile * 0.18));
      blend(rgba, i, ACCENT, diamondCoverage(x, y, tile, 0.44, 0.19));
    }
  }

  return encodePng(size, size, rgba);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  writeFileSync(resolve(OUT_DIR, `${size}.png`), renderIcon(size));
  console.warn(`icon ${size}x${size} -> public/icon/${size}.png`);
}

const storeDir = resolve(ROOT, 'store');
mkdirSync(storeDir, { recursive: true });
writeFileSync(resolve(storeDir, 'icon-128.png'), renderStoreIcon());
console.warn('store icon 128x128 (96x96 artwork) -> store/icon-128.png');
