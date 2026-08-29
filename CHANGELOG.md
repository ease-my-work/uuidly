# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffold: WXT 0.21 (Manifest V3, Chrome), TypeScript 5.9 strict, Tailwind CSS v4,
  Vitest 4, ESLint 10 flat config, Prettier, size-limit.
- Frozen design specification for the popup — see [`docs/DESIGN.md`](docs/DESIGN.md).
- Design token set in `src/assets/tailwind.css`: twelve semantic colours, dark-first with a
  light override and a manual theme override.
- Dependency-free icon generator (`scripts/gen-icons.mjs`, `pnpm icons`) producing the full
  PNG icon set from one vector definition.
- Documentation: features, technical implementation, architecture and publishing runbook.
- Open-source governance: licence, code of conduct, contributing guide, security policy.
- `lib/uuid.ts` — generation for v4, v1, v7, NIL and MAX behind a single module, with
  bulk generation clamped to 1–100. Tested against RFC 9562 directly rather than against
  the `uuid` package's own reporting: version and variant bits, v7 monotonicity across
  10,000 sequential calls, uniqueness across 100,000, and the multicast bit that proves v1
  uses a random node id rather than a MAC address.
- Popup: a v4 UUID is generated synchronously before the React root is created, so the
  first paint already shows a value. Click the display — or the Copy button, or press
  Enter on it — to copy exactly the string on screen, with in-place confirmation and an
  `aria-live` announcement. Refresh replaces the value and clears the stale confirmation.
- Version tabs for v4, v1, v7, NIL and MAX, implemented as a proper `tablist` with roving
  tabindex, arrow-key navigation with wrap-around, and `Home` / `End`.
- Keyboard map (`useHotkeys`): `1`–`5` select a version, `R` refreshes, `C` and
  `Ctrl`/`Cmd`+`C` copy, `Esc` closes. `Space` refreshes only when no control has focus, so
  it still activates buttons, and `Ctrl+C` defers to the browser when text is selected.
  Shortcuts are inert while typing in a field.
- NIL and MAX are treated as the constants they are: Refresh is `aria-disabled` with an
  explanation and shakes rather than pretending to do something.
- Formatting options: uppercase, hyphens, and a wrapper that cycles through none,
  `{braces}`, `"quotes"` and `urn:uuid:`. Changing one re-renders the value in place and
  never regenerates it, and what reaches the clipboard is exactly the formatted string on
  screen. The `urn:uuid:` prefix stays lowercase even when the UUID is uppercased, per
  RFC 9562 §4.
- Bulk generation of 1–100 UUIDs, with a per-row copy button, Copy all as newline-separated
  text, and Copy JSON. The count is clamped rather than rejected — `0`, `-5`, `101`, `abc`
  and an empty field all resolve to something sensible, and `5.7` truncates to 5 because a
  stray keystroke should not round your request up.
- CSV export with `index,uuid,version,generated_at`. RFC 4180 throughout, which matters
  here rather than theoretically: the `"quotes"` format wrapper produces a field that naive
  joining would corrupt. A UTF-8 BOM is written so Excel reads the file as UTF-8, and the
  filename is stamped in UTC so it agrees with the `generated_at` column.
- The download uses a blob URL and a synthetic anchor click, so it needs no `downloads`
  permission. If a browser blocks it, the panel says so and points at Copy all.
- `B` toggles the bulk panel.
- Theme control cycling system, light and dark. `system` sets no attribute at all, leaving
  `prefers-color-scheme` in charge so the popup follows the OS live rather than
  snapshotting it at open. The choice persists.
- `pnpm guard` — a build-time check that the manifest requests exactly `storage`, that
  there are no host permissions or content scripts, that no network API appears anywhere
  in the bundle, and that no page loads a remote resource. The promises in SECURITY.md now
  fail the build if they stop being true.
- Accessibility tests with axe across five states, and a performance assertion for
  bulk-100 generation, formatting and CSV building.
- Preferences persist: the selected version and formatting are stored in
  `chrome.storage.local` and restored on the next open. They are read _after_ the first
  paint, never before it, and a choice made while storage is still loading is not
  overwritten when it arrives.

### Changed

- The popup runs on **Preact** via a `preact/compat` alias rather than React's own runtime.
  Measured at scaffold time, `react` + `react-dom` cost 59.63 kB gzipped against a 60 kB
  budget — the entire budget, before any feature existed. The alias brings that to 7.88 kB
  with no source changes. See [`docs/TECHNICAL.md`](docs/TECHNICAL.md) §6.

- Vite's modulepreload polyfill is disabled. It called `fetch()` on preload hrefs, which
  made it the only network API in the bundle; Chrome MV3 supports modulepreload natively,
  so the polyfill was dead weight as well as a false positive waiting to happen.

### Security

- The extension requests exactly one permission, `storage`, and makes no network requests.
  Both are now enforced by `pnpm guard` against the built output rather than asserted in
  prose. See [SECURITY.md](SECURITY.md).

[Unreleased]: https://github.com/ease-my-work/uuidly/commits/master
