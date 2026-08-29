# uuidly — Task List

Full detail in [plan.md](plan.md) · popup visual contract in [docs/DESIGN.md](../docs/DESIGN.md).
Each task is a vertical slice ending in something observable.

**Scope: P0–P8 are Chrome-only.** Firefox, Edge and Safari land in **P9**.
Order is top-to-bottom except **Phase 6**, which may run in parallel from Phase 2 onward.

---

## Phase 0 — Foundation, design freeze & documentation ✅

- [x] **T0.1** Scaffold WXT + TS strict + Tailwind v4 + Vitest + ESLint/Prettier — _deps: none_
  - [x] WXT 0.21.4 (MV3, Chrome), `srcDir: 'src'`, auto-imports off
  - [x] `@tailwindcss/vite` wired in `wxt.config.ts`
  - [x] `uuid@14` installed
  - [x] Scripts: `dev build zip icons lint lint:fix format typecheck test test:watch test:coverage size`
  - [x] `.gitignore` covers `.output`, `.wxt`, `node_modules`, `coverage`, `stats.html`
  - [x] Dependency-free icon generator (`scripts/gen-icons.mjs`) → `public/icon/{16,32,48,96,128}.png`
  - [x] ✅ `pnpm i && pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm size` all exit 0
  - [x] ✅ Built manifest shows exactly `"permissions": ["storage"]`
  - **Deviations from plan, both deliberate:**
    - Scaffolded by hand rather than `wxt init` — the CLI template is interactive and this
      session is not.
    - TypeScript pinned to `^5.9.3`, not the `latest` 7.x — `typescript-eslint@8` peer-caps
      at `<6.1.0`.
- [x] **T0.2** Design freeze — [docs/DESIGN.md](../docs/DESIGN.md) signed off — _deps: none_
  - [x] Frame, tokens, typography, component specs, keyboard map, states matrix approved
  - [x] All 12 semantic tokens transcribed to `src/assets/tailwind.css`, dark + light + manual override
  - [x] Exposed as Tailwind utilities via `@theme inline`
  - [x] ✅ Status changed from `proposed` to **FROZEN**; scaffold popup renders the full palette
- [x] **T0.3** `docs/` — FEATURES, TECHNICAL, DESIGN, ARCHITECTURE, PUBLISHING — _deps: T0.1, T0.2_
  - [x] ✅ Every F-ID present with a status column; internal links resolve
  - Note: `docs/` is canonical. `tasks/design.md` is now a pointer, so there is one copy to keep true.
- [x] **T0.4** `LICENSE` · `CODE_OF_CONDUCT.md` · `CONTRIBUTING.md` · `SECURITY.md` · `CHANGELOG.md` · `README.md` — _deps: T0.1_
  - [x] ✅ All GitHub community-standards files present
- [x] **T0.5** Issue forms + `config.yml` + PR template + `dependabot.yml` + `FUNDING.yml` — _deps: T0.1_
  - [x] ✅ Two YAML issue forms, blank issues disabled, security routed to private advisories

> ### ⛳ CHECKPOINT A — human review ← **you are here**
>
> Stack builds, **design frozen**, docs match intent, governance complete.
> Cheapest point to change either the stack or the look.
>
> Outstanding for a maintainer (needs repo admin, cannot be done from code):
> enable Discussions, enable secret-scanning push protection, add `good first issue` label.

---

## Phase 1 — Vertical slice: one UUID, one click

- [ ] **T1.1** `src/lib/uuid.ts` + tests — `generate` / `generateMany` for v4, v1, v7, NIL, MAX — _deps: T0.1_
  - ✅ Version nibble + variant bits correct per RFC 9562
  - ✅ v7 monotonic over 10k; 100k v4s unique; count clamps 1..100
  - ✅ v1 node id is random (no MAC address)
  - 🔎 `pnpm test src/lib/uuid.test.ts`
- [ ] **T1.2** Popup shows a v4 UUID on open and copies on click — _deps: T1.1, T0.2_
  - [ ] UUID seeded synchronously in `main.tsx` before `createRoot`
  - [ ] Header + `UuidDisplay` + `ActionRow` per DESIGN.md §3, §7.1, §7.3, §7.5
  - [ ] `lib/clipboard.ts`; copied state per DESIGN.md §7.4
  - [ ] Replaces the scaffold token-preview `App.tsx`
  - ✅ Zero clicks to see a UUID; copied string byte-matches the rendered string
  - ✅ Frame is 360px wide; no console errors; permissions still `["storage"]`
  - 🔎 `pnpm dev` → click icon → paste and diff against the on-screen value

