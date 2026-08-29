# uuidly — Implementation Plan

> Browser extension to generate and copy UUIDs in one click — v1, v4, v7, NIL, MAX.
> Repo: `ease-my-work/uuidly` · License: MIT · Status: **Phases 0–5 complete, at Checkpoint C** (plus post-C UI revisions)
> Companion documents: [docs/DESIGN.md](../docs/DESIGN.md) (frozen visual contract) · [todo.md](todo.md) (task checklist)

**Scope: P0–P8 target Chrome only and ship v1.0.0. Firefox, Edge and Safari land in P9 (v1.1.0).**
WXT is chosen precisely so that adding a browser later is a config change, not a rewrite — so the
Chrome-first cut costs nothing in rework.

---

## 0. Decisions locked

| Area                | Decision                                                                                                       | Rationale                                                                                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extension framework | **WXT 0.21.x**, MV3, target **`chrome` only for P0–P8**                                                        | File-based entrypoints, HMR, `wxt zip` / `wxt submit` cover build + store publishing. Other browsers are added in P9 via `-b <browser>`                                                                                      |
| UI                  | **React API + TypeScript (strict)** via `@wxt-dev/module-react`, running on **Preact** (`preact/compat` alias) | Familiar React source — JSX, hooks, Testing Library — at 7.88 kB gz instead of 59.63 kB. Measured at T0.1: real `react` + `react-dom` consumed 99.4% of the F-60 budget before any feature existed. Decided at Checkpoint A. |
| Styling             | **Tailwind CSS v4** via `@tailwindcss/vite`                                                                    | Shared design tokens between popup and landing page; dark-first                                                                                                                                                              |
| UUID engine         | **`uuid@14`** (uuidjs/uuid)                                                                                    | Zero-dep, tree-shakable, MIT. Exports `v1`, `v4`, `v7`, `NIL`, `MAX`, `validate`, `version` — full spec coverage, no bespoke crypto to audit                                                                                 |
| Package manager     | **pnpm 10**, Node 22                                                                                           | Matches local toolchain; WXT docs use pnpm                                                                                                                                                                                   |
| Landing page        | **Static HTML/CSS in `site/`** → GitHub Pages                                                                  | One page, no build step, free hosting                                                                                                                                                                                        |
| Tests               | **Vitest** + `@testing-library/react` + `WxtVitest` plugin                                                     | Unit + component; no browser runtime needed                                                                                                                                                                                  |
| Permissions         | **`storage` only.** No host permissions, no `downloads`, no `clipboardWrite`                                   | Fastest store review, strongest privacy claim                                                                                                                                                                                |

**Deferred to P9 (v1.1.0):** Firefox build + AMO submission, Edge Add-ons submission, Safari.

**Non-goals for v1.x:** v3/v5 namespace UUIDs, ULID/NanoID, generation history log, cross-device sync, context-menu integration.

---

## 1. Feature list

> **[docs/FEATURES.md](../docs/FEATURES.md) is canonical** and carries live status. This section
> is the original plan, kept as the record of what was scoped up front.

### 1.1 Generation (P0)

| ID   | Feature                   | Detail                                                                                                      |
| ---- | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| F-01 | **UUID v4**               | Random. Default selection on first install.                                                                 |
| F-02 | **UUID v1**               | Timestamp + node. Random node id per session (no MAC leak).                                                 |
| F-03 | **UUID v7**               | Unix-epoch time-ordered, lexicographically sortable.                                                        |
| F-04 | **NIL UUID**              | `00000000-0000-0000-0000-000000000000`                                                                      |
| F-05 | **MAX UUID**              | `ffffffff-ffff-ffff-ffff-ffffffffffff`                                                                      |
| F-06 | **Pre-generated on open** | A UUID is already on screen the instant the popup paints — zero clicks to copy.                             |
| F-07 | **Refresh**               | Button + `R` / `Space` regenerate in place. NIL/MAX are constants (refresh disabled, control explains why). |

### 1.2 Copy (P0)

| ID   | Feature             | Detail                                             |
| ---- | ------------------- | -------------------------------------------------- |
| F-10 | **Click-to-copy**   | Whole UUID display is the copy target.             |
| F-11 | **Copy feedback**   | Inline "Copied" state, 1.2s, `aria-live="polite"`. |
| F-12 | **Keyboard copy**   | `C` or `Ctrl/Cmd+C` copies current value.          |
| F-13 | **Copy all (bulk)** | Newline-joined list to clipboard.                  |
| F-14 | **Copy as JSON**    | `["…","…"]` — bulk mode only.                      |

### 1.3 Formatting (P1)

| ID   | Feature            | Detail                                                              |
| ---- | ------------------ | ------------------------------------------------------------------- |
| F-20 | **Case toggle**    | lowercase (default) / UPPERCASE                                     |
| F-21 | **Hyphens toggle** | `xxxx-xxxx…` (default) / `xxxxxxxx…`                                |
| F-22 | **Wrapper**        | none (default) / `{braces}` / `"quotes"` / `urn:uuid:`              |
| F-23 | **Live preview**   | Format changes re-render the current value without regenerating it. |

