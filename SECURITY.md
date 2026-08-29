# Security Policy

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Report it through
[GitHub private security advisories](https://github.com/ease-my-work/uuidly/security/advisories/new).
Only the maintainers can see it.

Please include what you can: what you found, how to reproduce it, which version and browser,
and what an attacker could do with it. A partial report is better than none.

You can expect an acknowledgement within a few days and an assessment shortly after. If the
report is valid, you will be credited in the release notes unless you would rather not be.

## Supported versions

The latest released version is supported. Fixes ship in a new release rather than as patches
to older ones.

## What this extension does and does not do

These are the security properties the project commits to. They are not aspirations — each one
is enforced by something in the repository, and a change that breaks one should be treated as
a bug.

| Property                                | How it is enforced                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| **Exactly one permission: `storage`**   | Declared in `wxt.config.ts`; asserted against the built `manifest.json`               |
| **No network requests, ever**           | A test asserts the built bundle contains no `fetch(`, `XMLHttpRequest` or `WebSocket` |
| **No analytics or telemetry**           | Nothing to send and nothing to send it with — see above                               |
| **No remote code**                      | Everything is bundled at build time. No `eval`, no remotely hosted scripts            |
| **No host permissions**                 | The extension cannot read or modify any page you visit                                |
| **No content scripts**                  | It never runs inside a web page                                                       |
| **No background service worker**        | Nothing runs while the popup is closed                                                |
| **UUID v1 does not leak a MAC address** | `uuid@14` uses a randomised node id per process; asserted by a test                   |

## What is stored

Three values, in `chrome.storage.local`, on your machine only:

- your selected UUID version,
- your formatting preferences,
- your last bulk count.

That is the complete list. Nothing is synced, transmitted or shared.

## Randomness

UUID v4 and v7 use `crypto.getRandomValues` by way of `uuid@14` — the platform CSPRNG.

UUIDs are identifiers, not secrets. Do not use them as passwords, session tokens or API keys.
A v1 or v7 UUID encodes the time it was created and is inherently guessable in that dimension;
v4 does not, but is still not a substitute for a purpose-built secret.

## Dependencies

Runtime dependencies are deliberately minimal: `preact` and `uuid`, both zero-dependency and
MIT-licensed. Dependabot watches npm packages and GitHub Actions weekly, CodeQL runs on every
pull request and on a schedule, and dependency review blocks pull requests that introduce a
known-vulnerable package.