> ### ⛳ CHECKPOINT B — human review
>
> Core promise works end to end. Confirm the popup **feels** instant and matches the frozen
> design frame before adding anything else.

---

## Phase 2 — All versions + refresh

- [ ] **T2.1** `VersionTabs` — v4 / v1 / v7 / NIL / MAX, roving tabindex, hotkeys `1`–`5` — _deps: T1.2_
  - ✅ Each tab yields a value of that version; keyboard-only operable
  - ✅ Correct `role="tablist"`; active/inactive styling per DESIGN.md §7.2
  - 🔎 Component test: `uuid.version(rendered)` per tab
- [ ] **T2.2** Refresh button + `R` / `Space` / `Esc` hotkeys — _deps: T2.1_
  - ✅ 20 refreshes → 20 distinct values on v4/v1/v7
  - ✅ Disabled with explanation for NIL/MAX; hotkeys inert while focus is in an input
  - 🔎 Component test + manual typing check in the count field

---

## Phase 3 — Formatting + persistence

- [ ] **T3.1** `lib/format.ts` + `FormatBar` — case, hyphens, wrapper — _deps: T2.2_
  - ✅ All 16 combinations correct; toggling never regenerates the value
  - ✅ Copy copies the formatted string; chips styled per DESIGN.md §7.6
  - 🔎 `pnpm test src/lib/format.test.ts` (table-driven)
- [ ] **T3.2** `lib/prefs.ts` via `wxt/storage`, hydrate after first paint — _deps: T3.1_
  - ✅ Version + format + count survive close/reopen
  - ✅ UUID is on screen before hydration resolves; no skeleton, no flash of empty
  - 🔎 Manual reopen cycle + test with a 50 ms delayed `storage.getItem`

---

## Phase 4 — Bulk + CSV

- [ ] **T4.1** `BulkPanel` — count 1–100, list with per-row copy, Copy all, Copy as JSON — _deps: T3.2_
  - ✅ Clamps `0`, `-5`, `101`, `abc`, `5.7`; 100 rows render without jank
  - ✅ Rows respect active format; Copy all = `count` lines; JSON parses to length `count`
  - ✅ List capped at 180px with internal scroll per DESIGN.md §7.7
  - 🔎 Component tests + manual 100-row scroll
- [ ] **T4.2** `lib/csv.ts` + download, no `downloads` permission — _deps: T4.1_
  - ✅ Header `index,uuid,version,generated_at`; RFC 4180 escaping; `\r\n`; UTF-8 BOM
  - ✅ Filename `uuidly-<version>-<count>-<yyyymmdd-hhmmss>.csv`; object URL revoked
  - ✅ Manifest still `["storage"]`
  - 🔎 `pnpm test src/lib/csv.test.ts`; open the CSV in Excel + LibreOffice

---

## Phase 5 — Polish, a11y, performance

- [ ] **T5.1** Theme toggle + final icon set + visual finish — _deps: T4.2_
  - [ ] Light/dark token sets with manual override, persisted
  - [ ] Icons reviewed at 16/32/48px on light and dark toolbars
  - ✅ Every colour pair in DESIGN.md §5 ≥ 4.5:1; theme choice persists
- [ ] **T5.2** `vitest-axe`, no-network bundle guard, bulk perf assertion, design AC pass — _deps: T5.1_
  - ✅ Zero axe violations
  - ✅ Size gates hold: JS ≤ 60 kB gz product budget **and** ≤ 20 kB regression tripwire; CSS ≤ 10 kB gz
  - ✅ Bundle contains no `fetch(` / `XMLHttpRequest` / `WebSocket`
  - ✅ Bulk-100 generate + render ≤ 50 ms
  - ✅ **Every box in DESIGN.md §13 ticked**
  - 🔎 `pnpm test && pnpm size`; keyboard-only pass; screen-reader smoke test

> ### ⛳ CHECKPOINT C — human review
>
> Feature-complete Chrome extension. Full manual pass against DESIGN.md §13.
> **Capture screenshots here** — the landing page and the store listing both need them.

---

## Phase 6 — CI & supply chain _(parallel from Phase 2 onward)_