### 1.4 Bulk (P0)

| ID   | Feature                          | Detail                                                                       |
| ---- | -------------------------------- | ---------------------------------------------------------------------------- |
| F-30 | **Count 1–100**                  | Number input + stepper. Clamped and validated.                               |
| F-31 | **Bulk list**                    | Scrollable, monospace, per-row copy button.                                  |
| F-32 | **CSV download**                 | Columns: `index,uuid,version,generated_at` (ISO-8601 UTC).                   |
| F-33 | **Filename**                     | `uuidly-<version>-<count>-<yyyymmdd-hhmmss>.csv`                             |
| F-34 | **Blob download, no permission** | `URL.createObjectURL` + `<a download>`; no `downloads` permission requested. |

### 1.5 Persistence & UX (P1)

| ID   | Feature                                     | Detail                                                                                                      |
| ---- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| F-40 | **Remembers last version + format + count** | `wxt/storage` → `local:` area.                                                                              |
| F-41 | **Non-blocking hydration**                  | Popup paints with defaults immediately, then applies stored prefs. Never awaits storage before first paint. |
| F-42 | **Dark-first theme**                        | Black surface, follows `prefers-color-scheme`; manual override in footer.                                   |
| F-43 | **Full keyboard nav**                       | Visible focus rings, `1`–`5` switch version, `Esc` closes.                                                  |
| F-44 | **A11y**                                    | WCAG 2.1 AA: contrast ≥ 4.5:1, labelled controls, live regions.                                             |

### 1.6 Privacy & trust (P0)

| ID   | Feature                     | Detail                                                                                         |
| ---- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| F-50 | **Zero network**            | No fetch/XHR anywhere. Enforced by a test asserting the built bundle contains no network APIs. |
| F-51 | **No analytics/telemetry**  | Stated in README, SECURITY.md, and both store listings.                                        |
| F-52 | **Minimal permissions**     | `storage` only.                                                                                |
| F-53 | **Offline by construction** | Works with no connection; nothing to fail.                                                     |

### 1.7 Performance budget (P0)

| ID   | Budget                                           |
| ---- | ------------------------------------------------ |
| F-60 | Popup JS ≤ **60 KB gzipped**                     |
| F-61 | Popup CSS ≤ **10 KB gzipped**                    |
| F-62 | First UUID visible ≤ **100 ms** after icon click |
| F-63 | Bulk 100 generate + render ≤ **50 ms**           |

### 1.8 Landing page (P1)

| ID   | Feature                                                                                       |
| ---- | --------------------------------------------------------------------------------------------- |
| F-70 | Single page: hero, live in-browser demo, feature grid, store badges, screenshots, FAQ, footer |
| F-71 | Store install button (Chrome Web Store; Firefox + Edge badges added in P9)                    |
| F-72 | SEO: title/meta/OG/Twitter cards, JSON-LD `SoftwareApplication`, `sitemap.xml`, `robots.txt`  |
| F-73 | Lighthouse ≥ 95 on all four categories                                                        |
| F-74 | Deployed to GitHub Pages by Action on push to `master`                                        |

### 1.9 Open-source infrastructure (P0)

