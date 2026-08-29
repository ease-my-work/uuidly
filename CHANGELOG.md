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
- Preferences persist: the selected version and formatting are stored in
  `chrome.storage.local` and restored on the next open. They are read _after_ the first
  paint, never before it, and a choice made while storage is still loading is not
  overwritten when it arrives.

### Changed

- The popup runs on **Preact** via a `preact/compat` alias rather than React's own runtime.
  Measured at scaffold time, `react` + `react-dom` cost 59.63 kB gzipped against a 60 kB
  budget — the entire budget, before any feature existed. The alias brings that to 7.88 kB
  with no source changes. See [`docs/TECHNICAL.md`](docs/TECHNICAL.md) §6.

### Security

- The extension requests exactly one permission, `storage`, and makes no network requests.
  See [SECURITY.md](SECURITY.md).

[Unreleased]: https://github.com/ease-my-work/uuidly/commits/master
