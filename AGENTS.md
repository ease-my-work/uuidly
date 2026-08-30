# AGENTS.md

Working notes for AI coding agents. Human-facing docs live in [README.md](README.md),
[CONTRIBUTING.md](CONTRIBUTING.md) and [docs/](docs/) — this file covers what those documents
assume you already know, and the decisions that look wrong until you know why they were made.

## What this repository is

Two deliverables in one repo:

1. **A Chrome extension** (Manifest V3, built with [WXT](https://wxt.dev)) that generates UUID
   v1, v4, v7, NIL and MAX, copies with one click, and exports up to 100 as CSV. Source in
   `src/`.
2. **A one-page static site** in `site/`, published to GitHub Pages. It hosts the landing page
   and the privacy policy that the Chrome Web Store listing links to.

Chrome only for v1.0.0. Firefox and Edge are Phase 9, after release.

## Commands

```
pnpm dev            # WXT dev server, loads the extension in Chrome
pnpm build          # production build to .output/chrome-mv3
pnpm test           # vitest run — does NOT typecheck
pnpm typecheck      # tsc --noEmit — run this too, see below
pnpm lint
pnpm format:check
pnpm guard          # asserts the built bundle's permissions and no-network claims
pnpm size           # bundle budgets
pnpm zip            # store-ready ZIP
```

`pnpm guard` and `pnpm size` both read `.output/`, so run `pnpm build` first.

Node >= 22, pnpm 10.33.0. Asset generators (`pnpm icons`, `promo`, `og`, `screenshots`) write
into `public/icon/` and `store/`; regenerate rather than hand-editing the PNGs.

**Vitest does not run `tsc`.** A green test run is not evidence that the code compiles — a
narrowing bug in `src/lib/csv.ts` passed every test and was caught only by `pnpm typecheck`.
Run both.

## Constraints that look like mistakes

These have been decided and measured. Changing one is a real decision, not a cleanup.

- **`preact/compat`, not React.** `wxt.config.ts` aliases `react` → `preact/compat`. Real
  react+react-dom measured 59.63 kB gzipped against the 60 kB budget — the entire budget before
  any feature existed. Preact is 7.88 kB for identical source. Write ordinary React: same JSX,
  same hooks, `@testing-library/react` works unchanged.
- **`.size-limit.json` carries a 20 kB tripwire** below the 60 kB product budget. It exists to
  fail loudly if the alias is ever dropped, which would otherwise pass silently at 59 kB.
- **`imports: false`** in `wxt.config.ts`. WXT's auto-imports are off on purpose; import every
  symbol explicitly.
- **TypeScript is pinned `^5.9.3`.** `typescript-eslint@8` caps its peer at `<6.1.0`. Bumping to
  TS 7 breaks lint. Bump both together or not at all.
- **`modulePreload: { polyfill: false }`.** Vite's polyfill calls `fetch()`, which is the only
  network call that ever appeared in the bundle, and `pnpm guard` rejects it.
- **`permissions: ['storage']` is the whole list.** Adding a permission fails
  `tests/store-listing.test.ts`, which ties the manifest to the published justification. That
  failure is the feature. If a permission is genuinely needed, update the listing copy in the
  same commit.
- **CSV download uses a blob and an anchor**, not the `downloads` permission — see
  `src/lib/csv.ts`.

## Layout

```
src/lib/          pure logic, no DOM: uuid, format, csv, clipboard, prefs
src/hooks/        useCopy, useHotkeys, usePrefs, useTheme
src/components/   Header, ThemeToggle, VersionTabs, UuidDisplay, FormatBar, BulkPanel, icons
src/entrypoints/popup/   index.html, main.tsx, App.tsx
tests/            cross-cutting tests (site, store listing); unit tests sit beside their source
scripts/          asset generation and the bundle guard, plain .mjs, no build step
docs/             canonical documentation
tasks/            plan and checklist, a historical record — see below
```

`src/lib/uuid.ts` is the only file that imports the `uuid` package. Keep it that way; it is
where version semantics and bulk limits live.

`src/entrypoints/popup/main.tsx` generates the first UUID **synchronously before
`createRoot`**, so the popup paints with a value already in it. Do not move that into an effect.

## Documentation rules

- **`docs/DESIGN.md` is frozen.** It is a visual contract with acceptance criteria. Post-freeze
  changes go in its §0 Amendments table with a reason — do not silently rewrite the body.
- **`tasks/plan.md` and `tasks/todo.md` are a historical record.** Per-phase notes and
  acceptance criteria are written as of when they happened. Correct them only where they
  describe current state.
- **Three documents state how many values are stored**: `SECURITY.md`, `site/privacy.html` and
  `docs/STORE-LISTING.md`. `tests/store-listing.test.ts` reads the `defineItem` calls in
  `src/lib/prefs.ts` and fails if the count disagrees. It exists because those docs said "three"
  for a while after a fourth was added — a claim submitted to Google.

There are currently four: `local:kind`, `local:format`, `local:count`, `local:theme`.

## Testing notes

Learned the hard way; each of these cost a debugging session.

- Call `fakeBrowser.reset()` in `beforeEach` of every popup test. Preferences persist across
  tests otherwise.
- Install a clipboard stub **after** `userEvent.setup()`, never before — `userEvent` installs
  its own and overwrites yours.
- Assert copy state via `data-state` on the copy button, not by matching hint text.
- The copy target in `UuidDisplay` is the value element alone, not the card. A `role="button"`
  card wrapping real buttons is nested-interactive and axe fails it.
- axe cannot check contrast in jsdom (no layout engine). Contrast pairs are specified in
  `docs/DESIGN.md` §5 and verified in a real browser.
- `site/demo.js` reimplements v7 for the landing page and needs its own monotonicity test. Its
  counter was wrong once — 300 UUIDs generated in one millisecond did not sort. The extension
  was never affected because `uuid@14` handles it, which is exactly why the copy needs testing.

## Release

Tags drive `.github/workflows/release.yml`. The tag must match `package.json`; `-alpha.N`,
`-beta.N` and `-rc.N` suffixes are accepted against the base version and are marked prerelease
and never submitted to the store. `package.json` never carries the suffix — Chrome manifest
versions are dot-separated integers.

All GitHub Actions are **SHA-pinned** with the version in a trailing comment. Dependabot updates
them; keep the comment accurate when editing by hand.

## Environment

Primary development is on **Windows with PowerShell 5.1**, which has bitten this repo before:

- Bash heredocs do not work in PowerShell. Use the Write tool, or the Bash tool explicitly.
- `git commit -m` with a multi-line message gets re-parsed and mangled. Use `git commit -F`.
- Do not regex-rewrite UTF-8 files from PowerShell 5.1 — it corrupts non-ASCII characters.

Prettier owns formatting, including markdown tables and list indentation. Nested list items need
2-space indents; wider indents get flattened, and table padding shifts when a neighbouring row
changes. Assert on table content with whitespace-tolerant regexes, never exact strings.

## Working style

- Branch and open a PR. Do not commit to `master`.
- Conventional Commits — they drive the changelog.
- Measure before deciding. The Preact choice, the `fetch()` in the bundle, and the v7 bug were
  all found by measuring rather than reasoning about what should be true.
- When a document and the code disagree, find out which one is wrong before editing either.
