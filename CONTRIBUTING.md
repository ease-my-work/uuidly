# Contributing to uuidly

Thanks for being here. This is a small, deliberately simple project — that is a feature, and
the fastest way to get a change merged is to keep it that way.

## Quick start

```bash
git clone https://github.com/ease-my-work/uuidly.git
cd uuidly
pnpm install
pnpm dev
```

`pnpm dev` opens Chrome with the extension loaded and hot-reloading. You need **Node 22+** and
**pnpm 10+**.

`pnpm install` runs `wxt prepare`, which generates `.wxt/`. Typecheck depends on it, so install
before you typecheck in a fresh clone.

## Before you open a pull request

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size
```

All five must pass. CI runs exactly these.

## Project conventions

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) first — it is short, and it explains the
rules below rather than just stating them.

- **`lib/` is pure.** It never imports from `components/` or `hooks/`.
- **`components/` is presentational.** No direct `uuid`, storage or clipboard access — props in,
  callbacks out. That is what makes them testable without mocking the browser.
- **Colours live in one file.** `src/assets/tailwind.css` defines every token. A colour literal
  anywhere else is a bug.
- **The design is frozen.** [`docs/DESIGN.md`](docs/DESIGN.md) is the visual contract. A pull
  request that changes the look needs to update that document too, and should open an issue
  first.
- **Permissions never grow.** The manifest requests `storage` and nothing else. A change that
  adds a permission needs a very good reason and a discussion before any code.
- **No network requests.** Ever. There is a test that enforces this.
- **No new runtime dependencies** without discussing it first. There are currently two.

## Commits

[Conventional Commits](https://www.conventionalcommits.org):

```
feat: add urn:uuid wrapper format
fix: clamp bulk count when pasted rather than typed
docs: explain the preact alias
chore: bump dependencies
```

Types in use: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`.

## Tests

New behaviour needs a test. Bug fixes need a test that fails before the fix and passes after —
if you can write that test, you have understood the bug.

```bash
pnpm test          # once
pnpm test:watch    # while working
pnpm test:coverage # with coverage
```

## Good first issues

Issues labelled
[`good first issue`](https://github.com/ease-my-work/uuidly/labels/good%20first%20issue) are
scoped so you can finish them in one sitting without needing context from anywhere else. If one
turns out not to be, say so in the issue — that is useful feedback.

## Reporting bugs and requesting features

Use the [issue forms](https://github.com/ease-my-work/uuidly/issues/new/choose). For anything
security-related, do not open an issue — see [SECURITY.md](SECURITY.md).

## Code of Conduct

By participating you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Licence

Contributions are licensed under the [MIT Licence](LICENSE), the same as the project.
