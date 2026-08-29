# uuidly — Feature List

Status legend: `planned` · `in progress` · `done`
Priority: **P0** ships in v1.0.0 · **P1** ships in v1.0.0 if it fits · **P9** ships in v1.1.0

Companion documents: [TECHNICAL.md](TECHNICAL.md) · [DESIGN.md](DESIGN.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [PUBLISHING.md](PUBLISHING.md)

---

## Generation

| ID   | Feature                                                                     | Priority | Status   |
| ---- | --------------------------------------------------------------------------- | -------- | -------- |
| F-01 | **UUID v4** — random. Default on first install                              | P0       | **done** |
| F-02 | **UUID v1** — timestamp + random node id (no MAC address is read)           | P0       | **done** |
| F-03 | **UUID v7** — Unix-epoch time-ordered, lexicographically sortable           | P0       | **done** |
| F-04 | **NIL UUID** — `00000000-0000-0000-0000-000000000000`                       | P0       | **done** |
| F-05 | **MAX UUID** — `ffffffff-ffff-ffff-ffff-ffffffffffff`                       | P0       | **done** |
| F-06 | **Pre-generated on open** — a UUID is on screen at first paint, zero clicks | P0       | **done** |
| F-07 | **Refresh** — button plus `R` / `Space`; disabled for the two constants     | P0       | **done** |

## Copy

| ID   | Feature                                                                       | Priority | Status   |
| ---- | ----------------------------------------------------------------------------- | -------- | -------- |
| F-10 | **Click-to-copy** — the whole value display is the copy target                | P0       | **done** |
| F-11 | **Copy feedback** — in-place "✓ Copied" for 1200ms, announced via `aria-live` | P0       | **done** |
| F-12 | **Keyboard copy** — `C` or `Ctrl`/`Cmd`+`C`                                   | P0       | **done** |
| F-13 | **Copy all** — newline-joined list, bulk mode                                 | P0       | planned  |
| F-14 | **Copy as JSON** — `["…","…"]`, bulk mode                                     | P1       | planned  |

## Formatting

| ID   | Feature                                                                    | Priority | Status  |
| ---- | -------------------------------------------------------------------------- | -------- | ------- |
| F-20 | **Case toggle** — lowercase (default) / UPPERCASE                          | P1       | planned |
| F-21 | **Hyphens toggle** — hyphenated (default) / bare                           | P1       | planned |
| F-22 | **Wrapper** — none / `{braces}` / `"quotes"` / `urn:uuid:`                 | P1       | planned |
| F-23 | **Live preview** — format changes re-render without regenerating the value | P1       | planned |

## Bulk

| ID   | Feature                                                         | Priority | Status  |
| ---- | --------------------------------------------------------------- | -------- | ------- |
| F-30 | **Count 1–100** — validated and clamped                         | P0       | planned |
| F-31 | **Bulk list** — scrollable, per-row copy                        | P0       | planned |
| F-32 | **CSV download** — `index,uuid,version,generated_at`            | P0       | planned |
| F-33 | **Filename** — `uuidly-<version>-<count>-<yyyymmdd-hhmmss>.csv` | P0       | planned |
| F-34 | **No `downloads` permission** — blob URL + `<a download>`       | P0       | planned |

## Persistence & UX

| ID   | Feature                                                                | Priority | Status                          |
| ---- | ---------------------------------------------------------------------- | -------- | ------------------------------- |
| F-40 | **Remembers version, format and count** across sessions                | P1       | planned                         |
| F-41 | **Non-blocking hydration** — never awaits storage before first paint   | P1       | planned                         |
| F-42 | **Dark-first theme** — follows `prefers-color-scheme`, manual override | P1       | planned                         |
| F-43 | **Full keyboard nav** — `1`–`5`, `R`, `C`, `B`, `Esc`                  | P1       | tabs, R, C, Esc done; B in T4.1 |
| F-44 | **WCAG 2.1 AA** — contrast ≥ 4.5:1, labelled controls, live regions    | P1       | planned                         |

## Privacy & trust

| ID   | Feature                                                                              | Priority | Status   |
| ---- | ------------------------------------------------------------------------------------ | -------- | -------- |
| F-50 | **Zero network** — enforced by a test asserting the built bundle has no network APIs | P0       | planned  |
| F-51 | **No analytics or telemetry**                                                        | P0       | planned  |
| F-52 | **One permission: `storage`**                                                        | P0       | **done** |
| F-53 | **Works fully offline**                                                              | P0       | planned  |

## Performance

| ID   | Budget                                                | Priority | Status                                               |
| ---- | ----------------------------------------------------- | -------- | ---------------------------------------------------- |
| F-60 | Popup JS ≤ 60 kB gzipped                              | P0       | **done** — 7.88 kB, with a 20 kB regression tripwire |
| F-61 | Popup CSS ≤ 10 kB gzipped                             | P0       | **done** — 3.52 kB                                   |
| F-62 | First UUID visible ≤ 100 ms after the icon is clicked | P0       | planned                                              |
| F-63 | Bulk 100 generate + render ≤ 50 ms                    | P0       | planned                                              |

## Landing page

| ID   | Feature                                                            | Priority | Status  |
| ---- | ------------------------------------------------------------------ | -------- | ------- |
| F-70 | Single page: hero, live demo, feature grid, screenshots, FAQ       | P1       | planned |
| F-71 | Chrome Web Store install button (Firefox + Edge badges in P9)      | P1       | planned |
| F-72 | SEO — meta, OG/Twitter cards, JSON-LD, `sitemap.xml`, `robots.txt` | P1       | planned |
| F-73 | Lighthouse ≥ 95 on all four categories                             | P1       | planned |
| F-74 | Deployed to GitHub Pages by Action                                 | P1       | planned |

## Open-source infrastructure

| ID   | Feature                                                            | Priority | Status   |
| ---- | ------------------------------------------------------------------ | -------- | -------- |
| F-80 | `README.md` — badges, screenshot, install, dev setup, architecture | P0       | **done** |
| F-81 | `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`  | P0       | **done** |
| F-82 | Issue forms, PR template, `config.yml`                             | P0       | **done** |
| F-83 | CI — lint, typecheck, test, build, size gate                       | P0       | planned  |
| F-84 | CodeQL, dependency review, Dependabot                              | P0       | planned  |
| F-85 | Release workflow — tag → zip → Release → Web Store submit          | P0       | planned  |
| F-86 | `CHANGELOG.md`, Conventional Commits, SemVer                       | P0       | **done** |
| F-87 | Pinned action SHAs, least-privilege workflow permissions           | P0       | planned  |

---

## Deferred to v1.1.0 (P9)

Firefox build and AMO submission · Edge Add-ons submission.

## Backlog

Safari (needs an Xcode wrapper) · UUID v3/v5 (namespace + name) · UUID v6 · ULID / NanoID ·
generation history with pinning · context-menu "Insert UUID" · global keyboard shortcut ·
i18n via `_locales` · UUID inspector (paste a UUID → version, variant, timestamp).

Issues labelled [`good first issue`](https://github.com/ease-my-work/uuidly/labels/good%20first%20issue)
are the best place to start.
