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

### Changed

- The popup runs on **Preact** via a `preact/compat` alias rather than React's own runtime.
  Measured at scaffold time, `react` + `react-dom` cost 59.63 kB gzipped against a 60 kB
  budget — the entire budget, before any feature existed. The alias brings that to 7.88 kB
  with no source changes. See [`docs/TECHNICAL.md`](docs/TECHNICAL.md) §6.

### Security

- The extension requests exactly one permission, `storage`, and makes no network requests.
  See [SECURITY.md](SECURITY.md).

[Unreleased]: https://github.com/ease-my-work/uuidly/commits/master
