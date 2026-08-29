/**
 * Generates public/icon/{16,32,48,96,128}.png from a single vector definition.
 *
 * Dependency-free on purpose: a build-time image library would be a supply-chain
 * surface for an extension whose whole pitch is "zero dependencies you can't audit".
 * PNG encoding here is ~60 lines of zlib + CRC32, both from the Node stdlib.
 *
 * Mark (docs/DESIGN.md §11): a rotated square with a hollow centre — reads as both
 * a "u" counter-form and a node. Single colour so it works on any toolbar theme.
 *
 * Usage: pnpm icons
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/icon');

const ACCENT = [0xa7, 0x8b, 0xfa]; // --accent (dark theme)
const TILE_BG = [0x0a, 0x0a, 0x0a]; // --bg, used for the 128px store tile

const SIZES = [16, 32, 48, 96, 128];

/** Supersampling factor for anti-aliased edges. */
const SS = 4;

// --- PNG encoding -----------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

/** @param {Uint8Array} rgba RGBA8 pixels, row-major. */
function encodePng(width, height, rgba) {
  const stride = width * 4;
  // Each scanline is prefixed with filter type 0 (None).
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Mark geometry ----------------------------------------------------------

/**
 * Coverage of the mark at a point in the unit square, sampled at SS x SS.
 * Diamond: |dx| + |dy| <= outer. Hollow centre when the size allows it.
 */
function coverage(px, py, size, outer, inner) {
  let hits = 0;
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const x = (px + (sx + 0.5) / SS) / size;
      const y = (py + (sy + 0.5) / SS) / size;
      const d = Math.abs(x - 0.5) + Math.abs(y - 0.5);
      if (d <= outer && d >= inner) hits++;
    }
  }
  return hits / (SS * SS);
}

/** Rounded-square coverage for the store tile background. */
function tileCoverage(px, py, size, radius) {
  let hits = 0;
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const x = px + (sx + 0.5) / SS;
      const y = py + (sy + 0.5) / SS;
      const dx = Math.max(radius - x, x - (size - radius), 0);
      const dy = Math.max(radius - y, y - (size - radius), 0);
      if (dx * dx + dy * dy <= radius * radius) hits++;
    }
  }
  return hits / (SS * SS);
}

function blend(dst, i, rgb, alpha) {
  if (alpha <= 0) return;
  const a = dst[i + 3] / 255;
  const outA = alpha + a * (1 - alpha);
  for (let c = 0; c < 3; c++) {
    const src = rgb[c] / 255;
    const back = dst[i + c] / 255;
    dst[i + c] = Math.round(((src * alpha + back * a * (1 - alpha)) / outA) * 255);
  }
  dst[i + 3] = Math.round(outA * 255);
}

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
        blend(rgba, i, TILE_BG, tileCoverage(x, y, size, tileRadius));
      }
      blend(rgba, i, ACCENT, coverage(x, y, size, outer, inner));
    }
  }

  return encodePng(size, size, rgba);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const file = resolve(OUT_DIR, `${size}.png`);
  writeFileSync(file, renderIcon(size));
  console.warn(`icon ${size}x${size} -> public/icon/${size}.png`);
}
