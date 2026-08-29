/**
 * A minimal PNG encoder: zlib and a CRC32 table, both from the Node stdlib.
 *
 * Shared by the icon and Open Graph generators. An image library would be a
 * build-time supply-chain surface on a project whose whole pitch is that you can
 * audit what it ships.
 */

import { deflateSync } from 'node:zlib';

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

/**
 * @param {number} width
 * @param {number} height
 * @param {Uint8Array} rgba Row-major RGBA8 pixels.
 * @returns {Buffer}
 */
export function encodePng(width, height, rgba) {
  const stride = width * 4;
  // Each scanline is prefixed with its filter type; 0 is None.
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

/** Source-over composite of `rgb` at `alpha` onto pixel `i` of `dst`. */
export function blend(dst, i, rgb, alpha) {
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

/** Supersampling factor used for anti-aliased edges. */
export const SS = 4;

/**
 * Coverage of a diamond (|dx| + |dy| between `inner` and `outer`) at a pixel,
 * sampled SS x SS. `cx`/`cy` and the radii are in units of `size`.
 */
export function diamondCoverage(px, py, size, outer, inner, cx = 0.5, cy = 0.5) {
  let hits = 0;
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const x = (px + (sx + 0.5) / SS) / size;
      const y = (py + (sy + 0.5) / SS) / size;
      const d = Math.abs(x - cx) + Math.abs(y - cy);
      if (d <= outer && d >= inner) hits++;
    }
  }
  return hits / (SS * SS);
}

/** Coverage of a rounded rectangle covering the whole canvas. */
export function roundedSquareCoverage(px, py, size, radius) {
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
