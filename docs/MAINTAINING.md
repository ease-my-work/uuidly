# uuidly — Repository Settings

Everything here needs GitHub admin rights and cannot be done from a commit. It is written
down so the settings are reviewable and reproducible rather than folklore.

Companion documents: [PUBLISHING.md](PUBLISHING.md) · [TECHNICAL.md](TECHNICAL.md)

---

## Branch protection on `master`

**Settings → Branches → Add branch protection rule**, pattern `master`:

- [ ] Require a pull request before merging
- [ ] Require status checks to pass before merging, and require branches to be up to date.
      Select all three:
  - `Lint, typecheck, test, build` (from `ci.yml`)
  - `Analyze JavaScript and TypeScript` (from `codeql.yml`)
  - `Dependency review` (from `ci.yml`)
- [ ] Require conversation resolution before merging
- [ ] Do not allow force pushes
- [ ] Do not allow deletions

Status checks only appear in that list once each workflow has run at least once, so push
the workflows first, let them run, then configure this.

**Verify:** `git push origin master` directly and confirm it is rejected.

## Security

**Settings → Code security:**

- [ ] Dependency graph — enabled (required by `dependency-review` in `ci.yml`)
- [ ] Dependabot alerts — enabled
- [ ] Dependabot security updates — enabled
- [ ] Secret scanning — enabled
- [ ] Secret scanning push protection — enabled

Push protection is the one that matters most here: the release workflow uses Chrome Web
Store credentials, and the cheapest place to stop a leaked token is before the push lands.

**Settings → Actions → General:**

- [ ] Workflow permissions: **Read repository contents and packages permissions**

Every workflow declares the permissions it needs, so the default should be the floor rather
than write-all.

## Community

- [ ] **Discussions** enabled — `.github/ISSUE_TEMPLATE/config.yml` links to it, and the
      link is dead until it is on
- [ ] Labels: `good first issue`, `help wanted`, `bug`, `enhancement`, `dependencies`, `ci`
- [ ] **Settings → General → Features:** Wikis off, Projects off. Everything lives in
      `docs/`, and a half-used wiki is worse than none

## Pages

Configured in Phase 7, listed here so the whole surface is in one place:

- [ ] **Settings → Pages → Source: GitHub Actions**

## Release secrets

See [PUBLISHING.md](PUBLISHING.md) for the four Chrome Web Store secrets and where they come
from. They live only in **Settings → Secrets and variables → Actions** and never in a file.

---

## Why the actions are pinned to SHAs

Every `uses:` in this repository points at a 40-character commit SHA with the human-readable
tag in a trailing comment:

```yaml
uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5
```

A tag is a movable pointer. Someone who can push to the action's repository can repoint `v5`
at different code, and every workflow that trusts the tag runs it on the next build — with
whatever permissions that job was granted. A SHA cannot be repointed.

The cost is that updates stop arriving silently, which is the point. Dependabot is configured
in `.github/dependabot.yml` to open a pull request when a pinned action moves, so the update
becomes something a person reviews rather than something that happens.
