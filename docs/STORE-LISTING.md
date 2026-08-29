# uuidly — Chrome Web Store Listing

Everything to paste into the developer dashboard, written once so the listing and the
product cannot drift apart. Every claim below is enforced somewhere in the repository —
if you change one, change the thing that enforces it too.

Companion: [PUBLISHING.md](PUBLISHING.md) (release mechanics) · [MAINTAINING.md](MAINTAINING.md) (repo settings)

---

## Identity

| Field              | Value                                                |
| ------------------ | ---------------------------------------------------- |
| Name               | `uuidly — UUID Generator`                            |
| Category           | Developer Tools                                      |
| Language           | English (UK)                                         |
| Privacy policy URL | `https://ease-my-work.github.io/uuidly/privacy.html` |

## Short description

130 characters, against the 132 limit. Verified by a test, because "just under the limit"
is the kind of thing that silently stops being true after one edit:

```
Generate and copy UUID v1, v4, v7, NIL and MAX in one click. Bulk up to 100 with CSV export. Offline, one permission, no tracking.
```

## Detailed description

```
Open the popup and a UUID is already there. Click it and it is on your clipboard. That is the whole product.

VERSIONS
• v4 — random, the one you usually want
• v1 — timestamp-based, with a random node id (your MAC address is never read)
• v7 — Unix-epoch time-ordered, so it sorts lexicographically and makes a good database key
• NIL and MAX — the two constants, without having to remember which is which

BULK
Generate up to 100 at a time. Copy them as plain text or as a JSON array, or download a CSV with proper RFC 4180 quoting and a UTF-8 BOM so Excel opens it without mangling anything.

FORMATTING
Uppercase, hyphens on or off, and {braces}, "quotes" or urn:uuid:. Changing the format never regenerates the value, and what reaches your clipboard is exactly what is on screen.

KEYBOARD
1–5 pick a version, R refreshes, C copies, B opens bulk, Esc closes. The whole extension works with the mouse unplugged.

PRIVACY
uuidly requests one permission: storage, to remember your chosen version and formatting. It has no host permissions, so it cannot read or change any page you visit. It makes no network requests of any kind — a build-time check rejects the bundle if fetch, XMLHttpRequest or WebSocket appears anywhere in it. There is no analytics, no telemetry and no remote code.

It is 17.6 kB of JavaScript with two dependencies, MIT-licensed, and the source is on GitHub. You do not have to take any of this on trust.

https://github.com/ease-my-work/uuidly
```

## Privacy practices form

These answers must stay true. Each is enforced by `pnpm guard` against the built extension.

| Question                | Answer                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Single purpose          | Generate UUIDs and copy them to the clipboard.                                                                                        |
| `storage` justification | Remembers the user's selected UUID version, formatting options, bulk count and theme choice between sessions. Nothing else is stored. |
| Other permissions       | None requested.                                                                                                                       |
| Remote code             | No. Everything is bundled at build time; no `eval`, no remotely hosted scripts.                                                       |
| Data collection         | None. The extension makes no network requests, which is enforced by a build-time check.                                               |

Tick nothing in the data-collection matrix. If a future change requires ticking a box, it
also requires updating [SECURITY.md](../SECURITY.md), the README and this file.

### Paste-ready answers

The table above is the summary. These are the actual field values — the form wants prose,
and terse answers are a common rejection reason.

**Single purpose description**

```
uuidly generates UUIDs and copies them to the clipboard.

Every feature serves that one purpose: choosing a version (v1, v4, v7, or the NIL and MAX constants), formatting the result, generating up to 100 at once, and copying or exporting them as CSV. The extension does nothing else — it has no other mode, no background activity, and no functionality unrelated to producing a UUID.
```

**Permission justification — `storage`**

