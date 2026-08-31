import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],

  // Auto-imports are disabled on purpose: every symbol is imported explicitly so
  // that lint, typecheck and code review all see the same dependency graph.
  imports: false,

  manifest: {
    name: 'uuidly',
    short_name: 'uuidly',
    description:
      'Generate and copy UUID v1, v4, v7, NIL and MAX in one click. Bulk up to 100 with CSV export. Offline, no tracking.',
    // The single permission this extension will ever request. See SECURITY.md.
    permissions: ['storage'],
    action: {
      default_title: 'uuidly — generate a UUID',
    },
    // P9 adds `browser_specific_settings.gecko` here for AMO. WXT strips it from
    // Chrome builds automatically, so it is purely additive.
  },

  vite: () => ({
    plugins: [tailwindcss()],

    build: {
      // Vite's modulepreload polyfill calls fetch() on preload hrefs. Chrome MV3
      // supports modulepreload natively, so the polyfill is dead weight — and it
      // is the only fetch() in the bundle, which `pnpm guard` (F-50) rejects.
      modulePreload: { polyfill: false },
    },

    // The React API, on the Preact runtime. Measured at scaffold time: real
    // react+react-dom cost 59.63 kB gzipped against a 60 kB budget (F-60), i.e.
    // the whole budget before a single feature existed. preact/compat is 7.88 kB
    // for identical source — same JSX, same hooks, same @testing-library/react.
    // Nothing in a popup needs RSC or full Suspense, which is all that is given up.
    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react/jsx-runtime': 'preact/jsx-runtime',
      },
    },
  }),
});
