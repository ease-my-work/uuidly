import { GithubIcon } from './icons';
import { ThemeToggle } from './ThemeToggle';

/** docs/DESIGN.md §7.1. */

const REPO_URL = 'https://github.com/ease-my-work/uuidly';

export function Header() {
  return (
    <header className="border-border flex h-11 items-center gap-2 border-b px-3.5">
      <span
        aria-hidden="true"
        className="bg-accent inline-block h-3 w-3 rotate-45 rounded-[2px]"
      />
      <span className="text-[13px] font-semibold tracking-[-0.01em]">uuidly</span>

      <div className="ml-auto flex items-center gap-0.5">
        <ThemeToggle />
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer noopener"
          // An icon has no accessible name of its own, and "GitHub" alone would
          // not say whose repository this opens.
          aria-label="uuidly on GitHub"
          title="uuidly on GitHub"
          className="text-dim hover:text-text hover:bg-surface-2 flex h-7 w-7 items-center justify-center rounded transition-colors duration-[120ms]"
        >
          <GithubIcon />
        </a>
      </div>
    </header>
  );
}
