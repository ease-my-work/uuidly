# uuidly — Publishing Runbook

How a release gets from a git tag to the Chrome Web Store.

Maintainers only. Contributors never need this.

---

## Versioning

[Semantic Versioning](https://semver.org). The extension version in `package.json` is the
version WXT writes into `manifest.json`.

- **patch** — bug fix, no visible behaviour change
- **minor** — new feature, backwards compatible
- **major** — a change that removes or reshapes existing behaviour

Commits follow [Conventional Commits](https://www.conventionalcommits.org), which is what drives
the changelog.

---

## Release flow

```
 bump version in package.json  ──▶  update CHANGELOG.md  ──▶  merge to master
                                                                    │
                                                       git tag v1.0.0 && git push --tags
                                                                    │
                                                   .github/workflows/release.yml
                                                                    │
                        ┌───────────────────────────────────────────┼───────────────────────┐
                        ▼                                           ▼                       ▼
                 pnpm build                                   pnpm zip           GitHub Release
                                                                                 (attaches the ZIP)
                                                                    │
                                                        pnpm wxt submit --chrome-zip
                                                                    │
                                                          Chrome Web Store review
```

The submit step is **guarded on secret presence**, so forks and PRs from contributors run the
build and skip publishing rather than failing.

---

## Required GitHub Actions secrets

| Secret                 | Where it comes from                                                |
| ---------------------- | ------------------------------------------------------------------ |
| `CHROME_EXTENSION_ID`  | The item ID in the Chrome Web Store developer dashboard URL        |
| `CHROME_CLIENT_ID`     | Google Cloud OAuth client (type: Desktop app)                      |
| `CHROME_CLIENT_SECRET` | Same OAuth client                                                  |
| `CHROME_REFRESH_TOKEN` | Generated once against that client with the `chromewebstore` scope |

Set them under **Settings → Secrets and variables → Actions**. They are never written to a file
in this repository, and secret scanning with push protection is enabled to catch mistakes.

WXT's publishing guide has the current walkthrough for obtaining the OAuth values:
<https://wxt.dev/guide/essentials/publishing>

> **v1.1.0 adds** `FIREFOX_EXTENSION_ID`, `FIREFOX_JWT_ISSUER` and `FIREFOX_JWT_SECRET` for AMO.

---

## Chrome Web Store listing

| Asset             | Spec                                   |
| ----------------- | -------------------------------------- |
| Icon              | 128×128 PNG — `public/icon/128.png`    |
| Screenshots       | 1280×800 PNG, at least one, up to five |
| Small promo tile  | 440×280 PNG                            |
| Short description | ≤ 132 characters                       |
| Category          | Developer Tools                        |

### Privacy practices form

These answers are the whole point of the permission discipline in this codebase. They should
stay true for every release:

- **Single purpose** — generate UUIDs and copy them to the clipboard.
- **Permission justification — `storage`** — remembers the user's chosen UUID version and
  formatting between sessions. Nothing else is stored.
- **Remote code** — none. Everything is bundled; no `eval`, no remotely hosted scripts.
- **Data collection** — none. The extension makes no network requests of any kind, which is
  enforced by a test asserting the built bundle contains no `fetch`, `XMLHttpRequest` or
  `WebSocket`.

---

## Manual pre-submit checklist

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size` all green
- [ ] `.output/chrome-mv3/manifest.json` shows exactly `"permissions": ["storage"]`
- [ ] Version in `package.json` matches the tag and the `CHANGELOG.md` heading
- [ ] Every checkbox in [DESIGN.md](DESIGN.md) §13 verified against the built extension
- [ ] Screenshots regenerated if the UI changed
- [ ] Loaded the built ZIP unpacked and used it for a few minutes

---

## If a review is rejected

1. Read the exact policy clause cited — Chrome's rejection emails name it.
2. Fix, bump the patch version, tag again. Do not resubmit the same version.
3. Record what happened in `CHANGELOG.md` so the next maintainer knows.

The two most common causes for an extension like this are an unjustified permission and a
mismatch between the listing description and actual behaviour. Both are avoided by keeping the
permission list at exactly one entry and the description literal.
