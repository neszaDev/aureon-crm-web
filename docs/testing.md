# Testing

| Kind | Files | Runner | Needs | Run |
|---|---|---|---|---|
| Unit | `src/**/*.test.ts` | Vitest (node) | nothing | `make test` |
| UI component | `src/**/*.test.tsx` | Vitest browser mode (Chromium) | Playwright browser | `make test` |
| End-to-end | `tests/e2e/*.e2e.ts` | Playwright | the real backend | `make e2e` / `make e2e-image` |

## Unit and UI tests

Pure logic (session cookie rules, error mapping, validation) has unit tests next to the code.
Components render in a real browser with `vitest-browser-react`. Neither needs the backend: server
actions are exercised end to end instead of being mocked.

## End-to-end tests

Always against the **real backend**, never mocks:

- `make e2e`: starts Postgres + the backend image, Playwright starts `pnpm dev` on :3008.
- `make e2e-image`: builds the frontend image and runs the full stack in containers; Playwright
  targets it via `E2E_BASE_URL`. This is exactly what CI runs.

A global setup fails fast with "Backend not ready at …" if the backend isn't up.

Rules: every test registers its own user (`tests/e2e/helpers.ts`), so tests are independent and
can run in any order. Use `signOut(page)`, which waits for sign-out to finish, before visiting a
page that must be signed out.

What's covered: public pages, i18n switching, protected-route redirects (with locale), the full
session lifecycle, **token refresh through the proxy** (access cookie removed → page still loads,
refresh token rotated), auth errors, form validation, and test-results CRUD with the summary.

## Reports

Local: `playwright-report/` and `test-results/` (git-ignored). CI uploads them as the
`playwright-report` artifact on failure, together with container logs.

## Troubleshooting

- **"Backend not ready"**: `make backend-up` (first start on Apple Silicon is slower: the backend
  image is amd64 and runs under emulation).
- **"Another next dev server is already running"**: Next.js allows one dev server per project;
  stop `pnpm dev` or let Playwright reuse it.
