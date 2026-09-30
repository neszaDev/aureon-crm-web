import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const testEnv = {
  BACKEND_URL: 'http://localhost:8080',
  APP_URL: 'http://localhost:3000',
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
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
