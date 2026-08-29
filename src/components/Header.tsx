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
          className="text-mute hover:text-dim rounded px-1.5 py-1 text-[11px] transition-colors duration-[120ms]"
        >
          About
        </a>
      </div>
    </header>
  );
}
