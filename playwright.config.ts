import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Same variables as `pnpm dev` (env/.env). CI sets them in the workflow instead.
if (existsSync('env/.env')) {
  process.loadEnvFile('env/.env');
}

// Port 3008 avoids clashing with a `pnpm dev` server on 3000.
const PORT = process.env.PORT ?? '3008';
// E2E_BASE_URL targets an already-running app (CI: the Docker image via `make up`), in
// which case Playwright starts no server of its own.
const externalBaseURL = process.env.E2E_BASE_URL;
const baseURL = externalBaseURL ?? `http://localhost:${PORT}`;
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

/**
 * End-to-end tests run against the real backend (`make backend-up` locally, the backend
 * image in CI). See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '*.e2e.?(c|m)[jt]s?(x)',
  globalSetup: './tests/e2e/global-setup.ts',
  timeout: 30 * 1000,
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  expect: {
    timeout: 15 * 1000,
  },

  webServer: externalBaseURL
    ? undefined
    : {
        command: 'pnpm dev:next',
        url: baseURL,
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
        gracefulShutdown: { signal: 'SIGTERM', timeout: 2 * 1000 },
        env: {
          BROWSER_TO_TERMINAL_DISABLED: 'true',
          BACKEND_URL,
          APP_URL: baseURL,
          PORT,
        },
      },

  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: process.env.CI ? 'retain-on-failure' : undefined,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Screenshot comparisons (`pnpm test:visual`). Baselines are rendered by CI on Linux, so
      // one set is committed for every platform; see docs/testing.md to update them.
      name: 'visual',
      testDir: './tests/visual',
      testMatch: '*.visual.ts',
      snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
});
