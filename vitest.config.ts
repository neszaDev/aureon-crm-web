import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const testEnv = {
  BACKEND_URL: 'http://localhost:8080',
  APP_URL: 'http://localhost:3000',
};

export default defineConfig({
  // The React Compiler runs in production builds only (next.config.ts); compile the tests with it too,
  // so a component that only breaks when compiled fails here (react-hook-form's in-place `errors`).
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    tsconfigPaths: true,
    // `next/image` is a CommonJS re-export whose default import arrives as the module object
    // in browser tests; point straight at its ESM build.
    alias: { 'next/image': 'next/dist/esm/shared/lib/image-external.js' },
  },
  // Pre-bundle dnd-kit: on a cold cache, Vite otherwise re-optimises mid-run and the first
  // drag-and-drop test loads a second React copy ("Invalid hook call"). The calendar's locales
  // and the server renderer (the server-rendered HTML tests) are two more such late imports.
  optimizeDeps: {
    include: ['@dnd-kit/core', '@dnd-kit/sortable', 'react-day-picker/locale', 'react-dom/server'],
  },
  test: {
    coverage: {
      include: ['src/**/*'],
      exclude: ['src/**/*.stories.{js,jsx,ts,tsx}'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{js,ts}'],
          exclude: ['src/hooks/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          include: ['**/*.test.tsx', 'src/hooks/**/*.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            screenshotDirectory: 'vitest-test-results',
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
    reporters: [
      'default',
      // conditional reporter
      process.env.CI ? 'github-actions' : {},
    ],
    // Same variables as `pnpm dev` (env/.env, when present), with defaults so unit tests never
    // depend on a local file or a running backend.
    env: { ...testEnv, ...loadEnv('', 'env', '') },
  },
  define: {
    // Expose NEXT_PUBLIC_* variables to browser tests
    'process.env': JSON.stringify(loadEnv('', 'env', 'NEXT_PUBLIC_')),
  },
});
