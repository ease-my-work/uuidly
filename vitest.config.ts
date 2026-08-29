import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // `tests/` holds suites that are not about `src/` — currently the landing
    // page demo, which reimplements UUID generation and would otherwise ship
    // untested. It lives outside `site/` so it is not deployed with the page.
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/entrypoints/**/main.tsx'],
      // A floor, not a target. Set below the current numbers (97/93/95/99) so
      // ordinary work does not trip it, but far enough up that a feature landing
      // without tests fails CI instead of quietly eroding the suite.
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
