# Testing

| Kind | Files | Runner | Needs | Run |
|---|---|---|---|---|
| Unit | `src/**/*.test.ts` | Vitest (node) | nothing | `make test` |
| UI component | `src/**/*.test.tsx` | Vitest browser mode (Chromium) | Playwright browser | `make test` |
| End-to-end | `tests/e2e/*.e2e.ts` | Playwright | the real backend | `make e2e` / `make e2e-image` |
| Accessibility | `tests/e2e/Showcase.e2e.ts` | Playwright + axe-core | the real backend | `make e2e` |
| Visual | `tests/visual/*.visual.ts` | Playwright screenshots | the real backend | CI (see below) |
| API contract | `scripts/api-types.ts --check` | Node | the real backend | `make api-check` |

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

The backend in `docker/compose.yml` creates an admin (`admin@e2e.test`, see `ADMIN` in
`tests/e2e/helpers.ts`) and raises the per-IP rate limits, since the suite registers every user
from one address. The per-email limit on failed sign-ins keeps its default; `Auth.e2e.ts` checks
it. Never change or delete the admin in a test.

Rules: every test registers its own user (`tests/e2e/helpers.ts`), so tests are independent and
can run in any order. Use `signOut(page)`, which waits for sign-out to finish, before visiting a
page that must be signed out.

What's covered: public pages, i18n switching, protected-route redirects (with locale), the full
session lifecycle, **token refresh through the proxy** (access cookie removed → page still loads,
refresh token rotated), auth errors, the failed-sign-in limit, form validation, test-results CRUD
with the summary, file upload/download/delete with type and size errors, and admin user
management (hidden from regular users, search, role change, delete, no self-edit).

## Accessibility

`Showcase.e2e.ts` opens every app route and runs axe-core (WCAG 2.1 A + AA) with reduced motion.
Known violations are listed per route in `tests/e2e/a11y-baseline.json`; anything else fails.
When a listed rule no longer occurs, the test adds an `a11y-baseline` annotation: remove the entry,
so the list only shrinks. Don't add entries to get green; fix the violation.

## Visual regression

`tests/visual/Screens.visual.ts` screenshots fixed-content screens (no dates or random data) and
compares them with `tests/visual/__screenshots__/` (`maxDiffPixelRatio` 0.1%; the random user
email is masked). Baselines are rendered by CI on Linux, since fonts render differently per OS,
so local runs on macOS are only a preview.

- **A change is intended:** delete the affected PNGs in your branch and push. CI writes the
  missing baselines, fails the visual step (so deleting a baseline can never make a PR pass),
  and uploads them as the `visual-baselines` artifact; check the images, commit them, push again.
- **A diff is unexpected:** the failed job's `playwright-report` artifact has the expected, actual
  and diff images.

## API contract

`pnpm api:check` (`make api-check` locally, the E2E job in CI) generates the API types from the
running backend and fails when they differ from `src/libs/api/schema.d.ts`. Keys are sorted
before generating, because Springdoc does not emit schema properties in a stable order.

## Reports

Local: `playwright-report/` and `test-results/` (git-ignored). CI uploads them as the
`playwright-report` artifact on failure, together with container logs.

## Troubleshooting

- **"Backend not ready"**: `make backend-up` (first start on Apple Silicon is slower: the backend
  image is amd64 and runs under emulation).
- **"Another next dev server is already running"**: Next.js allows one dev server per project;
  stop `pnpm dev` or let Playwright reuse it.
