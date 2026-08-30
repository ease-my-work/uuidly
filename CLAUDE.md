# CLAUDE.md

Read [AGENTS.md](AGENTS.md) — it is the canonical brief for this repository and applies to
Claude Code unchanged. Everything below is specific to running Claude Code here.

Two files rather than one copy each: duplicated guidance drifts, and this repo already has tests
whose job is to stop documentation drifting from code. Keep the substance in `AGENTS.md`.

## Before you touch anything

`pnpm build && pnpm typecheck && pnpm test && pnpm lint && pnpm guard && pnpm size` is the full
gate, and it is what CI runs. `pnpm test` alone is not enough — Vitest never invokes `tsc`.

## Tool notes

- Prefer the Bash tool for shell work. This is a Windows machine, so the PowerShell tool gets
  PowerShell 5.1 semantics: no heredocs, no `&&`, and multi-line strings passed to `git` get
  re-parsed. `git commit -F -` from the Bash tool is reliable.
- Use the Write tool for new files and Edit for precise changes. Regex rewrites of UTF-8 files
  have corrupted source in this repo before.
- The in-app browser preview has been unreliable against `localhost` here. To view the site,
  `npx serve site` and open it yourself, or check the deployed Pages URL.

## Verifying UI work

The popup is a fixed 420px frame. jsdom has no layout engine, so tests cannot confirm anything
visual — sizing, contrast and the Checkpoint C criteria in `docs/DESIGN.md` §13 need a real
browser and a human looking at it. Say so rather than implying a test covered it.

## Reporting

State what was actually run and what it returned. If a check was skipped, say which and why.
"Tests pass" after running only `pnpm test` is a claim about typechecking that was never made.
