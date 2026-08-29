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

> ### ⛳ CHECKPOINT A — human review ✅ passed
>
> Stack builds, **design frozen**, docs match intent, governance complete.
> Decision taken here: React runtime swapped for Preact after the scaffold measured
> 59.63 kB gz against a 60 kB budget.
>
> Outstanding for a maintainer (needs repo admin, cannot be done from code):
> enable Discussions, enable secret-scanning push protection, add `good first issue` label.

---

## Phase 1 — Vertical slice: one UUID, one click ✅

- [x] **T1.1** `src/lib/uuid.ts` + tests — `generate` / `generateMany` for v4, v1, v7, NIL, MAX — _deps: T0.1_
  - [x] ✅ Version nibble + variant bits asserted against RFC 9562 directly, not via `uuid`'s own `version()`
  - [x] ✅ v7 monotonic across 10k sequential calls; 100k v4s unique; count clamps 1..100
  - [x] ✅ v1 node id sets the multicast bit — proves no MAC address (SECURITY.md claim)
  - [x] 🔎 `pnpm test src/lib/uuid.test.ts` — 26 tests
- [x] **T1.2** Popup shows a v4 UUID on open and copies on click — _deps: T1.1, T0.2_
  - [x] UUID seeded synchronously in `main.tsx` before `createRoot`
  - [x] `Header` + `UuidDisplay` + `ActionRow` per DESIGN.md §3, §7.1, §7.3, §7.5
  - [x] `lib/clipboard.ts` (clipboard API + `execCommand` fallback), `useCopy` hook, copied state per §7.4
  - [x] Scaffold token-preview `App.tsx` replaced
  - [x] ✅ Zero clicks to see a UUID; copied string byte-matches the rendered string
  - [x] ✅ 360px frame verified in-browser, dark and light; permissions still `["storage"]`
  - [x] ✅ Bundle 10.64 kB gz — inside both the 60 kB budget and the 20 kB tripwire
  - **Scope note:** the Refresh _button_ shipped here because DESIGN.md §7.5 makes it half of
    ActionRow and a one-button row would be visibly unfinished. Its hotkeys and the
    disabled-for-NIL/MAX behaviour remain in T2.2 as planned.
  - **Deferred to T5.1:** the header theme toggle. System `prefers-color-scheme` already
    works; only the manual override is missing, and a dead toggle is worse than none.

> ### ⛳ CHECKPOINT B — human review ← **you are here**
>
> Core promise works end to end. Confirm the popup **feels** instant and matches the frozen
> design frame before adding anything else.
>
> To try it: `pnpm build`, then load `.output/chrome-mv3` unpacked at `chrome://extensions`.

---

## Phase 2 — All versions + refresh ✅

- [x] **T2.1** `VersionTabs` — v4 / v1 / v7 / NIL / MAX, roving tabindex, hotkeys `1`–`5` — _deps: T1.2_
  - [x] ✅ Each tab yields a value of that version; NIL and MAX show their constants
  - [x] ✅ `role="tablist"` with `aria-selected`, `aria-controls`, and the value card as the
        labelled `tabpanel`; exactly one tab in the tab order at a time
  - [x] ✅ Arrow keys move and select with wrap-around; `Home` / `End` jump to the ends
  - [x] ✅ Active/inactive styling per DESIGN.md §7.2
- [x] **T2.2** Hotkeys + constant handling — _deps: T2.1_
  - [x] `useHotkeys` — one `document` listener holding the whole map (DESIGN.md §8)
  - [x] ✅ `1`–`5` select · `R` refresh · `C` and `Ctrl`/`Cmd`+`C` copy · `Esc` closes
  - [x] ✅ `Space` refreshes only when no control has focus, so it still activates buttons
  - [x] ✅ `Ctrl+C` defers to the browser when text is selected
  - [x] ✅ Hotkeys inert inside inputs, textareas, selects and contenteditable
  - [x] ✅ Refresh is `aria-disabled` with an explanatory `title` on NIL/MAX and leaves the
        value untouched; `R` shakes instead of erroring (DESIGN.md §8)
  - [x] ✅ Switching kind clears the stale copy confirmation
  - **Not yet verified visually.** The browser pane became unresponsive mid-session, so tab
    styling is confirmed only by tests. Checkpoint C gates the visual pass regardless.

---

## Phase 3 — Formatting + persistence ✅

- [x] **T3.1** `lib/format.ts` + `FormatBar` — case, hyphens, wrapper — _deps: T2.2_
  - [x] ✅ All 16 combinations table-tested; toggling never regenerates the value
  - [x] ✅ `urn:uuid:` prefix stays lowercase even when the UUID is uppercased (RFC 9562 §4)
  - [x] ✅ Wrapper delimiters are never swept up by the case change
  - [x] ✅ Copy copies the **formatted** string; chips carry `aria-pressed` and spoken labels
  - [x] ✅ Changing a chip clears the copy confirmation — the clipboard is now stale