| ID   | Feature                                                                                                  |
| ---- | -------------------------------------------------------------------------------------------------------- |
| F-80 | `README.md` — badges, screenshot, install, dev setup, architecture, contributing, license                |
| F-81 | `LICENSE` (MIT), `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), `CONTRIBUTING.md`, `SECURITY.md`       |
| F-82 | Issue templates (YAML forms) + PR template + `config.yml`                                                |
| F-83 | CI: lint, typecheck, test, build, bundle-size gate — on PR and push                                      |
| F-84 | CodeQL + `dependency-review-action` + Dependabot (npm + actions, weekly)                                 |
| F-85 | Release workflow: tag → `wxt zip` → GitHub Release with artifacts → `wxt submit` to the Chrome Web Store |
| F-86 | `CHANGELOG.md` (Keep a Changelog), Conventional Commits, SemVer                                          |
| F-87 | Pinned action SHAs, least-privilege `permissions:` blocks                                                |

---

## 2. Technical implementation

> **[docs/TECHNICAL.md](../docs/TECHNICAL.md) is canonical.** This section is the original
> design; where the two differ, the shipped code and `docs/` are right.

### 2.1 Repository layout

```
uuidly/
├── .github/
│   ├── workflows/{ci.yml,release.yml,pages.yml,codeql.yml}
│   ├── ISSUE_TEMPLATE/{bug_report.yml,feature_request.yml,config.yml}
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── dependabot.yml
│   └── FUNDING.yml
├── docs/
│   ├── FEATURES.md          # §1 of this plan, promoted
│   ├── TECHNICAL.md         # §2 of this plan, promoted
│   ├── DESIGN.md            # tasks/design.md, promoted
│   ├── ARCHITECTURE.md
│   └── PUBLISHING.md        # store submission runbook + required secrets
├── public/icon/{16,32,48,96,128}.png
├── site/                    # landing page (GitHub Pages source)
│   ├── index.html
│   ├── styles.css
│   ├── demo.js
│   └── assets/{screenshot-*.png,og.png,favicon.svg}
├── src/
│   ├── entrypoints/popup/{index.html,main.tsx,App.tsx}
│   ├── components/{Header,VersionTabs,UuidDisplay,FormatBar,BulkPanel,ThemeToggle,icons}.tsx
│   ├── hooks/{useUuid,usePrefs,useCopy,useHotkeys}.ts
│   ├── lib/{uuid,format,csv,clipboard,prefs}.ts
│   ├── types.ts
│   └── assets/tailwind.css
├── tasks/{plan.md,design.md,todo.md}
├── wxt.config.ts vitest.config.ts eslint.config.js tsconfig.json package.json
└── README.md LICENSE CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md CHANGELOG.md
```

### 2.2 `wxt.config.ts`

```ts
import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'uuidly — UUID Generator',
    short_name: 'uuidly',
    description:
      'Generate and copy UUID v1, v4, v7, NIL and MAX in one click. Bulk up to 100 with CSV export. Offline, no tracking.',
    permissions: ['storage'],
  },

  // Auto-imports off: every symbol is imported explicitly so lint, typecheck and
  // review all see the same dependency graph.
  imports: false,

  vite: () => ({
    plugins: [tailwindcss()],
    // React API on the Preact runtime — see the decisions table.
    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react/jsx-runtime': 'preact/jsx-runtime',
      },
    },
  }),
});
```

> Icons are auto-wired by WXT from `public/icon/{16,32,48,96,128}.png` — no manifest entry needed.
> `action.default_title` (the toolbar tooltip) is derived by WXT from the popup's `<title>`, **not** from the manifest block — it is set in `src/entrypoints/popup/index.html`.
> **P9 adds** `browser_specific_settings.gecko` (AMO requirement) here; WXT strips it from Chrome builds automatically, so it is additive.

### 2.3 Core modules

**`lib/uuid.ts`** — the only file that imports `uuid`.

```ts
import { v1, v4, v7, NIL, MAX } from 'uuid';

export type UuidKind = 'v4' | 'v1' | 'v7' | 'nil' | 'max';
export const KINDS: UuidKind[] = ['v4', 'v1', 'v7', 'nil', 'max'];
export const IS_CONSTANT: Record<UuidKind, boolean> = {
  v4: false,
  v1: false,
  v7: false,
  nil: true,
  max: true,
};

export function generate(kind: UuidKind): string;
export function generateMany(kind: UuidKind, count: number): string[]; // count clamped 1..100
```

- uuid@14 randomises the v1 node id per process — **no MAC address is read**. Asserted by test, stated in `SECURITY.md`.
- `generateMany` for NIL/MAX returns `count` copies of the constant (documented behaviour, not a bug).

**`lib/format.ts`** — pure, zero imports.

```ts
export interface FormatOpts {
  uppercase: boolean;
  hyphens: boolean;
  wrapper: 'none' | 'braces' | 'quotes' | 'urn';
}
export const DEFAULT_FORMAT: FormatOpts;
export function applyFormat(raw: string, o: FormatOpts): string;
```

Order of operations: strip hyphens → apply case → apply wrapper. The `urn:uuid:` prefix is always emitted lowercase per RFC 9562 §4.

**`lib/csv.ts`**

- `toCsv(rows: { index: number; uuid: string; version: string; generatedAt: string }[]): string`
- RFC 4180: `\r\n` line endings, quote-and-escape any field containing `,` `"` or a newline, UTF-8 BOM prefix so Excel reads it correctly.
- `downloadCsv(name, csv)`: `Blob` → `URL.createObjectURL` → synthetic `<a download>` click → `revokeObjectURL` on the next tick. **No `downloads` permission.** Chrome MV3 popups survive a synthetic anchor click. A `browser.tabs.create({ url: blobUrl })` fallback path is written now but only exercised and verified in P9, where some browsers close the popup on anchor click.

**`lib/clipboard.ts`**

- `navigator.clipboard.writeText` inside the popup's user-gesture handler. Popups are a focused secure context, so no `clipboardWrite` permission is required. A hidden `<textarea>` + `document.execCommand('copy')` fallback is included for resilience; it becomes load-bearing for older Firefox ESR in P9.

**`lib/prefs.ts`** — `wxt/storage`

```ts
import { storage } from '#imports';

export const kindPref = storage.defineItem<UuidKind>('local:kind', { fallback: 'v4' });
export const formatPref = storage.defineItem<FormatOpts>('local:format', {
  fallback: DEFAULT_FORMAT,
  version: 1,
});
export const countPref = storage.defineItem<number>('local:count', { fallback: 10 });
```

### 2.4 Render path — this is what makes it feel instant

