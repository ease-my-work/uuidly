/**
 * Generates store/promo-440x280.png — the small promotional tile the Chrome Web
 * Store shows in listings and category pages.
 *
 * Same reasoning as the Open Graph card (scripts/gen-og.mjs): no text, because
 * rasterising type without a font library means shipping a font or plotting
 * glyphs by hand. The mark on the product's own black is recognisable and cannot
 * contradict the listing copy later.
 *
 * Screenshots are a different matter — those have to be captured from the real
 * popup and cannot be generated. See docs/STORE-LISTING.md.
 *
 * Usage: pnpm promo
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blend, diamondCoverage, encodePng } from './lib/png.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'store/promo-440x280.png');

const WIDTH = 440;
const HEIGHT = 280;

const BG = [0x0a, 0x0a, 0x0a]; // --bg
const ACCENT = [0xa7, 0x8b, 0xfa]; // --accent

const rgba = new Uint8Array(WIDTH * HEIGHT * 4);

for (let i = 0; i < rgba.length; i += 4) {
  rgba[i] = BG[0];
  rgba[i + 1] = BG[1];
  rgba[i + 2] = BG[2];
  rgba[i + 3] = 255;
}

const markSize = 132;
const originX = Math.round((WIDTH - markSize) / 2);
const originY = Math.round((HEIGHT - markSize) / 2);

for (let y = 0; y < markSize; y++) {
  for (let x = 0; x < markSize; x++) {
    const i = ((originY + y) * WIDTH + (originX + x)) * 4;
    blend(rgba, i, ACCENT, diamondCoverage(x, y, markSize, 0.44, 0.19));
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, encodePng(WIDTH, HEIGHT, rgba));
console.warn(`promo ${WIDTH}x${HEIGHT} -> store/promo-440x280.png`);
