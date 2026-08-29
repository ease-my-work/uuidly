<div align="center">

# uuidly

**Generate and copy UUIDs in one click — v1, v4, v7, NIL and MAX.**

Open the popup, a UUID is already there. Click it, it's copied. That's the whole product.

[![CI](https://github.com/ease-my-work/uuidly/actions/workflows/ci.yml/badge.svg)](https://github.com/ease-my-work/uuidly/actions/workflows/ci.yml)
[![CodeQL](https://github.com/ease-my-work/uuidly/actions/workflows/codeql.yml/badge.svg)](https://github.com/ease-my-work/uuidly/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-A78BFA.svg)](LICENSE)
[![Permissions: storage only](https://img.shields.io/badge/permissions-storage%20only-4ADE80.svg)](SECURITY.md)
[![Popup bundle](https://img.shields.io/badge/popup-17.6%20kB%20gzipped-4ADE80.svg)](docs/TECHNICAL.md#6-why-preact)

</div>

---

> **Status: in development.** Not yet on the Chrome Web Store. Follow
> [the milestones](https://github.com/ease-my-work/uuidly/milestones) or build it yourself
> in three commands — see [Development](#development).

## Why another UUID generator

Most of them make you click a button before you get anything, ship half a megabyte of
JavaScript to render one string, or ask for permission to read every page you visit.

uuidly does none of that:

- **Zero clicks.** A UUID is on screen the moment the popup paints.
- **One permission.** `storage`, to remember your preferences. Nothing else — no host
  permissions, no content scripts, no background worker.
- **Zero network requests.** Not one, ever. There is a test that enforces it.
- **17.6 kB of JavaScript**, gzipped — against a 60 kB budget.

## Features

|         |                                                                             |
| ------- | --------------------------------------------------------------------------- |
| **v4**  | Random — the one you usually want                                           |
| **v1**  | Timestamp + random node id (your MAC address is never read)                 |
| **v7**  | Unix-epoch time-ordered, so it sorts lexicographically — good database keys |
| **NIL** | `00000000-0000-0000-0000-000000000000`                                      |
| **MAX** | `ffffffff-ffff-ffff-ffff-ffffffffffff`                                      |

Plus: **bulk generation up to 100** with CSV export, formatting options (case, hyphens,
`{braces}`, `"quotes"`, `urn:uuid:`), full keyboard control, and a dark-first interface that
follows your system theme.

Full list with status: [`docs/FEATURES.md`](docs/FEATURES.md).

## Install

Coming to the Chrome Web Store. Firefox and Edge follow in v1.1.0.

Until then, build from source:

```bash
git clone https://github.com/ease-my-work/uuidly.git
cd uuidly
pnpm install && pnpm build
```

Then load `.output/chrome-mv3` at `chrome://extensions` with Developer mode on →
**Load unpacked**.

## Development

Requires **Node 22+** and **pnpm 10+**.

```bash
pnpm install   # also runs `wxt prepare`, which generates .wxt/
pnpm dev       # opens Chrome with the extension loaded, hot-reloading
```

| Command          |                                               |
| ---------------- | --------------------------------------------- |
| `pnpm dev`       | Dev server with HMR                           |
| `pnpm build`     | Production build → `.output/chrome-mv3`       |
| `pnpm zip`       | Store-ready ZIP                               |
| `pnpm test`      | Vitest (`test:watch`, `test:coverage`)        |
| `pnpm lint`      | ESLint (`lint:fix`)                           |
| `pnpm typecheck` | `tsc --noEmit`                                |
| `pnpm guard`     | Permission and no-network checks on the build |
| `pnpm size`      | Bundle budget check                           |
| `pnpm icons`     | Regenerate the PNG icon set                   |

## How it is built

[WXT](https://wxt.dev) · React API on the [Preact](https://preactjs.com) runtime ·
TypeScript strict · Tailwind CSS v4 · [`uuid@14`](https://github.com/uuidjs/uuid) · Vitest

A popup, some pure functions, and a key-value store. No background worker, no content
scripts, no network layer — every one of those would be an attack surface or a permission
request, and none is needed to put a UUID on screen.

| Document                                       |                                            |
| ---------------------------------------------- | ------------------------------------------ |
| [`docs/FEATURES.md`](docs/FEATURES.md)         | Every feature, with status                 |
| [`docs/TECHNICAL.md`](docs/TECHNICAL.md)       | Stack, modules, render path, testing       |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Layers, state, data flow                   |
| [`docs/DESIGN.md`](docs/DESIGN.md)             | The frozen visual contract for the popup   |
| [`docs/PUBLISHING.md`](docs/PUBLISHING.md)     | Release and store runbook                  |
| [`docs/MAINTAINING.md`](docs/MAINTAINING.md)   | Repo settings that cannot live in a commit |

## Privacy

uuidly stores three values in `chrome.storage.local` on your machine — your UUID version,
your formatting preferences, and your bulk count — and does nothing else with anything.

No analytics. No telemetry. No network requests. No remote code. Read
[SECURITY.md](SECURITY.md) for how each of those is actually enforced rather than merely
promised.

## Contributing

Issues and pull requests are welcome. Start with
[CONTRIBUTING.md](CONTRIBUTING.md) and the
[`good first issue`](https://github.com/ease-my-work/uuidly/labels/good%20first%20issue)
label.

## Licence

[MIT](LICENSE) © ease-my-work
