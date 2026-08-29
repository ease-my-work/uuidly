/**
 * Composes the raw popup captures in store/ into Chrome Web Store screenshots.
 *
 * The store requires 1280x800 (or 640x400), JPEG or 24-bit PNG with **no alpha
 * channel**, and at most five. The captures are 420px-wide RGBA crops, so each
 * is scaled onto a 1280x800 canvas, annotated, and re-encoded as colour type 2.
 *
 * Why SVG and resvg rather than the hand-rolled encoder used for the icons: this
 * needs text, and rasterising type without a font engine is not reasonable.
 * @resvg/resvg-js is a devDependency — it never reaches the extension, and the
 * outputs are committed, so nobody needs to run this to build or ship.
 *
 * Note: annotations render in Ink Free, a Windows font. On a machine without it
 * resvg falls back to a default face and the output will look different. That is
 * why the PNGs are committed rather than generated in CI.
 *
 * Usage: pnpm screenshots
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { encodePngRgb } from './lib/png.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STORE = resolve(ROOT, 'store');
const OUT_DIR = resolve(STORE, 'listing');

const W = 1280;
const H = 800;

const BG = [0x0a, 0x0a, 0x0a];
const BG_HEX = '#0a0a0a';
const DOT = '#1c1c1c';
const TEXT = '#f5f5f5';
const DIM = '#a1a1a1';
const ACCENT = '#a78bfa';

const HAND = "'Ink Free', 'Segoe Script', 'Comic Sans MS', cursive";
const SANS = "'Segoe UI', system-ui, sans-serif";

/**
 * Each shot: the capture, a headline, and callouts.
 *
 * Callout targets are fractions of the source capture, so they stay correct if a
 * capture is retaken at a different size. `at` is where the text sits on the
 * 1280x800 canvas; `from` is where its arrow leaves the text.
 */
const SHOTS = [
  {
    src: 'uuidly_v4_default.png',
    out: '1-default.png',
    headline: 'A UUID, already there.',
    sub: 'Open the popup — no clicking Generate first.',
    callouts: [
      {
        lines: ['Five versions,', 'one click apart'],
        at: [300, 215],
        from: [370, 245],
        target: [0.5, 0.24],
        bend: [-60, 50],
      },
      {
        lines: ['Click the value', 'or the icon'],
        at: [900, 430],
        from: [890, 448],
        target: [0.83, 0.53],
        bend: [40, 60],
      },
    ],
    caption: 'One permission · no network requests · no tracking',
  },
  {
    src: 'uuidly_v7.png',
    out: '2-v7.png',
    headline: 'Time-ordered keys.',
    sub: 'v7 sorts lexicographically, so it indexes well.',
    callouts: [
      {
        lines: ['Sorts by creation time —', 'a good database key'],
        at: [270, 215],
        from: [400, 248],
        target: [0.42, 0.44],
        bend: [-70, 55],
      },
      {
        lines: ['A new one,', 'instantly'],
        at: [905, 300],
        from: [900, 320],
        target: [0.91, 0.53],
        bend: [50, 40],
      },
    ],
    caption: 'v1 and v7 carry a timestamp · v4 is random · NIL and MAX are constants',
  },
  {
    src: 'uuidly_bulk.png',
    out: '3-bulk.png',
    headline: 'Up to 100 at once.',
    sub: 'Copy them all, or take a spreadsheet-ready CSV.',
    callouts: [
      {
        // Deliberately aimed at the right-hand side of the row: an arrow from
        // here to the count field would slash across the whole popup.
        lines: ['Anything from', '1 to 100'],
        at: [700, 295],
        from: [695, 315],
        target: [0.92, 0.49],
        bend: [15, 15],
      },
      {
        lines: ['RFC 4180 quoting', 'and a UTF-8 BOM,', 'so Excel behaves'],
        at: [700, 580],
        from: [695, 600],
        target: [0.96, 0.9],
        bend: [20, 20],
      },
    ],
    caption: 'Copy as text, copy as JSON, or download the CSV',
  },
  {
    src: 'uuidly_formatting.png',
    out: '4-formatting.png',
    headline: 'Shaped for where it lands.',
    sub: 'Braces, quotes, urn:uuid:, uppercase, hyphens off.',
    callouts: [
      {
        lines: ['Longer than the box?', 'It scrolls — never', 'truncates'],
        at: [700, 205],
        from: [695, 225],
        // The horizontal scrollbar under the value, which is the thing the text
        // is actually describing.
        target: [0.72, 0.302],
        bend: [15, -20],
      },
      {
        lines: ['Every row follows', 'the same format'],
        at: [700, 545],
        from: [695, 565],
        target: [0.88, 0.6],
        bend: [15, 15],
      },
    ],
    caption: 'Changing the format never regenerates the value',
  },
  {
    src: 'uuidly_light.png',
    out: '5-light.png',
    headline: 'Light or dark.',
    sub: 'Follows your system, or pick one and it remembers.',
    callouts: [
      {
        lines: ['System, light', 'or dark'],
        at: [880, 210],
        from: [875, 230],
        target: [0.87, 0.11],
        bend: [30, -50],
      },
    ],
    // No second arrow here: everything worth pointing at sits on the left of a
    // white popup, and a callout crossing it would be unreadable either way.
    caption: 'One permission · no network requests · no tracking',
  },
];