- [ ] **T6.1** `.github/workflows/ci.yml` — lint, typecheck, test+coverage, build, size-limit — _deps: T0.1_
  - ✅ Runs on every PR; a deliberate lint error turns it red
- [ ] **T6.2** `codeql.yml` + `dependency-review-action` + secret-scanning push protection — _deps: T6.1_
  - ✅ CodeQL completes with zero alerts; a vulnerable-dependency PR is blocked
- [ ] **T6.3** Branch protection on `master` + README status badges — _deps: T6.1, T6.2_
  - ✅ Direct push rejected; every badge resolves (README badges are already written)

---

## Phase 7 — Landing page

- [ ] **T7.1** `site/index.html` + `styles.css` + `demo.js` (live `crypto.randomUUID` demo) — _deps: T5.2_
  - [ ] Reuses the DESIGN.md token set so site and popup read as one product
  - ✅ No frameworks, no third-party requests; responsive 320–1920px
  - ✅ Degrades gracefully without JS
  - 🔎 Open over `file://`; DevTools Network shows same-origin only
- [ ] **T7.2** SEO + `pages.yml` deploy — _deps: T7.1_
  - ✅ Live on GitHub Pages; Lighthouse ≥ 95 ×4; OG card previews correctly
  - 🔎 `npx lighthouse <pages-url> --view`

---

## Phase 8 — Chrome release & Web Store publishing

- [ ] **T8.1** `release.yml` — tag → `wxt zip` → GitHub Release → `wxt submit` (secret-guarded) — _deps: T6.3, T5.2_
  - ✅ RC tag produces `*-chrome.zip` on the Release
  - ✅ Submit skips cleanly without secrets, so forks are unaffected
  - 🔎 Push an RC tag on a branch, inspect assets, delete tag + release
- [ ] **T8.2** Chrome Web Store listing + submission — _deps: T8.1_
  - [ ] 1280×800 screenshots, 440×280 tile, 128×128 icon
  - [ ] Privacy-practices answers per [docs/PUBLISHING.md](../docs/PUBLISHING.md)
  - ✅ Draft passes validation; real store URL lands in `README.md` and `site/`
- [ ] **T8.3** Tag `v1.0.0`, finalise `CHANGELOG.md`, seed `good first issue` backlog — _deps: T8.2_
  - ✅ Changelog lists every shipped F-ID; ≥ 3 starter issues
  - ✅ `docs/FEATURES.md` statuses set to `done`

> ### ⛳ CHECKPOINT D — Chrome launch review
>
> **v1.0.0 ships here.** Published on the Chrome Web Store, landing page live, CI green.

---

## Phase 9 — Cross-browser support _(v1.1.0)_

- [ ] **T9.1** Firefox build target — _deps: T8.3_
  - [ ] `browser_specific_settings.gecko` in `wxt.config.ts`
  - [ ] `dev:firefox`, `build:firefox`, `zip:firefox` scripts
  - [ ] Activate the clipboard `execCommand` and CSV `tabs.create` fallbacks written in P1/P4
  - ✅ Every Phase 1–5 acceptance criterion re-verified in Firefox; permissions still `["storage"]`
  - 🔎 `diff` the two generated manifests — the only delta should be the gecko block
- [ ] **T9.2** Firefox in CI + release — _deps: T9.1, T6.1_
  - [ ] `zip:firefox` (emits the sources ZIP AMO requires) in `release.yml`
  - [ ] AMO reviewer commands in `CONTRIBUTING.md`; three Firefox secrets documented
  - ✅ A tag produces `*-firefox.zip` and `*-sources.zip`
- [ ] **T9.3** AMO submission — _deps: T9.2_
- [ ] **T9.4** Edge Add-ons submission (Chrome ZIP, unchanged) — _deps: T8.2_
- [ ] **T9.5** Tag `v1.1.0` — _deps: T9.3, T9.4_

> ### ⛳ CHECKPOINT E — cross-browser review
>
> Live on Chrome, Firefox and Edge from one codebase.

---

## Backlog (`good first issue` candidates)

- [ ] Safari via `wxt build -b safari` + Xcode wrapper
- [ ] UUID v3 / v5 (namespace + name input)
- [ ] UUID v6
- [ ] ULID / NanoID / short-UUID
- [ ] Generation history with pinning
- [ ] Context-menu "Insert UUID"
- [ ] Global keyboard shortcut via `chrome.commands`
- [ ] i18n via `_locales`
- [ ] UUID inspector — paste a UUID, see version, variant and timestamp
