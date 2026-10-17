# Testing

| Kind | Files | Runner | Needs | Run |
|---|---|---|---|---|
| Unit | `src/**/*.test.ts` | Vitest (node) | nothing | `make test` |
| UI component | `src/**/*.test.tsx` | Vitest browser mode (Chromium) | Playwright browser | `make test` |
| End-to-end | `tests/e2e/**/*.e2e.ts` | Playwright | the real backend | see [the CRM backend](#the-crm-backend) |
| Accessibility | `tests/e2e/Showcase.e2e.ts` | Playwright + axe-core | the real backend | `make e2e` |
| Visual | `tests/visual/*.visual.ts` | Playwright screenshots | the real backend | CI (see below) |
| API contract | `scripts/api-types.ts --check` | Node | the real backend | `make api-check` |

## Unit and UI tests

Pure logic (session cookie rules, error mapping, validation) has unit tests next to the code.
Components render in a real browser with `vitest-browser-react`. Neither needs the backend: server
actions are exercised end to end instead of being mocked.

## End-to-end tests

Always against the **real backend**, never mocks. Playwright starts `pnpm dev` on :3008 (or
reuses one already running there) unless `E2E_BASE_URL` points it at a running app.

- `make e2e`: starts Postgres + the backend image, then runs Playwright.
- `make e2e-image`: builds the frontend image and runs the full stack in containers; Playwright
  targets it via `E2E_BASE_URL`. This is exactly what CI runs.

Both use the published API image, which [isn't published yet](configuration.md#local-docker-stack-envenv):
until it is, run the suite against the API repo as below.

A global setup fails fast with "Backend not ready at …" if the backend isn't up.

### The CRM backend

The CRM's endpoints come from [aureon-crm-api](https://github.com/neszaDev/aureon-crm-api)
(branch `feat/crm`). Run it locally with its own `make up`, with these in **its** `env/.env`:

```sh
APP_PORT=8081                          # 8080 stays free for other projects
JWT_SECRET=<any local value of 32+ bytes>
ADMIN_EMAIL=admin@e2e.test             # the admin tests/e2e/helpers.ts signs in with
ADMIN_PASSWORD=e2e-admin-password
RATE_LIMIT_LOGIN_PER_IP=10000          # the suite registers every user from one address
RATE_LIMIT_REGISTER_PER_IP=10000
```

Then, here:

```sh
BACKEND_URL=http://localhost:8081 pnpm exec playwright test --project=chromium --workers=1
BACKEND_URL=http://localhost:8081 pnpm exec playwright test tests/e2e/crm --project=chromium --workers=1
```

One worker keeps the dev server, the API and Postgres within a laptop's memory and keeps the
per-email sign-in limit predictable; don't run it next to a Maven build of the API. The
`EXPIRED` invitation test ages its own invitation row with `psql` inside the API's Postgres
container (`aureon-crm-api-postgres-1`; override with `E2E_POSTGRES_CONTAINER`).

The containers in `docker/compose.yml` do the same: they create the admin (`admin@e2e.test`, see
`ADMIN` in `tests/e2e/helpers.ts`) and raise the per-IP rate limits. The per-email limit on failed
sign-ins keeps its default; `Auth.e2e.ts` checks it. Never change or delete the admin in a test.

Rules: every test registers its own user (`tests/e2e/helpers.ts`), so tests are independent and
can run in any order. Use `signOut(page)`, which waits for sign-out to finish, before visiting a
page that must be signed out.

What's covered: public pages, i18n switching, protected-route redirects (with locale), the full
session lifecycle, **token refresh through the proxy** (access cookie removed → page still loads,
refresh token rotated), auth errors, the failed-sign-in limit, form validation, test-results CRUD
with the summary, file upload/download/delete with type and size errors, and admin user
management (hidden from regular users, search, role change, delete, no self-edit).

The CRM specs (helpers: `createWorkspace` and `expectNoA11yViolations` in
`tests/e2e/crm/helpers.ts`, which runs axe on the main CRM pages and dialogs they open):

| Spec | Covers |
|---|---|
| `tests/e2e/Workspace.e2e.ts` | First workspace from the create form (browser time zone), the shell and its skip link, the switcher between workspaces, "Workspace not found" for non-members, the rail as a drawer on a phone in Thai |
| `tests/e2e/crm/Settings.e2e.ts` | Rename and currency, the 409 reload, the last owner (own-role confirmation, leave note), invitation links (shown once, in the inviter's language, revoke), stages (add, move by button and keyboard drag, rename, delete; Won and Lost pinned), a pipeline or source changed in another tab, lead sources, display name and password, an expired session in an action, dark and Thai from the account menu, every settings page at 390 px in Thai |
| `tests/e2e/crm/Invitation.e2e.ts` | Registering through a link, joining signed in (also after the access cookie expired), a link for another email, an existing account sent to sign in and back, accepted, revoked, expired and unknown links, a phone in Thai |
| `tests/e2e/Auth.e2e.ts` | Also the CRM's redirects: `/app` deep links keep `?next=`, sign-in and sign-up keep it between them |

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

- **"Backend not ready"**: start the API repo (`make up` there, see
  [the CRM backend](#the-crm-backend)) and pass `BACKEND_URL=http://localhost:8081`. Once the
  API image is published, `make backend-up` works too (first start on Apple Silicon is slower:
  the image is amd64 and runs under emulation).
- **"Another next dev server is already running"**: Next.js allows one dev server per project;
  stop `pnpm dev` or let Playwright reuse it.