// --- drawing helpers --------------------------------------------------------

const escape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function dotGrid() {
  const dots = [];
  for (let y = 20; y < H; y += 32) {
    for (let x = 20; x < W; x += 32) {
      dots.push(`<circle cx="${x}" cy="${y}" r="1.2" fill="${DOT}"/>`);
    }
  }
  return dots.join('');
}

/**
 * A quadratic curve with a filled head, drawn with a slightly loose stroke so it
 * reads as annotation rather than as part of the interface.
 */
function arrow(from, to, bend) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const cx = (x1 + x2) / 2 + bend[0];
  const cy = (y1 + y2) / 2 + bend[1];

  // The head points along the tangent at the end, which for a quadratic is the
  // direction from the control point to the end point.
  const angle = Math.atan2(y2 - cy, x2 - cx);
  const len = 20;
  const spread = 0.42;
  const p1 = [x2 - len * Math.cos(angle - spread), y2 - len * Math.sin(angle - spread)];
  const p2 = [x2 - len * Math.cos(angle + spread), y2 - len * Math.sin(angle + spread)];

  // Stop the shaft short of the tip so the stroke does not poke through the head.
  const backX = x2 - 9 * Math.cos(angle);
  const backY = y2 - 9 * Math.sin(angle);

  // Accent rather than white: an arrow has to stay visible where it lands, and
  // the light-theme capture is a white panel that swallowed a white arrowhead.
  return [
    `<path d="M ${x1} ${y1} Q ${cx} ${cy} ${backX.toFixed(1)} ${backY.toFixed(1)}"`,
    ` fill="none" stroke="${ACCENT}" stroke-width="3.2" stroke-linecap="round"/>`,
    `<polygon points="${x2},${y2} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}" fill="${ACCENT}"/>`,
  ].join('');
}

function handText(lines, [x, y]) {
  const rows = lines.map(
    (line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : 34}">${escape(line)}</tspan>`,
  );
  return `<text x="${x}" y="${y}" font-family="${HAND}" font-size="27" fill="${TEXT}">${rows.join('')}</text>`;
}

function buildSvg(shot) {
  const srcPath = resolve(STORE, shot.src);
  const bytes = readFileSync(srcPath);
  const sw = bytes.readUInt32BE(16);
  const sh = bytes.readUInt32BE(20);

  // Leave room for the headline block at the top and breathing space around it.
  const maxW = 700;
  const maxH = 560;
  const scale = Math.min(maxW / sw, maxH / sh);
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);
  const dx = (shot.tall ?? sh > sw) ? 170 : 90;
  const dy = Math.round(215 + (560 - dh) / 2);

  const b64 = bytes.toString('base64');

  const callouts = shot.callouts
    .map((c) => {
      const target = [
        Math.round(dx + c.target[0] * dw),
        Math.round(dy + c.target[1] * dh),
      ];
      return handText(c.lines, c.at) + arrow(c.from, target, c.bend);
    })
    .join('');

  // A tall capture runs to the bottom of the canvas, so the caption moves into
  // the free right-hand column rather than sitting on top of the popup.
  const tallLayout = dy + dh > 720;
  const caption = shot.caption
    ? `<text x="${tallLayout ? 700 : 90}" y="752" font-family="${SANS}" font-size="19" fill="${DIM}">${escape(shot.caption)}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG_HEX}"/>
  ${dotGrid()}
  <g transform="translate(90 96)">
    <rect x="0" y="-26" width="13" height="13" rx="2" fill="${ACCENT}" transform="rotate(45 6.5 -19.5)"/>
    <text x="30" y="-14" font-family="${SANS}" font-size="19" font-weight="600" fill="${TEXT}">uuidly</text>
    <text x="0" y="26" font-family="${SANS}" font-size="42" font-weight="600" fill="${TEXT}">${escape(shot.headline)}</text>
    <text x="0" y="62" font-family="${SANS}" font-size="20" fill="${DIM}">${escape(shot.sub)}</text>
  </g>
  <rect x="${dx - 1}" y="${dy - 1}" width="${dw + 2}" height="${dh + 2}" rx="13" fill="none" stroke="#2a2a2a" stroke-width="2"/>
  <image x="${dx}" y="${dy}" width="${dw}" height="${dh}" xlink:href="data:image/png;base64,${b64}"/>
  ${callouts}
  ${caption}
</svg>`;
}

// --- render -----------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });

for (const shot of SHOTS) {
  const svg = buildSvg(shot);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { loadSystemFonts: true },
    background: BG_HEX,
  });

  const rendered = resvg.render();
  const rgba = rendered.pixels;

  // Flatten to 24-bit RGB: the store rejects an alpha channel outright.
  const png = encodePngRgb(rendered.width, rendered.height, rgba, BG);
  const out = resolve(OUT_DIR, shot.out);
  writeFileSync(out, png);

  console.warn(
    `${shot.out.padEnd(20)} ${rendered.width}x${rendered.height}  ${(png.length / 1024).toFixed(0)} kB`,
  );
}

console.warn(
  `\n${SHOTS.length} screenshots -> store/listing/ (1280x800, 24-bit, no alpha)`,
);
