## What does this change?

<!-- One or two sentences. What is different after this is merged? -->

Closes #

## Why?

<!-- The problem being solved. Skip if the linked issue already covers it. -->

## How was it verified?

<!-- Which tests you added, and what you checked by hand in the browser. -->

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm guard`
- [ ] `pnpm size`
- [ ] Loaded the built extension and used the changed behaviour

## Checklist

- [ ] Commits follow [Conventional Commits](https://www.conventionalcommits.org)
- [ ] New behaviour has a test; a bug fix has a test that failed before the fix
- [ ] No new runtime dependency (or it was discussed in an issue first)
- [ ] **No new manifest permission** — the extension requests `storage` and nothing else
- [ ] **No network request added** — there is a test that enforces this
- [ ] No colour literal added outside `src/assets/tailwind.css`
- [ ] If the look changed, [`docs/DESIGN.md`](../docs/DESIGN.md) is updated to match
- [ ] `CHANGELOG.md` updated under `Unreleased` if this is user-visible

## Screenshots

<!-- Before and after, if anything visual changed. Delete this section otherwise. -->
