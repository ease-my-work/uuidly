/**
 * Generates site/assets/og.png — the 1200x630 card social platforms show when
 * the landing page is linked.
 *
 * Deliberately typeless: no font is rendered, because rasterising text without a
 * font library means either shipping a font file or hand-plotting glyphs, and
 * neither is worth it. The card is the mark on the product's own black, which is
 * recognisable and cannot go stale when the copy changes. The title and
 * description come from the OG meta tags, which platforms render themselves.
 *
 * Usage: pnpm og
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blend, diamondCoverage, encodePng } from './lib/png.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'site/assets/og.png');

const WIDTH = 1200;
const HEIGHT = 630;

const BG = [0x0a, 0x0a, 0x0a]; // --bg
const ACCENT = [0xa7, 0x8b, 0xfa]; // --accent
const RULE = [0x2a, 0x2a, 0x2a]; // --border

const rgba = new Uint8Array(WIDTH * HEIGHT * 4);

// Flat black field. No gradient: the product does not use one.
for (let i = 0; i < rgba.length; i += 4) {
  rgba[i] = BG[0];
  rgba[i + 1] = BG[1];
  rgba[i + 2] = BG[2];
  rgba[i + 3] = 255;
}

// The mark, centred, sized to the shorter edge.
const markSize = 260;
const originX = Math.round((WIDTH - markSize) / 2);
const originY = Math.round((HEIGHT - markSize) / 2) - 30;

for (let y = 0; y < markSize; y++) {
  for (let x = 0; x < markSize; x++) {
    const i = ((originY + y) * WIDTH + (originX + x)) * 4;
    blend(rgba, i, ACCENT, diamondCoverage(x, y, markSize, 0.44, 0.19));
  }
}

// A hairline under the mark, the same weight as every rule in the popup, so the
// card reads as part of the product rather than a generic logo splash.
const ruleY = originY + markSize + 70;
const ruleHalf = 160;
for (let x = WIDTH / 2 - ruleHalf; x < WIDTH / 2 + ruleHalf; x++) {
  const i = (ruleY * WIDTH + Math.round(x)) * 4;
  blend(rgba, i, RULE, 1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, encodePng(WIDTH, HEIGHT, rgba));
console.warn(`og ${WIDTH}x${HEIGHT} -> site/assets/og.png`);
