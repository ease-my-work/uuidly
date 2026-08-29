# uuidly — Popup Design Specification

> **Status: FROZEN** as of T0.2. This is the visual contract for the popup.
>
> Every colour token below exists in [`src/assets/tailwind.css`](../src/assets/tailwind.css)
> and is exposed as a Tailwind utility. Do not hard-code a colour anywhere else.
>
> Changing anything in this document after the freeze requires a matching amendment to
> [`tasks/plan.md`](../tasks/plan.md) — components are built against it from T1.2 onward.
> Companion documents: [FEATURES.md](FEATURES.md) · [TECHNICAL.md](TECHNICAL.md) · [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 1. Design principles

1. **The value is the interface.** The UUID is the largest thing on screen. Everything else is chrome around it.
2. **Zero clicks to the primary action.** A UUID is on screen at first paint. Copy is one click anywhere on it.
3. **Black-first.** Deep black surface, restrained accent. No gradients, no glass, no shadow stacks.
4. **Nothing moves unless it means something.** Motion is reserved for state changes (copied, expanded).
5. **Density without crowding.** 4px spacing grid, generous line-height on the monospace value only.

---

## 2. Frame

| Property         | Value                                                            | Note                                                                           |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Width            | **360px** fixed                                                  | Chrome popup max is 800px; 360 keeps the 36-char UUID on two comfortable lines |
| Height           | **auto**, max **600px**                                          | Chrome hard limit. Only the bulk list scrolls internally                       |
| Collapsed height | ~296px                                                           | Bulk panel closed (default)                                                    |
| Expanded height  | ~520px                                                           | Bulk panel open with 10 rows                                                   |
| Body padding     | 0 (sections own their padding)                                   |                                                                                |
| Overflow         | `overflow: hidden` on body; `overflow-y: auto` on bulk list only | Page itself never scrolls                                                      |

---

## 3. Layout — collapsed (default state)

```
┌────────────────────────────────────────────────┐ ◀ 360px ▶
│  ◆  uuidly                             ☾    ⓘ  │  Header        44px
├────────────────────────────────────────────────┤
│                                                │
│   ┌──────┬──────┬──────┬──────┬──────┐         │  VersionTabs   32px
│   │  v4  │  v1  │  v7  │ NIL  │ MAX  │         │  (+16 pad)
│   └──────┴──────┴──────┴──────┴──────┘         │
│                                                │
│   ┌────────────────────────────────────────┐   │
│   │                                        │   │
│   │   3f2b9c1a-7d4e-4f8b-9a2c-1e5d8f0b     │   │  UuidDisplay
│   │   6a7c                                 │   │  min-h 76px
│   │                                        │   │  click = copy
│   │                          click to copy │   │
│   └────────────────────────────────────────┘   │
│                                                │
│   ┌──────────────────┐ ┌───────────────────┐   │
│   │   ⧉   Copy       │ │   ↻   Refresh     │   │  ActionRow     36px
│   └──────────────────┘ └───────────────────┘   │
│                                                │
├────────────────────────────────────────────────┤
│  Format    [aA]  [‑]  [{ }]                    │  FormatBar     34px
├────────────────────────────────────────────────┤
│  ▸  Bulk generate                       1–100  │  BulkPanel     36px
└────────────────────────────────────────────────┘   (collapsed)
```

### Vertical rhythm

| Section          | Height   | Padding        | Separator         |
| ---------------- | -------- | -------------- | ----------------- |
| Header           | 44px     | 12px 14px      | 1px bottom border |
| VersionTabs      | 32px     | 16px 14px 0    | none              |
| UuidDisplay      | min 76px | 14px 16px      | none              |
| ActionRow        | 36px     | 10px 16px 14px | none              |
| FormatBar        | 34px     | 0 14px         | 1px top border    |
| BulkPanel header | 36px     | 0 14px         | 1px top border    |

---

## 4. Layout — bulk expanded

```
├────────────────────────────────────────────────┤
│  ▾  Bulk generate                              │  36px
│                                                │
│   Count  ┌──────┐                              │
│          │  10  │  ──────●───────────  [1–100] │  40px
│          └──────┘                              │
│                                                │
│   ┌────────────────────────────────────────┐   │
│   │  1   0193f2b9-7c00-73e4-a310-744d21… ⧉ │   │  row 28px
│   │  2   0193f2b9-7c01-7a1f-b8e2-91cc03… ⧉ │   │
│   │  3   0193f2b9-7c01-7de8-8f04-2bb7a1… ⧉ │   │  list max-h 180px
│   │  4   0193f2b9-7c02-7b93-9e11-4d0f8c… ⧉ │   │  scrollable
│   │  ⋮                                      │   │
│   └────────────────────────────────────────┘   │
│                                                │
│   ┌─────────┐ ┌────────────┐ ┌──────────────┐  │
│   │ Copy all│ │ Copy JSON  │ │  ⤓  CSV      │  │  36px
│   └─────────┘ └────────────┘ └──────────────┘  │
│                                                │
│              100 UUIDs · v7 · 4.1 KB           │  meta 16px
└────────────────────────────────────────────────┘
```

- Rows are truncated with a middle ellipsis; the full value is in `title` and is what gets copied.
- List renders plainly at 100 rows — no virtualisation needed (F-63 budget: 50ms).
- Meta line updates live: `<count> UUIDs · <version> · <csv size>`.

---

## 5. Color tokens

Defined as CSS custom properties on `:root`, overridden under `@media (prefers-color-scheme: light)` and `[data-theme]`.

### Dark (default)

| Token         | Value       | Use                                         |
| ------------- | ----------- | ------------------------------------------- |
| `--bg`        | `#0A0A0A`   | Popup background                            |
| `--surface`   | `#141414`   | UuidDisplay card, bulk list                 |
| `--surface-2` | `#1C1C1C`   | Buttons, inactive tabs, inputs              |
| `--surface-3` | `#242424`   | Hover on surface-2                          |
| `--border`    | `#2A2A2A`   | All 1px separators and control outlines     |
| `--text`      | `#F5F5F5`   | UUID value, primary labels                  |
| `--text-dim`  | `#A1A1A1`   | Section labels, hints, row indices          |
| `--text-mute` | `#6B6B6B`   | Disabled text, placeholder                  |
| `--accent`    | `#A78BFA`   | Active tab, focus ring, primary button text |
| `--accent-bg` | `#A78BFA1F` | Active tab fill (12% accent)                |
| `--success`   | `#4ADE80`   | Copied confirmation                         |
| `--danger`    | `#F87171`   | Copy/download failure                       |

### Light

| Token         | Value       |
| ------------- | ----------- |
| `--bg`        | `#FFFFFF`   |
| `--surface`   | `#FAFAFA`   |
| `--surface-2` | `#F4F4F5`   |
| `--surface-3` | `#E9E9EC`   |
| `--border`    | `#E4E4E7`   |
| `--text`      | `#18181B`   |
| `--text-dim`  | `#52525B`   |
| `--text-mute` | `#A1A1AA`   |
| `--accent`    | `#7C3AED`   |
| `--accent-bg` | `#7C3AED14` |
| `--success`   | `#16A34A`   |
| `--danger`    | `#DC2626`   |

**Contrast (F-44, WCAG AA ≥ 4.5:1):**

| Pair                       | Dark   | Light  |
| -------------------------- | ------ | ------ |
| `--text` on `--bg`         | 18.1:1 | 16.9:1 |
| `--text-dim` on `--bg`     | 8.2:1  | 7.6:1  |
| `--accent` on `--bg`       | 8.4:1  | 5.1:1  |
| `--success` on `--surface` | 9.6:1  | 4.6:1  |

Verified in T5.1 with an automated contrast check over these pairs.

---

## 6. Typography

| Role           | Stack                                                                                    | Size / Line | Weight | Tracking            |
| -------------- | ---------------------------------------------------------------------------------------- | ----------- | ------ | ------------------- |
| UUID value     | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | 15px / 1.55 | 500    | `0.01em`            |
| Bulk row value | same monospace                                                                           | 12px / 1.4  | 400    | `0`                 |
| Buttons / tabs | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`                               | 12px / 1    | 500    | `0.01em`            |
| Section labels | same sans                                                                                | 11px / 1    | 500    | `0.04em`, uppercase |
| Hints / meta   | same sans                                                                                | 11px / 1.3  | 400    | `0`                 |
| Wordmark       | same sans                                                                                | 13px / 1    | 600    | `-0.01em`           |

**No web fonts.** System stacks only — a font request would violate F-50 (zero network) and cost first-paint time (F-62).

`font-variant-numeric: tabular-nums` on the UUID and on row indices so values do not shift width between refreshes.

---

## 7. Component specs

### 7.1 Header

- Left: 14×14 diamond mark in `--accent` + wordmark `uuidly` in `--text`.
- Right: theme toggle (`☾` / `☀`, 24×24 hit target ≥ 28px) and an info button linking to the landing page (`target="_blank"`).
- Border-bottom `1px solid var(--border)`.

### 7.2 VersionTabs

- `role="tablist"`, horizontal, 5 equal segments in a `--surface-2` track, radius 8px, 2px inner padding.
- Active: `--accent-bg` fill, `--accent` text, radius 6px.
- Inactive: transparent fill, `--text-dim` text; hover → `--surface-3`.
- Roving tabindex; `←`/`→` move, `Home`/`End` jump. Hotkeys `1`–`5` select directly.
- Labels are exactly `v4 v1 v7 NIL MAX`. `v4` is leftmost because it is the default.

### 7.3 UuidDisplay

- Card: `--surface`, `1px solid var(--border)`, radius 10px, padding 14px 16px, min-height 76px.
- Value wraps to at most 2 lines at 360px width; `word-break: break-all` is **not** used — break only at hyphens via explicit `<wbr>`-free CSS `overflow-wrap: anywhere` so the hyphen grouping stays readable.
- Whole card is the copy target: `role="button"`, `tabindex="0"`, `aria-label="Copy UUID <value>"`, responds to `Enter`/`Space`.
- Bottom-right hint `click to copy` in `--text-mute`, 11px. Hidden while in the copied state.
- Hover: border → `--accent` at 40% opacity, cursor `pointer`.

### 7.4 Copied state (F-11)

- Card border and hint text switch to `--success`; hint text becomes `✓ Copied`.
- Duration **1200ms**, then reverts. Re-copying restarts the timer.
- A visually-hidden `aria-live="polite"` region announces `Copied <formatted uuid>`.
- No toast, no overlay — the change happens in place so the value stays readable.

### 7.5 ActionRow

- Two buttons, equal width, 8px gap, height 36px, radius 8px.
- **Copy** — primary: `--surface-2` fill, `--accent` text + icon, border `--border`. Hover `--surface-3`.
- **Refresh** — secondary: same fill, `--text` text.
- Disabled (Refresh on NIL/MAX): opacity 0.4, `cursor: not-allowed`, `aria-disabled="true"`, `title="NIL and MAX are fixed constants"`.
- Icons: inline 14px SVG, `currentColor`, `stroke-width: 1.75`. No icon font, no sprite sheet.

### 7.6 FormatBar

- Label `FORMAT` in `--text-dim`, then three toggle chips: `aA` (case), `‑` (hyphens), `{ }` (wrapper).
- Chips are 28px tall, radius 6px, `--surface-2`. Active chip: `--accent-bg` + `--accent` text.
- The wrapper chip cycles `none → { } → " " → urn:` on click; its label reflects the current mode. `aria-label` states the full mode name.
- Changing any chip re-renders the value in place — **no regeneration** (F-23). The copied state clears.

### 7.7 BulkPanel

- Collapsed: single 36px row, disclosure triangle + `Bulk generate` + `1–100` hint on the right. Whole row is the toggle (`aria-expanded`).
- Expanded adds: count number input (56px wide, `--surface-2`, tabular) + range slider bound to the same value, Generate button, list, action buttons, meta line.
- Count input clamps on blur and on `Enter`; out-of-range values snap and briefly flash the border `--danger`.
- List: `--surface` fill, `1px solid var(--border)`, radius 8px, `max-height: 180px`, `overflow-y: auto`, custom thin scrollbar (`--surface-3` thumb).
- Row: index in `--text-dim` (24px column, tabular), value in `--text`, copy icon button on the right revealed on row hover **and** always visible on keyboard focus.
- Expansion animates height over 160ms `ease-out`; disabled under `prefers-reduced-motion`.

### 7.8 CSV button

- Tertiary style with a download glyph. On success it briefly shows `✓ Saved`.
- On failure: inline `--danger` message under the row — `Download blocked. Copy all instead.` No modal.

---

## 8. Interaction & keyboard map

| Key                                   | Action                                                                                | Notes                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `1` `2` `3` `4` `5`                   | Select v4 / v1 / v7 / NIL / MAX                                                       | Ignored while focus is in an input                           |
| `R`                                   | Refresh                                                                               | No-op with a shake on NIL/MAX                                |
| `Space`                               | Refresh (when focus is not on a control)                                              | On a focused control, `Space` activates that control instead |
| `C` or `Ctrl/Cmd+C`                   | Copy current value                                                                    | Native `Ctrl+C` wins if there is a text selection            |
| `B`                                   | Toggle bulk panel                                                                     |                                                              |
| `Enter` / `Space` on the display card | Copy                                                                                  |                                                              |
| `←` `→` `Home` `End`                  | Move between version tabs                                                             | Only while the tablist has focus                             |
| `Esc`                                 | Close popup                                                                           |                                                              |
| `Tab`                                 | Header → tabs → display → Copy → Refresh → format chips → bulk toggle → bulk controls | Single linear order, no traps                                |

**Focus ring:** `outline: 2px solid var(--accent); outline-offset: 2px;` on every interactive element. Never removed — `:focus-visible` where supported, plain `:focus` as fallback.

---

## 9. Motion

| Transition                         | Duration            | Easing        |
| ---------------------------------- | ------------------- | ------------- |
| Button / tab / chip hover + active | 120ms               | `ease-out`    |
| Copied state in and out            | 120ms in, 200ms out | `ease-out`    |
| Bulk panel expand/collapse         | 160ms               | `ease-out`    |
| Invalid count flash                | 300ms               | `ease-in-out` |

All wrapped in `@media (prefers-reduced-motion: reduce) { transition: none; animation: none; }`.

No entrance animation on popup open — it would fight the ≤100ms first-paint budget (F-62) and make the extension feel slower than it is.

---

## 10. States matrix

| State             | Trigger                           | Visual                                                                                                             |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Default           | Popup opens                       | v4 UUID rendered, hint `click to copy`                                                                             |
| Hover (display)   | Pointer over card                 | Border → accent 40%, cursor pointer                                                                                |
| Focused           | Keyboard focus                    | Accent outline, 2px offset                                                                                         |
| Copied            | Copy succeeds                     | Border + hint → `--success`, `✓ Copied`, 1200ms                                                                    |
| Copy failed       | Clipboard API rejects             | Border + hint → `--danger`, `Copy failed — select and press Ctrl+C`, value becomes user-selectable                 |
| Constant selected | NIL / MAX active                  | Refresh disabled at 0.4 opacity with explanatory `title`                                                           |
| Bulk empty        | Panel opened, nothing generated   | List area shows `Press Generate to create <n> UUIDs` in `--text-mute`                                              |
| Bulk generating   | ≥ 50 rows                         | No spinner — it completes inside one frame. If it ever exceeds 100ms, the Generate button label becomes `Working…` |
| Invalid count     | Out of range on blur              | Border flashes `--danger`, value snaps to 1 or 100                                                                 |
| Hydration         | Stored prefs differ from defaults | Value swaps once, without a flash-of-empty. Never a skeleton — the default UUID is already valid content (F-41)    |

---

## 11. Icon and branding

| Asset                 | Size    | Content                                                      |
| --------------------- | ------- | ------------------------------------------------------------ |
| `public/icon/16.png`  | 16×16   | Solid accent diamond, no text — legible in the toolbar       |
| `public/icon/32.png`  | 32×32   | Diamond with a 1px inner cut                                 |
| `public/icon/48.png`  | 48×48   | Same, refined                                                |
| `public/icon/96.png`  | 96×96   | Same                                                         |
| `public/icon/128.png` | 128×128 | Store tile version, black square background + accent diamond |

Mark: a rotated square (diamond) with a hollow centre — reads as both a "u" counter-form and a node. Single-colour so it works on any toolbar theme. Icons are authored once as SVG in `site/assets/` and exported to PNG; the SVG is the source of truth.

---

## 12. Explicit non-decisions (do not add without a plan change)

- No toast/snackbar system.
- No modal or dialog anywhere in the popup.
- No settings/options page — every setting is inline in the popup.
- No animation on the UUID value itself (no typewriter, no scramble) — it delays readability.
- No custom scrollbar beyond the bulk list.
- No shadows. Elevation is expressed with `--surface` steps and borders only.

---

## 13. Design acceptance criteria

Checked at **Checkpoint C** (T5.1/T5.2):

- [ ] Popup width is exactly 360px; collapsed height ≤ 320px; expanded height ≤ 600px
- [ ] Every colour pair in §5 meets ≥ 4.5:1 in both themes
- [ ] Zero web font requests; DevTools Network is empty on popup open
- [ ] Every interactive element has a visible 2px accent focus ring
- [ ] Full §8 keyboard map works with the mouse unplugged
- [ ] `prefers-reduced-motion: reduce` removes all transitions
- [ ] Copied, copy-failed, constant-selected, bulk-empty and invalid-count states all render as specified
- [ ] Icon is legible at 16px against both a light and a dark browser toolbar
