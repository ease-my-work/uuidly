# uuidly — Technical Implementation

Companion documents: [FEATURES.md](FEATURES.md) · [DESIGN.md](DESIGN.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [PUBLISHING.md](PUBLISHING.md)

---

## 1. Stack

| Area                | Choice                                                      | Why                                                                                                 |
| ------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Extension framework | [WXT](https://wxt.dev) 0.21, Manifest V3                    | File-based entrypoints, HMR, and `wxt zip` / `wxt submit` cover build and store publishing          |
| Target              | **Chrome only through v1.0.0**                              | Firefox and Edge land in v1.1.0. WXT makes that a config change, not a rewrite                      |
| UI                  | React API on the **Preact** runtime (`preact/compat` alias) | Identical source — JSX, hooks, Testing Library — at 7.88 kB gzipped instead of 59.63 kB. See §6     |
| Language            | TypeScript 5.9, `strict` + `noUncheckedIndexedAccess`       | `typescript-eslint@8` peer-caps below TS 6, so TS 7 is deliberately not used                        |
| Styling             | Tailwind CSS v4 via `@tailwindcss/vite`                     | Semantic tokens shared between popup and landing page                                               |
| UUIDs               | [`uuid@14`](https://github.com/uuidjs/uuid)                 | Zero-dependency, tree-shakable, MIT. Provides `v1`, `v4`, `v7`, `NIL`, `MAX`, `validate`, `version` |
| Tests               | Vitest 4 + Testing Library + `WxtVitest`                    | Unit and component tests, no browser runtime needed                                                 |
| Package manager     | pnpm 10, Node 22                                            |                                                                                                     |

### Runtime permissions

```json
"permissions": ["storage"]
```

That is the complete list, and it is asserted by tests. No host permissions, no `downloads`,
no `clipboardWrite`, no content scripts, no background service worker.

---

## 2. Configuration

`wxt.config.ts` sets `srcDir: 'src'`, enables the React module, disables auto-imports, and
aliases React to Preact.

Two behaviours are easy to trip over:

- **`action.default_title` comes from the popup's `<title>`**, not from the manifest block.
  It is set in `src/entrypoints/popup/index.html`.
- **Icons are auto-wired** from `public/icon/{16,32,48,96,128}.png`. No manifest entry.

Auto-imports are **off** (`imports: false`) so that every symbol is imported explicitly and
lint, typecheck and code review all see the same dependency graph. The `#imports` alias still
resolves, so `import { storage } from '#imports'` works where it is wanted.

---

## 3. Core modules

### `src/lib/uuid.ts`

The only file that imports `uuid`.

```ts
export type UuidKind = 'v4' | 'v1' | 'v7' | 'nil' | 'max';
export const KINDS: UuidKind[];
export const IS_CONSTANT: Record<UuidKind, boolean>;
export function generate(kind: UuidKind): string;
export function generateMany(kind: UuidKind, count: number): string[]; // clamped 1..100
```

- `uuid@14` randomises the v1 node id per process, so **no MAC address is read**. Asserted by a test.
- For `nil` and `max`, `generateMany` returns `count` copies of the constant. Documented behaviour.
- Only named exports are imported, so Rollup tree-shakes v3/v5/v6/`parse`/`stringify` away.

### `src/lib/format.ts`

Pure, no imports.

```ts
export interface FormatOpts {
  uppercase: boolean;
  hyphens: boolean;
  wrapper: 'none' | 'braces' | 'quotes' | 'urn';
}
export function applyFormat(raw: string, o: FormatOpts): string;
```

Order of operations: strip hyphens → apply case → apply wrapper. The `urn:uuid:` prefix is
always lowercase per RFC 9562 §4.

### `src/lib/csv.ts`

RFC 4180 output: `\r\n` line endings, fields containing `,` `"` or a newline are quoted and
escaped, and a UTF-8 BOM is prefixed so Excel reads it correctly.

Download path is `Blob` → `URL.createObjectURL` → synthetic `<a download>` click →
`revokeObjectURL`. This needs **no `downloads` permission**. A `browser.tabs.create(blobUrl)`
fallback exists for browsers that close the popup on anchor click; it is only exercised in v1.1.0.

### `src/lib/clipboard.ts`

`navigator.clipboard.writeText` inside the user-gesture handler. Popups are a focused secure
context, so no `clipboardWrite` permission is required. A hidden `<textarea>` +
`document.execCommand('copy')` fallback is kept for resilience.

### `src/lib/prefs.ts`

`wxt/storage` items in the `local:` area, each with a `fallback` so a first run needs no writes.

---

## 4. Render path

This is what makes the popup feel instant (F-62).

1. `main.tsx` generates the first UUID **synchronously, before `createRoot`**, and seeds it into
   initial state. First paint already shows a value.
2. Stored preferences are read **after** mount. If they differ from the defaults, one cheap
   re-render swaps the value. There is no skeleton and no flash of empty — the default UUID is
   already valid content.
3. No suspense boundary and no async module in the critical path.
4. **No web fonts.** System stacks only — a font request would violate F-50 and cost first paint.
5. Tailwind v4 emits a single small CSS file. No runtime CSS-in-JS.

---

## 5. Design tokens

`src/assets/tailwind.css` is the single source of truth for colour. Twelve semantic tokens are
defined on `:root` for dark, overridden under `prefers-color-scheme: light` (guarded so an
explicit dark choice still wins) and again under `[data-theme='light']` so the manual toggle wins
in both directions. They are exposed to Tailwind through `@theme inline`, giving utilities like
`bg-surface` and `text-dim`.

Full palette, contrast ratios and component specs: [DESIGN.md](DESIGN.md).

---

## 6. Why Preact

Measured at scaffold time, before a single feature existed:

| Runtime                    | popup JS raw | popup JS gzipped | Share of the 60 kB budget |
| -------------------------- | ------------ | ---------------- | ------------------------- |
| `react` + `react-dom` 19.2 | 191.49 kB    | **59.63 kB**     | 99.4%                     |
| `preact/compat` 10.29      | 19.59 kB     | **7.88 kB**      | 13%                       |

The alias is four lines in `wxt.config.ts`. Source code, JSX, hooks, `@testing-library/react`,
typecheck and lint are all unchanged — `react` and `react-dom` stay installed as devDependencies
for types and Testing Library peers. What is given up is React Server Components and full
Suspense, neither of which a popup can use.

`.size-limit.json` keeps both the 60 kB product budget (F-60) and a 20 kB regression tripwire, so
a future dependency cannot quietly consume the headroom.

---

## 7. Testing

| Layer         | Tool                                   | Covers                                                                                                                                                          |
| ------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit          | Vitest                                 | `uuid.ts` (RFC 9562 version and variant bits, v7 monotonicity, uniqueness), `format.ts` (all 16 option combinations), `csv.ts` (RFC 4180 escaping, BOM, header) |
| Component     | Vitest + Testing Library + `WxtVitest` | Copy payload, version switching, count clamping, disabled refresh on constants                                                                                  |
| Accessibility | `vitest-axe`                           | Zero violations on the rendered popup                                                                                                                           |
| Guard         | Custom test                            | The built bundle contains no `fetch(` / `XMLHttpRequest` / `WebSocket` (F-50)                                                                                   |
| Size          | `size-limit`                           | F-60 and F-61, enforced as failing CI checks                                                                                                                    |

Note: `WxtVitest` is imported from `wxt/testing/vitest-plugin`.

---

## 8. Icons

`scripts/gen-icons.mjs` renders `public/icon/{16,32,48,96,128}.png` from one vector definition
using only `node:zlib` and a hand-rolled CRC32 — roughly sixty lines, no image library. An image
dependency would be a build-time supply-chain surface on a project whose pitch is auditability.

The mark is a rotated square with a hollow centre. At 16px the hollow is dropped, because it
turns to mush at that size. The 128px store tile adds a black rounded-square background.

Regenerate with `pnpm icons`.

---

## 9. Scripts

| Script                                       | Does                                                            |
| -------------------------------------------- | --------------------------------------------------------------- |
| `pnpm dev`                                   | WXT dev server with HMR, opens Chrome with the extension loaded |
| `pnpm build`                                 | Production build to `.output/chrome-mv3`                        |
| `pnpm zip`                                   | Store-ready ZIP                                                 |
| `pnpm typecheck`                             | `tsc --noEmit`                                                  |
| `pnpm lint` / `lint:fix`                     | ESLint 10 flat config                                           |
| `pnpm format` / `format:check`               | Prettier                                                        |
| `pnpm test` / `test:watch` / `test:coverage` | Vitest                                                          |
| `pnpm size`                                  | size-limit budgets                                              |
| `pnpm icons`                                 | Regenerate the PNG icon set                                     |

`postinstall` runs `wxt prepare`, which generates `.wxt/tsconfig.json` and `.wxt/wxt.d.ts`.
Typecheck depends on it, so run `pnpm install` before `pnpm typecheck` in a fresh clone.
