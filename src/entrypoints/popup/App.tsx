/**
 * SCAFFOLD ONLY — replaced by the real popup in T1.2.
 *
 * Until then this renders the frozen design token set (docs/DESIGN.md §5) so the
 * palette can be verified in both themes inside the real 360px popup frame.
 * This is the "scratch page renders both palettes" verification step for T0.2.
 */

const TOKENS = [
  'bg',
  'surface',
  'surface-2',
  'surface-3',
  'border',
  'text',
  'text-dim',
  'text-mute',
  'accent',
  'accent-bg',
  'success',
  'danger',
] as const;

export default function App() {
  return (
    <main className="bg-bg text-text p-4">
      <header className="mb-3 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="bg-accent inline-block h-3 w-3 rotate-45 rounded-[2px]"
        />
        <h1 className="text-[13px] font-semibold tracking-[-0.01em]">uuidly</h1>
        <span className="text-mute ml-auto text-[11px]">design tokens</span>
      </header>

      <ul className="border-border divide-border divide-y rounded-[10px] border">
        {TOKENS.map((token) => (
          <li key={token} className="flex items-center gap-3 px-3 py-2">
            <span
              aria-hidden="true"
              className="border-border h-5 w-5 shrink-0 rounded border"
              style={{ backgroundColor: `var(--${token})` }}
            />
            <code className="font-mono text-[11px]">--{token}</code>
          </li>
        ))}
      </ul>

      <p className="text-dim mt-3 text-[11px]">
        Scaffold placeholder. The real popup lands in T1.2.
      </p>
    </main>
  );
}