1. `main.tsx` calls `generate('v4')` **synchronously before `createRoot`** and seeds it into initial state. First paint already shows a UUID.
2. Prefs are read **after** mount in an effect. If the stored kind differs from `v4`, one cheap re-render swaps the value.
3. No suspense boundary, no async module in the critical path, no web font — system monospace stack `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
4. Tailwind v4 emits one small CSS file; no runtime CSS-in-JS.
5. `uuid` is imported by named exports only, so Rollup tree-shakes v3/v5/v6/parse/stringify out of the bundle.

### 2.5 Component tree

```
App
App
├── Header            (logo, ThemeToggle, GitHub link)
├── VersionTabs       (F-01..05, hotkeys 1-5)
├── UuidDisplay       (F-06, F-10, F-11) ── inline Copy + Refresh icon buttons (F-07)
├── FormatBar         (F-20..23)
└── BulkPanel         (F-30..34, collapsed by default)
```

State lives in `App` and flows down — no state library. `useUuid` owns `{ kind, raw, rawList }`; `usePrefs` owns persistence; `useCopy` owns transient copied state; `useHotkeys` binds a single `keydown` listener on `document` and ignores events originating in inputs.

### 2.6 Testing strategy

| Layer     | Tool                                   | What                                                                                                                                                                                        |
| --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit      | Vitest                                 | `uuid.ts` (version nibble + variant bits per RFC 9562, v7 monotonicity over 10k, uniqueness over 100k), `format.ts` (all 16 option combinations), `csv.ts` (RFC 4180 escaping, BOM, header) |
| Component | Vitest + Testing Library + `WxtVitest` | Copy fires with the rendered string; version switch regenerates; count clamps at 1 and 100; refresh disabled for NIL/MAX                                                                    |
| A11y      | `vitest-axe` on the rendered popup     | Zero violations                                                                                                                                                                             |
| Guard     | Custom Vitest test                     | Built popup bundle contains no `fetch(` / `XMLHttpRequest` / `WebSocket` (F-50), and no remote `<script src="http`                                                                          |
| Size      | `size-limit` in CI                     | F-60 / F-61 budgets enforced as failing checks                                                                                                                                              |

### 2.7 CI/CD

- **`ci.yml`** (PR + push to `master`): install → `lint` → `typecheck` → `test --coverage` → `build` → `size-limit` → `dependency-review`. Node 22, pnpm cache, `permissions: contents: read`, pinned action SHAs.
- **`codeql.yml`**: `javascript-typescript`, on PR + weekly cron.
- **`pages.yml`**: push to `master` touching `site/**` → upload `site/` artifact → `actions/deploy-pages`. `permissions: { pages: write, id-token: write }`.
- **`release.yml`**: tag `v*` (plus `workflow_dispatch`) → build → `pnpm zip` → GitHub Release with the ZIP → `pnpm wxt submit --chrome-zip`, guarded so forks without secrets skip cleanly.

Secrets (documented in `docs/PUBLISHING.md`): `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`. P9 adds the three Firefox secrets.

### 2.8 npm scripts

```
dev  build  zip  icons
lint  lint:fix  format  format:check  typecheck  test  test:watch  test:coverage  size
postinstall (wxt prepare)
```

`icons` runs `scripts/gen-icons.mjs`, a dependency-free PNG generator (zlib + CRC32 from
the Node stdlib) that renders `public/icon/{16,32,48,96,128}.png` from one vector
definition. An image library here would be a build-time supply-chain surface on a project
whose pitch is auditability.

P9 adds `dev:firefox`, `build:firefox`, `zip:firefox`.

---

## 3. Dependency graph

```
      ┌────────────────────────┐   ┌──────────────────────────────┐
      │ P0.2  DESIGN FREEZE    │   │ P0  repo skeleton + OSS docs │
      │  (design.md signed off)│   └───────────────┬──────────────┘
      └───────────┬────────────┘                   │
                  └──────────────┬─────────────────┘
                                 │
                    ┌────────────▼─────────────────┐
                    │ P1  vertical slice: popup    │
                    │     shows a v4 UUID + copy   │
                    └───────┬──────────────┬───────┘
                            │              │
        ┌───────────────────▼───┐   ┌──────▼──────────────────┐
        │ P2  versions+refresh  │   │ P6  CI / CodeQL / Dbot  │
        └───────────┬───────────┘   └──────────┬──────────────┘
                    │                          │
        ┌───────────▼───────────┐              │
        │ P3  format + prefs    │              │
        └───────────┬───────────┘              │
                    │                          │
        ┌───────────▼───────────┐              │
        │ P4  bulk + CSV        │              │
        └───────────┬───────────┘              │
                    │                          │
        ┌───────────▼───────────┐              │
        │ P5  polish/a11y/perf  │◀─────────────┘
        └───────────┬───────────┘
                    │
     ┌──────────────┴───────────────┐
     │                              │
┌────▼────────────────┐   ┌─────────▼──────────────┐
│ P7  landing page    │──▶│ P8  Chrome release +   │
│     + GH Pages      │   │     Web Store  v1.0.0  │
└─────────────────────┘   └─────────┬──────────────┘
                                    │
                          ┌─────────▼──────────────┐
                          │ P9  Firefox / Edge /   │
                          │     Safari      v1.1.0 │
                          └────────────────────────┘
```

Parallelisable: **P0.2 (design freeze)** runs alongside **T0.1**. **P6** can run alongside P2–P4. **P7** can start as soon as P5 produces screenshots. Everything else is serial. **P9 begins only after v1.0.0 ships** — it re-verifies P1–P5 acceptance criteria on new engines, so it must run against finished behaviour.

---

## 4. Phased task breakdown

Every task is a **vertical slice** — it ends with something observable, not a layer.

Legend: `AC` = acceptance criteria · `V` = verification steps.

---

### Phase 0 — Foundation, design freeze & documentation

**T0.1 — Scaffold WXT + React + TS + Tailwind**
_Deps: none_
Run `pnpm dlx wxt@latest init . --template react`, switch to `srcDir: 'src'`, add `@tailwindcss/vite`, strict `tsconfig`, ESLint 9 flat + Prettier, Vitest + `WxtVitest`.

- **AC** — `pnpm dev` opens Chrome with the extension loaded and a default popup. `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` all exit 0. `pnpm-lock.yaml` committed. `.gitignore` covers `.output`, `.wxt`, `node_modules`, `stats.html`.
- **V** — `pnpm i && pnpm typecheck && pnpm lint && pnpm test && pnpm build` all green. Load `.output/chrome-mv3` unpacked in Chrome; icon appears; popup opens.

**T0.2 — Design freeze**
_Deps: none (runs alongside T0.1)_
Review and sign off [`tasks/design.md`](design.md): frame, colour tokens, typography, component specs, keyboard map, states matrix, icon. Transcribe the token set into `src/assets/tailwind.css` as CSS custom properties for both themes.

- **AC** — `design.md` status flips from `proposed` to `frozen`. Every token in design.md §5 exists in the stylesheet under both themes. No component is built before this is signed off.
- **V** — All 12 dark + 12 light tokens present in `src/assets/tailwind.css`; a scratch page renders both palettes; the contrast pairs in design.md §5 are spot-checked.

**T0.3 — Promote feature, technical and design docs into `docs/`**
_Deps: T0.1, T0.2_
Write `docs/FEATURES.md` (§1), `docs/TECHNICAL.md` (§2), `docs/DESIGN.md` (from `tasks/design.md`), `docs/ARCHITECTURE.md` (component tree + data flow), `docs/PUBLISHING.md` (Chrome Web Store runbook + secret table).

- **AC** — Every F-ID in §1 appears in `docs/FEATURES.md` with a status column (`planned` / `done`). `docs/TECHNICAL.md` matches the code that exists after T0.1.
- **V** — `grep -c '^| F-' docs/FEATURES.md` equals the feature count; all internal doc links resolve.

**T0.4 — Open-source governance files**
_Deps: T0.1_
`LICENSE` (MIT, ease-my-work), `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), `CONTRIBUTING.md` (dev setup, Conventional Commits), `SECURITY.md` (no-network / no-telemetry statement, v1 node-id note, private reporting via GitHub Security Advisories), `CHANGELOG.md` (Keep a Changelog, `Unreleased`).

- **AC** — GitHub's community-standards checklist reads 100%. `SECURITY.md` states the exact permission set.
- **V** — Repo → Insights → Community Standards, every item ticked.

**T0.5 — Issue/PR templates, Dependabot, FUNDING**
_Deps: T0.1_
YAML issue forms (bug, feature), `config.yml` with a Discussions link, PR template with a checklist, `dependabot.yml` (npm weekly + github-actions weekly, minor/patch grouped).

- **AC** — Opening a new issue shows the two forms, not a blank body.
- **V** — Visit `/issues/new/choose` after push.

> ### CHECKPOINT A — human review
>
> Stack scaffolded and building, **design frozen**, docs reflect intent, governance complete. **Nothing user-facing built yet — this is the cheapest point to change either the stack or the look.**

---

### Phase 1 — Vertical slice: one UUID, one click

**T1.1 — `lib/uuid.ts` + tests**
_Deps: T0.1_
Implement `UuidKind`, `KINDS`, `IS_CONSTANT`, `generate`, `generateMany` on `uuid@14`.

- **AC** — `generate('v4')` has version nibble `4` and variant bits `10xx`; `generate('v1')` has version `1`; `generate('v7')` has version `7` and 10k sequential calls stay non-decreasing under lexicographic sort; `generate('nil')` / `('max')` return the constants; `generateMany` clamps `0 → 1` and `101 → 100`; 100k v4s are unique; the v1 node id differs across two fresh module instances (no MAC).
- **V** — `pnpm test src/lib/uuid.test.ts` — all pass.

**T1.2 — Popup renders a v4 UUID and copies it**
_Deps: T1.1, T0.2 (design frozen)_
`App.tsx` with Header + `UuidDisplay` + `ActionRow` built to design.md §3, §7.1, §7.3, §7.5; copied state per §7.4; `lib/clipboard.ts`; UUID seeded synchronously in `main.tsx` before `createRoot`.

- **AC** — Opening the popup shows a valid v4 UUID with zero interaction. Frame is exactly 360px wide _(superseded: 420px after Checkpoint C — see DESIGN.md §0)_. Clicking the display copies the exact rendered string and shows "✓ Copied" for 1200ms. `aria-live` announces the copy. No console errors or warnings. Manifest requests only `storage`.
- **V** — `pnpm dev` → click the icon → paste into an editor and diff against the on-screen value. `cat .output/chrome-mv3/manifest.json` shows `"permissions": ["storage"]`. Component test asserts `writeText` was called with the rendered string.

> ### CHECKPOINT B — human review
>
> **The core promise now works end to end.** Try it in Chrome. Confirm the popup _feels_ instant and matches the frozen design frame before anything else is added.

---

### Phase 2 — All versions + refresh

**T2.1 — `VersionTabs` with v4 / v1 / v7 / NIL / MAX**
_Deps: T1.2_
Segmented control, roving tabindex, `1`–`5` hotkeys; selection held in component state (persistence comes in P3).

- **AC** — Switching to any version immediately shows a value of that version. NIL and MAX show their constants. Tabs are fully operable by keyboard alone. `role="tablist"` semantics correct.
- **V** — Component test: click each tab → `uuid.version(rendered)` returns the expected number. Manual: keyboard-only pass, no mouse.

**T2.2 — Refresh + hotkeys**
_Deps: T2.1_
Refresh button; `R` and `Space` bound via `useHotkeys`; disabled with an explanation for NIL/MAX; `Esc` closes the popup.

- **AC** — Refresh yields a different value for v4/v1/v7 on every press. Disabled (`aria-disabled` + title) for NIL/MAX. Hotkeys do not fire while focus is inside an input.
- **V** — Component test: 20 refreshes on v4 → 20 distinct values; refresh on NIL leaves the value unchanged. Manual: type into the bulk count field and confirm `R` types an "r" instead of refreshing.

---

### Phase 3 — Formatting + persistence

**T3.1 — `lib/format.ts` + `FormatBar`**
_Deps: T2.2_
Case, hyphens and wrapper toggles; format changes re-render **without** regenerating.

- **AC** — All 16 combinations produce correct output. Toggling format never changes the underlying UUID. Copy copies the _formatted_ string.
- **V** — `pnpm test src/lib/format.test.ts` (table-driven over all combos). Component test: snapshot raw value → toggle all four controls → raw unchanged.

**T3.2 — Prefs persistence via `wxt/storage`**
_Deps: T3.1_
`lib/prefs.ts`; hydrate after mount, never before first paint.

- **AC** — Choose v7 + UPPERCASE + no hyphens, close, reopen → settings restored. First paint still shows a UUID before hydration completes.
- **V** — Manual close/reopen cycle. Test: mock `storage.getItem` with a 50 ms delay → assert the UUID element is already populated at t=0.

---

### Phase 4 — Bulk + CSV

**T4.1 — Bulk generation panel (1–100)**
_Deps: T3.2_
`BulkPanel`: count input + stepper, Generate, scrollable list with per-row copy, Copy all, Copy as JSON.

- **AC** — Count clamps to 1..100 on blur and rejects non-numerics. 100 rows render without jank. Each row respects the active format. Copy all yields exactly `count` newline-separated entries. Copy as JSON parses to an array of length `count`.
- **V** — Component test for clamping (`0`, `-5`, `101`, `abc`, `5.7`) and copy payload shape. Manual: generate 100, scroll, spot-check.

**T4.2 — CSV export**
_Deps: T4.1_
`lib/csv.ts` + download wiring, no `downloads` permission.

- **AC** — Header row is `index,uuid,version,generated_at`. Rows RFC 4180-escaped, `\r\n` endings, UTF-8 BOM present. Filename matches `uuidly-<version>-<count>-<yyyymmdd-hhmmss>.csv`. Manifest still requests only `storage`. Object URL is revoked.
- **V** — `pnpm test src/lib/csv.test.ts`. Manual: download a 100-row CSV, open in Excel and LibreOffice, confirm 101 lines and no mojibake. Re-check `manifest.json` permissions.

---

### Phase 5 — Polish, a11y, performance

**T5.1 — Theme, icons, visual finish**
_Deps: T4.2_
Black-first palette + system/manual theme toggle; `public/icon/{16,32,48,96,128}.png`; empty and error states; focus rings.

- **AC** — Contrast ≥ 4.5:1 in both themes. Icon renders crisply at 16px in the toolbar. Theme choice persists.
- **V** — Contrast check on the top six colour pairs. Visual check at 16/32/48px.

**T5.2 — A11y + performance gates**
_Deps: T5.1_
`vitest-axe` pass, `size-limit` config, the no-network bundle guard test.

- **AC** — Zero axe violations. Popup JS ≤ 60 KB gz and CSS ≤ 10 KB gz enforced as failing checks. Bundle contains no `fetch(` / `XMLHttpRequest` / `WebSocket`. Bulk-100 generate + render ≤ 50 ms measured via `performance.now()`. **Every box in design.md §13 ticked.**
- **V** — `pnpm test && pnpm size` green. Full keyboard-only run through every feature. Screen-reader smoke test (NVDA or VoiceOver).

> ### CHECKPOINT C — human review
>
> **Feature-complete Chrome extension.** Full manual pass in Chrome against design.md §13 before automation and publishing. Capture screenshots here — the landing page and the store listing both need them.

---

### Phase 6 — CI & supply-chain automation _(may run in parallel from Phase 2 onward)_

**T6.1 — `ci.yml`**
_Deps: T0.1_
lint → typecheck → test + coverage → build → size-limit → dependency-review. Pinned action SHAs, `permissions: contents: read`, pnpm cache.

- **AC** — CI runs on every PR and passes on `master`. A deliberately broken lint rule fails the run.
- **V** — Open a throwaway PR with a lint error → red. Fix → green.

**T6.2 — CodeQL + dependency review + secret scanning**
_Deps: T6.1_
`codeql.yml` (`javascript-typescript`, PR + weekly cron), `dependency-review-action` in `ci.yml`, push protection enabled.

- **AC** — CodeQL completes with zero alerts. A PR adding a known-vulnerable dependency is blocked.
- **V** — Security tab shows a completed CodeQL analysis and active secret scanning.

**T6.3 — Branch protection + status badges**
_Deps: T6.1, T6.2_
Require CI + CodeQL before merge, require a PR, no force-push to `master`. README badges for CI, CodeQL, license, version, store rating.

- **AC** — A direct push to `master` is rejected. Every README badge resolves (no broken images).
- **V** — Attempt a direct push (expect rejection). Load the README on GitHub and confirm all badges render.

---

### Phase 7 — Landing page

**T7.1 — Build `site/index.html`**
_Deps: T5.2 (needs screenshots and final copy)_
Hero + tagline, **live in-page demo** (`site/demo.js` using `crypto.randomUUID` — no build step, no npm), feature grid mapped to §1, screenshots, FAQ, privacy statement, footer with repo and license links.

- **AC** — Zero JS frameworks and zero third-party requests (no analytics, no CDN fonts). Responsive 320px → 1920px. Works with JS disabled except the demo widget, which degrades to a static example.
- **V** — Open `site/index.html` over `file://` and confirm it renders. DevTools Network tab shows same-origin requests only.

**T7.2 — SEO + Pages deployment**
_Deps: T7.1_
Meta/OG/Twitter tags, JSON-LD `SoftwareApplication`, `robots.txt`, `sitemap.xml`, `favicon.svg`, `assets/og.png`, `pages.yml` deploying `site/`.

- **AC** — Site live at the Pages URL. Lighthouse ≥ 95 across Performance, Accessibility, Best Practices, SEO. OG card previews correctly.
- **V** — `npx lighthouse <pages-url> --view`. Paste the URL into a social card debugger.

---

### Phase 8 — Chrome release & Web Store publishing

**T8.1 — `release.yml` + versioning**
_Deps: T6.3, T5.2_
Tag `v*` → build → `pnpm zip` → GitHub Release with the ZIP → `pnpm wxt submit --chrome-zip`, guarded on secret presence. Document every secret in `docs/PUBLISHING.md`.

- **AC** — A `v0.1.0-rc.1` tag produces a Release with `*-chrome.zip`. The submit step skips cleanly when secrets are absent rather than failing the run, so forks are unaffected.
- **V** — Push an RC tag on a branch, inspect the Release assets, then delete the tag and release.

**T8.2 — Chrome Web Store listing + submission**
_Deps: T8.1_
Listing copy, 1280×800 screenshots, 440×280 small tile, 128×128 icon, privacy-practices justification (single `storage` permission, no remote code, no data collection).

- **AC** — The Chrome Web Store draft passes validation. `README.md` and `site/` carry the real store URL once approved.
- **V** — Dashboard shows "In review" or "Published". Install from the store and re-run the Phase 5 manual pass against the published build.

**T8.3 — v1.0.0 release**
_Deps: T8.2_
Tag `v1.0.0`, finalise `CHANGELOG.md`, add `good first issue` labels for the backlog (v3/v5, ULID, history, context menu).

- **AC** — The `1.0.0` changelog section lists every shipped F-ID. At least three `good first issue` items exist. `docs/FEATURES.md` status column updated to `done`.
- **V** — Release page renders the changelog; the issue list shows labelled starter tasks.

> ### CHECKPOINT D — Chrome launch review
>
> **v1.0.0 ships here.** Published on the Chrome Web Store, landing page live, CI green, backlog seeded.

---

### Phase 9 — Cross-browser support (v1.1.0)

Everything here is additive. No component, hook or lib file is rewritten — WXT handles the manifest divergence, so the work is config, verification and store paperwork.

**T9.1 — Firefox build target**
_Deps: T8.3_
Add `browser_specific_settings.gecko` (`id: 'uuidly@ease-my-work.github.io'`, `strict_min_version: '109.0'`) to `wxt.config.ts`; add `dev:firefox`, `build:firefox`, `zip:firefox` scripts; activate the two fallback paths written in P1/P4 (clipboard `execCommand`, CSV `browser.tabs.create(blobUrl)`).

- **AC** — `pnpm build:firefox` succeeds and `pnpm dev:firefox` loads the extension. **Every Phase 1–5 acceptance criterion re-verified in Firefox**, including the design.md §13 checklist. Permissions still exactly `["storage"]`. Chrome build is byte-for-byte unaffected in behaviour.
- **V** — Full manual pass in Firefox. `diff` the two generated manifests and confirm the only delta is the gecko block and MV bookkeeping.

**T9.2 — Firefox in CI + release**
_Deps: T9.1, T6.1_
Add `build:firefox` + its size gate to `ci.yml`. Extend `release.yml` with `pnpm zip:firefox` (which emits the **sources ZIP** AMO requires) and `wxt submit --firefox-zip --firefox-sources-zip`. Add `CONTRIBUTING.md` reviewer instructions.

- **AC** — A tag produces `*-firefox.zip` and `*-sources.zip` on the Release. `CONTRIBUTING.md` carries the exact reviewer commands `pnpm i && pnpm zip:firefox`. Secrets `FIREFOX_EXTENSION_ID`, `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET` documented in `docs/PUBLISHING.md`.
- **V** — Push an RC tag, confirm all three ZIPs attach, delete the tag and release.

**T9.3 — AMO submission**
_Deps: T9.2_

- **AC** — AMO accepts the source ZIP and the listing. Store URL added to `README.md` and `site/`.
- **V** — Install from AMO; re-run the Phase 5 manual pass on the published build.

**T9.4 — Edge Add-ons submission**
_Deps: T8.2_
The Chrome ZIP is accepted unchanged by the Edge dashboard — this is listing paperwork, not a build.

- **AC** — Edge listing published; store URL added to `README.md` and `site/`.
- **V** — Install from Edge Add-ons and smoke-test copy + bulk CSV.

**T9.5 — v1.1.0 release**
_Deps: T9.3, T9.4_

- **AC** — Changelog documents cross-browser support. Landing page shows three store badges. `docs/FEATURES.md` notes supported browsers.
- **V** — Release page renders; all three store links resolve.

> ### CHECKPOINT E — cross-browser review
>
> Live on Chrome Web Store, Firefox Add-ons and Edge Add-ons from one codebase.
> Safari remains in the backlog — it needs an Xcode wrapper and a paid developer account, which is a different kind of work.

---

## 5. Risks

| Risk                                                        | Impact                        | Mitigation                                                                                                                                                                                                                                    |
| ----------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~React pushes the popup past the 60 KB budget~~            | —                             | **Materialised at T0.1 and resolved.** The React scaffold measured 59.63 kB gz of a 60 kB budget, so the `preact/compat` alias was taken immediately rather than at T5.2. Now 7.88 kB with a 20 kB regression tripwire in `.size-limit.json`. |
| Design churn after components are built                     | Rework across every component | Design is frozen at T0.2, **before** T1.2. Changes after Checkpoint A require an explicit plan amendment.                                                                                                                                     |
| Chrome Web Store flags clipboard behaviour                  | Review delay                  | No `clipboardWrite` permission requested; clipboard writes only inside user gestures; justification pre-written in T8.2.                                                                                                                      |
| `uuid` v1 leaking a MAC address                             | Privacy claim breaks          | uuid@14 defaults to a random node id; asserted by a test in T1.1 and stated in `SECURITY.md`.                                                                                                                                                 |
| Store secrets committed by mistake                          | Credential leak               | Secrets live only in GitHub Actions secrets; push protection + secret scanning enabled in T6.2.                                                                                                                                               |
| _(P9)_ CSV download closes the popup on some Firefox builds | Breaks F-32 on Firefox only   | Fallback path is written in P4 but only activated and verified in T9.1 — it cannot block the Chrome launch.                                                                                                                                   |
| _(P9)_ AMO rejects a bundled build without sources          | Blocks Firefox launch only    | `zip:firefox` emits the sources ZIP; exact reviewer commands land in `CONTRIBUTING.md` at T9.2.                                                                                                                                               |

---

## 6. Definition of done

### v1.0.0 — Chrome (P0–P8)

- [ ] All P0 features (§1.1, 1.2, 1.4, 1.6, 1.7, 1.9) shipped and covered by tests
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size` green locally and in CI
- [ ] Popup requests exactly one permission: `storage`
- [ ] Every box in [design.md](design.md) §13 ticked
- [ ] Zero axe violations; full keyboard-only operation
- [ ] Published on the Chrome Web Store
- [ ] Landing page live on GitHub Pages, Lighthouse ≥ 95 ×4
- [ ] GitHub community standards 100%; branch protection on; Dependabot + CodeQL active

### v1.1.0 — Cross-browser (P9)

- [ ] `pnpm build:firefox && pnpm zip:firefox` green in CI, sources ZIP attached to releases
- [ ] Every Phase 1–5 acceptance criterion re-verified in Firefox
- [ ] Published on Firefox Add-ons and Edge Add-ons
- [ ] Three store badges on the landing page and in the README