```
uuidly uses chrome.storage.local to remember four interface preferences between sessions: the selected UUID version, the formatting options (uppercase, hyphens, and the braces / quotes / urn:uuid: wrapper), the bulk generation count, and the theme choice (system, light or dark).

Without it, the popup would reset to its defaults every time it is opened, which for a tool whose value is being instant would defeat its purpose.

Only these preference values are stored. No UUIDs, no browsing data, and no personal or identifying information are stored. The data stays in local storage on the user's own machine and is never transmitted — the extension makes no network requests of any kind.
```

**Host permission justification**

```
None requested. uuidly declares no host permissions and no content scripts. It cannot read or modify any page the user visits.
```

**Remote code**

Select **"No, I am not using remote code."**

```
All code is bundled into the extension package at build time. There is no eval, no new Function on remote input, and no remotely hosted script, module or WebAssembly. The extension makes no network requests, so there is nothing for it to fetch.
```

**Data usage**

Tick nothing. Certify all three compliance statements: the extension does not sell user
data, does not use or transfer it for purposes unrelated to its single purpose, and does not
use or transfer it to determine creditworthiness or for lending.

## Assets

> The **store** icon and the **toolbar** icons are different assets that happen to share a
> size. The toolbar set in `public/icon/` is full-bleed, because a browser toolbar gives you
> 16 pixels and spending four on margin is absurd. The store applies its own masking and
> shadow, so its icon insets the artwork to ~96×96 with a transparent margin. Upload
> `store/icon-128.png`, not `public/icon/128.png`.

| Asset            | Spec                                  | Status                                                         |
| ---------------- | ------------------------------------- | -------------------------------------------------------------- |
| Store icon       | 128×128 PNG, ~96×96 artwork           | `store/icon-128.png` — generated by `pnpm icons`               |
| Small promo tile | 440×280 PNG                           | `store/promo-440x280.png` — generated by `pnpm promo`          |
| Screenshots      | 1280×800, 24-bit PNG, no alpha, max 5 | **Ready** — `store/listing/*.png`, built by `pnpm screenshots` |

### Screenshots

Upload the five files in `store/listing/`, in numbered order:

| File               | Shows                                                       |
| ------------------ | ----------------------------------------------------------- |
| `1-default.png`    | v4 on open — the whole pitch in one image                   |
| `2-v7.png`         | v7 selected, time-ordered value                             |
| `3-bulk.png`       | Bulk panel with 25 rows and the CSV button                  |
| `4-formatting.png` | `urn:uuid:` applied, value scrolling rather than truncating |
| `5-light.png`      | Light theme, following the system                           |

They are composed by `pnpm screenshots` from the raw popup captures kept alongside them
(`store/uuidly_*.png`): each capture is scaled onto a 1280×800 canvas with a headline, a
handwritten callout or two, and a caption, then encoded as **24-bit PNG with no alpha**,
which the store requires and which a plain screenshot will not be.

**To retake:** capture the popup at 100% zoom against any background — the crop is placed on
a generated canvas, so the surrounding pixels do not matter. Keep the filenames, then rerun:

```bash
pnpm screenshots
```

Callout text and arrow targets live in the `SHOTS` array in
[`scripts/gen-store-screenshots.mjs`](../scripts/gen-store-screenshots.mjs). Targets are
expressed as fractions of the capture, so they survive a recapture at a different size.

> Annotations render in **Ink Free**, a Windows font. On a machine without it, resvg
> substitutes a default face and the result will not match. That is why the composed PNGs
> are committed rather than generated in CI.

## Pre-submission checklist

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm guard && pnpm size`
- [ ] `.output/chrome-mv3/manifest.json` shows exactly `"permissions": ["storage"]`
- [ ] Version in `package.json` matches the tag and the `CHANGELOG.md` heading
- [ ] Screenshots recaptured if the UI changed
- [ ] The short description is still ≤ 132 characters
- [ ] Every claim in the detailed description is still true
- [ ] Installed the built ZIP unpacked and used it for a few minutes

## After approval

- [ ] Replace "Chrome Web Store listing coming soon" in `site/index.html` with the real link
- [ ] Add the store badge to `README.md`
- [ ] Update `docs/FEATURES.md` F-71
