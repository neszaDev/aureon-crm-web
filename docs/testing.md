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

Against a production build instead of the dev server (what CI's image runs), start it with the
app's own address, which the invitation tests compare their links with:

```sh
pnpm build
BACKEND_URL=http://localhost:8081 APP_URL=http://localhost:3105 pnpm exec next start -p 3105
E2E_BASE_URL=http://localhost:3105 BACKEND_URL=http://localhost:8081 pnpm exec playwright test --project=chromium --workers=1
```

One worker keeps the dev server, the API and Postgres within a laptop's memory and keeps the
per-email sign-in limit predictable; don't run it next to a Maven build of the API. The
`EXPIRED` invitation test ages its own invitation row with `psql` inside the API's Postgres
container (`aureon-crm-api-postgres-1`; override with `E2E_POSTGRES_CONTAINER`, which `make e2e`,
`make e2e-image` and CI set to this repository's own stack).

The containers in `docker/compose.yml` do the same: they create the admin (`admin@e2e.test`, see
`ADMIN` in `tests/e2e/helpers.ts`) and raise the per-IP rate limits. The per-email limit on failed
sign-ins keeps its default; `Auth.e2e.ts` checks it. Never change or delete the admin in a test.

Rules: every test registers its own user (`tests/e2e/helpers.ts`), so tests are independent and
can run in any order. Use `signOut(page)`, which waits for sign-out to finish, before visiting a
page that must be signed out.

What's covered: public pages, i18n switching, protected-route redirects (with locale), the full
session lifecycle, **token refresh through the proxy** (access cookie removed → page still loads,
refresh token rotated), auth errors, the failed-sign-in limit, form validation, test-results CRUD
with the summary, file upload/download/delete with type and size errors, admin user
management (hidden from regular users, search, role change, delete, no self-edit), and dated pages
hydrating without a mismatch in a browser at UTC+14 (`I18n.e2e.ts`).

The CRM specs. Their helpers are in `tests/e2e/crm/helpers.ts`: `expectNoA11yViolations` (axe on
a page or an open dialog, once it has its title and has stopped animating), `createWorkspace`,
`expectDashboard`, the API seeding (`registerUser`, `seedWorkspace`, `addMember`, `seed`,
`stagesOf`, `stageOf`, `apiCall`: accounts, members and records made through the API, which is how
a test gets 25 companies or a second rep without clicking), the UI creators (`createCompany`,
`createContact`, `createLead`, `changeStatus`), the board (`column`, `handleOf`, `drag`,
`dragAndSave`, `untilSaved`, below), the API's figures as the English pages write them (`money`,
`dayLabel`, `periodLabel`, `monthLabel`), `COMPANY_COLUMNS` (the company export's header row),
`waitForHydration` (a form typed into before React hydrates it loses what was typed) and
`expectNoSidewaysScroll`:

| Spec | Covers |
|---|---|
| `tests/e2e/Workspace.e2e.ts` | First workspace from the create form (browser time zone), the shell and its skip link, the switcher between workspaces, "Workspace not found" for non-members, the rail as a drawer on a phone in Thai |
| `tests/e2e/crm/Settings.e2e.ts` | Rename and currency, the 409 reload, the last owner (own-role confirmation, leave note), invitation links (shown once, in the inviter's language, revoke), stages (add, move by button and keyboard drag, rename, delete; Won and Lost pinned), a pipeline or source changed in another tab, lead sources, display name and password, an expired session in an action, dark and Thai from the account menu, every settings page at 390 px in Thai |
| `tests/e2e/crm/Invitation.e2e.ts` | Registering through a link, joining signed in (also after the access cookie expired), a link for another email, an existing account sent to sign in and back, accepted, revoked, expired and unknown links, a phone in Thai |
| `tests/e2e/crm/Records.e2e.ts` | A company (a look-alike warns, saving stays possible) and a contact at it; a call logged on the contact showing on the company's timeline; a lead marked contacted and qualified, then converted into a linked company, a contact and a 1,250.00 EUR deal, once even when double-clicked; a task due tomorrow on the deal, completed from `/tasks` and found under completed; search, sort, filters and pages over 25 API-seeded companies, with a member's removal leaving their companies "Unassigned"; a hand-edited URL falling back to the defaults; a search over 200 characters showing the reset notice, not an error page; a second tab's stale edit showing the reload message; the Unqualify and Convert dialogs scrolling to their buttons on a short phone; the record pages with long Thai text at 390 px |
| `tests/e2e/crm/Pipeline.e2e.ts` | Every stage on the board; a pointer drag between stages (persists, history, the stamp row signed by whoever moved the deal into each stage); keyboard drag and "Move to…"; Lost asking for a reason (board and Move dialog) and cancelling moving nothing; a drop outside every column cancelling; a sales rep with no handle, menu, Move, Edit or Archive on another rep's deal, and a forged move refused (below); "Workspace not found" for another workspace's deal; the board on a phone (one column, menu moves) and the board and list in Thai at 390 px |
| `tests/e2e/crm/TopBar.e2e.ts` | Record search from ⌘K (2 characters, groups with record numbers, archived records left out, Enter and click open); the reminders bell counting what the API counts, a task completed from the popover or the list lowering it on the next navigation, a reminder made meanwhile picked up without a reload, no badge at 0; the bar at 390 px in Thai |
| `tests/e2e/crm/Dashboard.e2e.ts` | An empty workspace's first records; every figure and the period as the API answered (counts, the open pipeline per currency, won and lost, stages); hand-edited periods falling back to the default, never an error page; the picker's presets and a custom range; an overdue task completed from the follow-ups lowering the counts and the bell; a rep's own deals and follow-ups; 390 px in Thai |
| `tests/e2e/crm/Reports.e2e.ts` | Each tab from its URL and the rail, by keyboard; the pipeline (by stage and owner, each currency apart), won and lost by month, the funnel (with the late-history caution), activities by member and follow-ups (first items, "and N more" to the list), all compared with the API's own answers; hand-edited periods; the period kept across tabs; a rep's whole-workspace view; every tab at 390 px in Thai |
| `tests/e2e/crm/Audit.e2e.ts` | The filtered companies downloaded byte for byte as the backend's CSV, under its name, and recorded in the trail; a rep without the export or the trail, and the route refusing them; a record's History and the trail's filters; an expired access token refreshed before the export, a rejected session sent to sign in and back; no export for `HEAD` or a cross-site request (same-site too: the route's `route.test.ts`) |
| `tests/e2e/crm/Journey.e2e.ts` | The brief's 10-step journey in one test (below) |
| `tests/e2e/Landing.e2e.ts` | The public landing and About pages: sign-up and sign-in links, Thai and French, the captures and the sample-product note, the hero in the app's theme, accessibility at 390 and 1440 px in both themes |
| `tests/e2e/Auth.e2e.ts` | Also the CRM's redirects: `/app` deep links keep `?next=`, sign-in and sign-up keep it between them; five requests refreshing one expired session at once, none sent to sign in; another site's link to `/api/session/expired` signing nobody out, while a deleted account arriving from another site is still signed out |
| `tests/e2e/Security.e2e.ts` | The app attacked as a browser, another site or a curious member could: tokens only in httpOnly cookies, never in a page, payload or script; a just-rotated refresh token getting the same new pair, then nothing; server actions refusing another origin, another workspace's id, a role the caller lacks and a 10 MB body under any first segment (413), and failing without the server's error; another site unable to export a list or frame a page; no redirect to another site, no password in a URL, lists surviving hostile URLs, the CRM behind sign-in whatever the request claims; a rep's pages without what the role hides, typed text never markup, files only as sandboxed downloads, each security header's value, the public site static. Its unit side is `src/proxy.security.test.ts`: the proxy's matcher (every request with a body included) and `Secure` cookies over https |

### The end-to-end journey

`Journey.e2e.ts` walks the CRM brief's end-to-end list (§8) in its order, as one test with a step
per item: one owner works through the UI, and the other people (a member of another workspace, a
sales rep) and the bulk data come from the API helpers. Each step checks:

1. **Sign in**: an account made through the API signs in through the form and lands on "Create your first workspace".
2. **Create a workspace** through the form (EUR, Europe/Paris), which opens on its dashboard.
3. **A company and a contact** at it, through the forms; the contact shows on the company's page.
4. **A lead**, then Contacted and Qualified from its status menu.
5. **Conversion**: linked to the existing company, a new contact, a 1,250.00 EUR deal; the deal's page shows the amount, company and contact.
6. **The pipeline**: the deal dragged through every open stage to Won, each move reloaded to check the server kept it; the deal's stage history lists the five entries and the stamp row has every stage signed by the owner.
7. **A follow-up task** on the deal, due today at 9:00 in the workspace's zone: the bell counts it on the next page, as the API does; completed, the bell drops to 0 on the next page, and the API agrees.
8. **The dashboard and reports** against the API's answers for the same period: the counts (1 company, 2 contacts, no open lead or deal, nothing overdue), 1 won deal worth €1,250.00, the period's label; every month of won and lost; every funnel stage, Won reached by 1 of 1.
9. **Access**: a member of another workspace gets "Workspace not found" on every page the journey made, and 404 from the API for a read and a change; a sales rep reads the owner's records without Edit, Archive or Move, has no Export on the lists, is refused by the export route (403, translated), sees a handle only on their own card, and a forged move of the owner's won deal shows "Your role doesn't allow this." and moves nothing.
10. **Lists**: 24 API-seeded companies (4 the rep's, 2 archived): pages of 20, name descending, a search that keeps the sort, the owner filter, the archived view; the filtered list's export is byte for byte the backend's file, with the header row and the rep's three companies.

### Dragging and forged actions

dnd-kit's sensor needs the pointer to travel, so `dragTo` is too fast: `drag` (in the helpers)
presses with `page.mouse`, moves in steps and releases (the keyboard works too: focus the handle, Space,
the arrows, Space). The board scrolls sideways inside the page, so a card of a late stage is the
one to drop on Lost. Wait for the server's answer (`page.waitForResponse` on the action's POST,
which carries a `Next-Action` header) before reloading: a reload cancels a request still on its
way.

A server action can be called with another id than the UI meant. The forged-move test moves the
rep's own deal through the real UI, and `page.route` rewrites the deal id in the action's request
body (a JSON array of its arguments, `[workspaceId, dealId, { stageId, version }]`) to another
rep's deal: the backend's 403 must show as the translated toast, and nothing may move.

## Accessibility

`Showcase.e2e.ts` opens every app route and runs axe-core (WCAG 2.1 A + AA) with reduced motion.
Known violations are listed per route in `tests/e2e/a11y-baseline.json`; anything else fails.
When a listed rule no longer occurs, the test adds an `a11y-baseline` annotation: remove the entry,
so the list only shrinks. Don't add entries to get green; fix the violation. The demos' links are
also checked for contrast in the dark theme.

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