- [x] **T3.2** `lib/prefs.ts` via `wxt/utils/storage`, hydrate after first paint — _deps: T3.1_
  - [x] ✅ Version and format survive close/reopen (count lands with the field in T4.1)
  - [x] ✅ A UUID is on screen before storage answers — tested against a deliberately
        unresolved `getValue`
  - [x] ✅ A choice made while storage is still loading is **not** overwritten when it
        arrives; `touched` guards the write and `raw === initialUuid` guards the regenerate
  - **Bundle note:** adding storage took the popup from 11.65 → 15.48 kB gz. Still inside
    the 20 kB tripwire, but that is now the binding constraint rather than the 60 kB budget.

---

## Phase 4 — Bulk + CSV ✅

- [x] **T4.1** `BulkPanel` — count 1–100, list with per-row copy, Copy all, Copy as JSON — _deps: T3.2_
  - [x] ✅ Clamps `0`, `-5`, `101`, `9999`, `abc`, empty and `5.7` (truncates, not rounds)
  - [x] ✅ Commits on blur **and** Enter; the field flashes only when a value was corrected
  - [x] ✅ 100 rows render; rows respect the active format and reformat without regenerating
  - [x] ✅ Copy all = `count` lines; Copy JSON parses to an array of length `count`
  - [x] ✅ Bulk actions disabled until something exists; count persists via `countPref`
  - [x] ✅ `B` toggles the panel; list capped at 180px with internal scroll per DESIGN.md §7.7
  - [x] ✅ Row copy button is hidden until hover but never hidden from the keyboard
- [x] **T4.2** `lib/csv.ts` + download, no `downloads` permission — _deps: T4.1_
  - [x] ✅ Header `index,uuid,version,generated_at`; RFC 4180 quoting and doubled quotes;
        `\r\n` throughout with a trailing newline; UTF-8 BOM on the blob
  - [x] ✅ A `"quoted"` UUID from the format wrapper survives without breaking the columns
  - [x] ✅ Filename `uuidly-<version>-<count>-<yyyymmdd-hhmmss>.csv`, stamped in UTC so it
        agrees with the `generated_at` column
  - [x] ✅ Object URL revoked on the next tick, not synchronously
  - [x] ✅ A blocked download reports itself and points at Copy all rather than throwing
  - [x] ✅ Manifest still `["storage"]` — no `downloads` permission
  - **Not yet done:** opening the CSV in Excel and LibreOffice. Encoding and escaping are
    asserted in tests; the spreadsheet round-trip is part of the Checkpoint C manual pass.
  - **Bundle:** 17.26 kB gz. Inside the 20 kB tripwire, with 2.74 kB of headroom for Phase 5.

---

## Phase 5 — Polish, a11y, performance ✅ _(automated half)_

- [x] **T5.1** Theme toggle + visual finish — _deps: T4.2_
  - [x] Three-state control: system → light → dark. `system` removes `data-theme` entirely
        so `prefers-color-scheme` stays in charge and the popup tracks the OS live
  - [x] ✅ Choice persists; the accessible name carries the state, since one glyph cannot
        distinguish three
  - [ ] Icons reviewed at 16/32/48px on light and dark toolbars — **Checkpoint C**
  - [ ] Colour pairs measured in a real browser — **Checkpoint C**
- [x] **T5.2** Accessibility, guard and performance gates — _deps: T5.1_
  - [x] ✅ Zero axe violations across five states: open, bulk expanded, bulk populated,
        constant selected, and mid-copy with the live region filled
  - [x] ✅ Every button, the count field and the slider have accessible names
  - [x] ✅ Size gates hold: 17.24 kB gz JS (60 kB budget, 20 kB tripwire), 4.37 kB gz CSS
  - [x] ✅ `pnpm guard` enforces the permission set and the no-network claim on the build
  - [x] ✅ Bulk-100 generate + format + CSV inside 50 ms, plus a linear-growth shape check
  - **Deviation:** the no-network check is `scripts/check-bundle.mjs` run as `pnpm guard`,
    not a Vitest test. A unit test over build output either skips silently when `.output`
    is stale — worse than no check — or makes `pnpm test` depend on having built first.
    CI will run it straight after `pnpm build`.
  - **Found and fixed:** Vite's modulepreload polyfill put a real `fetch(` in the bundle.
    Chrome MV3 supports modulepreload natively, so it is now disabled rather than
    allowlisted. The guard's very first run caught it.
  - **Also fixed:** the guard originally scanned JavaScript for bare URLs and flagged
    documentation links inside dependency error messages. A string in a thrown error
    cannot load anything, so it now checks `src`/`href` in markup, where the risk is.

> ### ⛳ CHECKPOINT C — human review ← **you are here**
>
> Feature-complete Chrome extension, and everything checkable automatically is checked.
> What remains genuinely needs a human at a real browser:
>
> - [ ] Every box in [DESIGN.md §13](../docs/DESIGN.md) — frame sizes, contrast in both
>       themes, focus rings, `prefers-reduced-motion`
> - [ ] Icon legibility at 16px on a light **and** a dark toolbar
> - [ ] F-62: first UUID visible ≤ 100 ms after clicking the icon
> - [ ] F-63: the _render_ half of bulk-100 — only the computation is asserted
> - [ ] Open an exported CSV in Excel **and** LibreOffice: 101 lines, no mojibake
> - [ ] Keyboard-only pass with the mouse unplugged; screen-reader smoke test
> - [ ] **Capture screenshots** — the landing page and the store listing both need them
>
> `pnpm build`, then load `.output/chrome-mv3` unpacked at `chrome://extensions`.

