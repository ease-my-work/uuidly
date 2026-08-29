# uuidly — Architecture

Companion documents: [TECHNICAL.md](TECHNICAL.md) · [DESIGN.md](DESIGN.md) · [FEATURES.md](FEATURES.md)

---

## Shape of the thing

uuidly is a **popup-only** extension. There is no background service worker, no content script,
no options page and no network layer. One HTML entrypoint, some pure functions, and a key-value
store for preferences.

That is deliberate: every one of those pieces would be an attack surface, a permission request,
or a store-review question, and none of them is needed to put a UUID on screen.

---

## Repository layout

```
uuidly/
├── .github/            workflows, issue forms, PR template, Dependabot
├── docs/               FEATURES · TECHNICAL · DESIGN · ARCHITECTURE · PUBLISHING
├── public/icon/        generated PNGs (source: scripts/gen-icons.mjs)
├── scripts/            gen-icons.mjs
├── site/               landing page, deployed to GitHub Pages
├── src/
│   ├── assets/         tailwind.css — design tokens, the single source of colour
│   ├── components/     presentational, no direct storage or uuid access
│   ├── entrypoints/
│   │   └── popup/      index.html · main.tsx · App.tsx
│   ├── hooks/          useUuid · usePrefs · useCopy · useHotkeys
│   └── lib/            uuid · format · csv · clipboard · prefs
├── tasks/              planning history (plan, todo)
└── wxt.config.ts
```

---

## Layers

```
        ┌───────────────────────────────────────────────┐
        │  entrypoints/popup/main.tsx                   │
        │  generates the first UUID SYNCHRONOUSLY,      │
        │  then mounts. First paint is never empty.     │
        └────────────────────┬──────────────────────────┘
                             │
        ┌────────────────────▼──────────────────────────┐
        │  App.tsx — owns all state, passes it down     │
        └───┬──────────┬──────────┬──────────┬──────────┘
            │          │          │          │
      ┌─────▼────┐┌────▼─────┐┌───▼──────┐┌──▼─────────┐
      │VersionTabs││UuidDisplay││FormatBar ││ BulkPanel  │   components/
      └─────┬────┘└────┬─────┘└───┬──────┘└──┬─────────┘   (presentational)
            │          │          │          │
        ┌───▼──────────▼──────────▼──────────▼──────────┐
        │  hooks/  useUuid · usePrefs · useCopy ·       │
        │          useHotkeys                           │
        └───┬──────────┬──────────┬──────────┬──────────┘
            │          │          │          │
      ┌─────▼────┐┌────▼─────┐┌───▼──────┐┌──▼─────────┐
      │ lib/uuid ││lib/format││ lib/csv  ││lib/clipboard│  pure / IO-edge
      └─────┬────┘└──────────┘└──────────┘└────────────┘
            │
      ┌─────▼──────┐        ┌──────────────┐
      │  uuid@14   │        │  lib/prefs   │──▶ wxt/storage (local:)
      └────────────┘        └──────────────┘
```

**Rules that keep this honest:**

- `lib/` is pure or IO-edge only. It never imports from `components/` or `hooks/`.
- `components/` never touches `uuid`, `storage` or the clipboard directly — it takes props and
  emits callbacks. That is what makes it testable without mocking the browser.
- `lib/uuid.ts` is the **only** file that imports the `uuid` package. Swapping the generator is a
  one-file change.
- `src/assets/tailwind.css` is the **only** place a colour literal may appear.

---

## State

All state lives in `App`. There is no state library, no context, and no reducer — the tree is
four levels deep and the state is four fields.

| Hook         | Owns                                                              |
| ------------ | ----------------------------------------------------------------- |
| `useUuid`    | `{ kind, raw, rawList }` — the current value and the bulk list    |
| `usePrefs`   | reads and writes `local:kind`, `local:format`, `local:count`      |
| `useCopy`    | transient "copied" flag with its 1200ms timer                     |
| `useHotkeys` | one `keydown` listener on `document`, ignoring events from inputs |

### Hydration order

This matters more than it looks:

1. **Synchronously**, before mount: generate a v4 UUID with the default format.
2. Mount and paint. The user already has something to copy.
3. `usePrefs` resolves from storage. If the stored kind or format differs, state updates once.

Storage is never awaited before the first paint. A popup that waits on IO to render is a popup
that feels slow, and "feels instant" is the entire product.

---

## Data flow — copying a UUID

```
user clicks display
   └─▶ UuidDisplay onCopy()
         └─▶ useCopy.copy(formatted)
               ├─▶ lib/clipboard.copy()  ──▶ navigator.clipboard.writeText
               │                              └─ fallback: hidden textarea + execCommand
               └─▶ setCopied(true) ──▶ 1200ms timer ──▶ setCopied(false)
                     └─▶ aria-live region announces "Copied <uuid>"
```

The string that reaches the clipboard is the **formatted** one — the exact text on screen.
A test asserts that, because "copied something subtly different from what I saw" is the single
worst bug this extension could ship.

---

## Data flow — bulk CSV

```
Generate ──▶ lib/uuid.generateMany(kind, count)   // count clamped to 1..100
                └─▶ rows.map(applyFormat)
                      └─▶ render list
Download ──▶ lib/csv.toCsv(rows)      // RFC 4180 + UTF-8 BOM
                └─▶ Blob ──▶ createObjectURL ──▶ <a download>.click() ──▶ revokeObjectURL
```

No `downloads` permission is involved at any point.

---

## What is deliberately absent

| Absent                    | Because                                                       |
| ------------------------- | ------------------------------------------------------------- |
| Background service worker | Nothing needs to run when the popup is closed                 |
| Content scripts           | Would require host permissions and a much harder store review |
| Options page              | Every setting fits inline in the popup                        |
| State management library  | Four fields of state                                          |
| Network layer             | F-50: there is nothing to fetch, ever                         |
| Web fonts                 | A network request on the critical path                        |
| Analytics                 | See [SECURITY.md](../SECURITY.md)                             |