### Post-Checkpoint-C UI revisions ✅

Raised from the first real look at the popup in a browser. All shipped, all documented in
[DESIGN.md §0](../docs/DESIGN.md); the automated gates were re-run green after each.

- [x] **Single-line UUID.** Frame 360px → 420px; value at 13.5px; long formats scroll
      sideways rather than wrapping or truncating.
- [x] **Copy and Refresh inline as icons**; `ActionRow` deleted. The copy target narrowed to
      the value alone — a `role="button"` card wrapping real buttons is nested-interactive.
- [x] **All hint text removed**; card sized to its single row; 12px gap added below it so it
      no longer sits flush against the FormatBar rule.
- [x] **GitHub mark replaces the "About" link**, with an accessible name on both header
      controls.
- Net: ~330px → ~214px tall. 183 tests, axe still clean, 17.61 kB gz.
- **Not possible, asked and answered:** rounding the popup's outer corners. Chrome draws
  that frame and its background is not transparent, so `border-radius` on `body` only
  reveals the window background in the corners.

---

## Phase 6 — CI & supply chain ✅ _(code complete; settings await a maintainer)_

- [x] **T6.1** `.github/workflows/ci.yml` — _deps: T0.1_
  - [x] `lint` → `format:check` → `typecheck` → `test:coverage` → `build` → `guard` → `size`
  - [x] `pnpm install --frozen-lockfile` — fails rather than silently resolving a different
        tree than the one that was reviewed
  - [x] Coverage floor: 90% statements/lines, 85% branches (currently 97/99/93)
  - [x] `concurrency` cancels superseded runs; `permissions: contents: read` at the top
  - [x] `@vitest/coverage-v8` installed — `test:coverage` would have failed in CI without it
- [x] **T6.2** `codeql.yml` + dependency review — _deps: T6.1_
  - [x] CodeQL `javascript-typescript` with `security-extended`, on push, PR and a weekly cron
  - [x] `dependency-review-action` on PRs: fails at moderate severity, denies copyleft licences
  - [x] `security-events: write` scoped to the CodeQL job alone, nothing wider
- [x] **T6.3** Pinned actions + maintainer checklist — _deps: T6.1, T6.2_
  - [x] Every `uses:` pinned to a 40-character commit SHA with the tag in a trailing comment.
        A tag can be repointed at different code by anyone who can push to that action's
        repository; a SHA cannot. Dependabot turns updates into reviewable PRs
  - [x] README CI and CodeQL badges now have workflows to resolve against
  - [ ] **Branch protection, secret-scanning push protection, Discussions, labels** — needs
        repo admin, written up as a checklist in
        [docs/MAINTAINING.md](../docs/MAINTAINING.md)
  - [ ] **Verify red-then-green:** open a throwaway PR with a lint error, confirm CI fails,
        fix, confirm it passes. Needs a push, so it is yours to run

---

## Phase 7 — Landing page ✅ _(deploy and Lighthouse await a push)_

- [x] **T7.1** `site/index.html` + `styles.css` + `demo.js` — _deps: T5.2_
  - [x] Same token set as the extension, so the page and the product read as one thing
  - [x] ✅ No frameworks and no third-party requests — asserted by a test, not just intended
  - [x] ✅ Responsive from 320px; hero collapses to one column below 900px
  - **Screenshots were the stated dependency, and are no longer one.** The hero is a
    working replica of the popup rather than a picture: it generates real UUIDs, cannot go
    stale when the popup changes, and lets a visitor try the thing before installing it.
    Store-listing screenshots are still needed for T8.2.
- [x] **T7.2** SEO + `pages.yml` — _deps: T7.1_
  - [x] Canonical, OG and Twitter tags, JSON-LD `SoftwareApplication`, `robots.txt`,
        `sitemap.xml`, SVG favicon
  - [x] `og.png` generated by `pnpm og` from the same dependency-free PNG encoder as the
        icons, refactored into `scripts/lib/png.mjs`. Deliberately typeless — rasterising
        text without a font library is not worth a font file, and the mark cannot go stale
        when the copy changes
  - [x] `pages.yml` deploys `site/` on push, SHA-pinned, `cancel-in-progress: false`
        because a half-applied deploy is worse than a queued one
  - [ ] **Live URL and Lighthouse ≥ 95 ×4** — needs the push and Pages enabled
        (see [docs/MAINTAINING.md](../docs/MAINTAINING.md))
  - [ ] **Real store URLs** replace the "coming soon" note after T8.2

**Found by writing tests for the demo:** the page's v7 was not monotonic. Values generated
inside the same millisecond differed only in random bits, so a burst did not sort — which is
the entire reason to pick v7, and the page claims it. Fixed with an RFC 9562 §6.2 counter in
`rand_a`. The extension was never affected; `uuid@14` already does this.

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
