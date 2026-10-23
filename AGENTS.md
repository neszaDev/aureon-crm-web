# AGENTS.md

Instructions for AI coding agents (and a quick reference for humans) working in this repository.
Keep this file the single source of truth; `CLAUDE.md` only imports it.

## What this is

**Aureon CRM web**: the Next.js 16 (App Router) web app of Aureon CRM, a multi-tenant CRM for
small and medium-sized businesses. Its API is
[aureon-crm-api](https://github.com/neszaDev/aureon-crm-api) (Spring); the CRM's specification,
permission matrix and REST contract live in that repo's `docs/crm/` (branch `feat/crm`). The
Next.js **server** talks to the API: sign-in/sign-up/sign-out, the CRM at `/app` (workspaces,
members and invitation links, pipeline stages, lead sources, settings) and the demo gallery
inherited from [nextjs-boilerplate](https://github.com/neszaDev/nextjs-boilerplate) at
`/dashboard` (test results, files, admin users). The boilerplate stays the `boilerplate` git
remote for updates. Tokens live in httpOnly cookies and never reach browser JS. Who the product
is for: [PRODUCT.md](PRODUCT.md); its look: [DESIGN.md](DESIGN.md).
Architecture: [docs/architecture.md](docs/architecture.md). Guides:
[user guide](docs/user-guide.md) · [configuration](docs/configuration.md) · [backend integration](docs/backend-integration.md) ·
[testing](docs/testing.md) · [CI/CD](docs/ci.md).

## Layout

```
src/app/[locale]/(marketing)/   public pages (home, about)
src/app/[locale]/(auth)/        (center)/ sign-in, sign-up, invite/[token]; app/** (the CRM);
                                dashboard/** (the boilerplate's demos)
src/actions/                    server actions: the only place that mutates via the backend
src/app/api/                    route handlers: session/expired (ends a rejected session), crm/[workspaceId]/export/[list]
                                (a list's CSV, streamed from the backend)
src/actions/crm/*               CRM writes: workspaces, members, invitations (create, accept), pipeline, sources,
                                companies, contacts, leads (status, convert), deals (move), tasks, activities; and the
                                reads client components make: the ⌘K search, the pickers, the bell's refresh, older history
src/libs/api/                   Backend.ts (typed client), Queries.ts (reads for pages), ApiError.ts,
                                ActionFailure.ts, Session.ts, schema.d.ts (GENERATED, see below)
src/libs/api/CrmQueries.ts      CRM reads for pages (workspaces, members, invitations, stages, sources, records, lists, the
                                caller's reminders: the workspace layout reads them on every render, the bell again on each navigation;
                                the dashboard, the five reports)
src/libs/api/RecordSearch.ts    the list searches behind the pickers (`searchRecords`) and the ⌘K record search (`searchAll`)
src/libs/crm/*                  CRM logic: Permissions (`can`), RecordAccess (who may edit a record), WorkspaceId,
                                Stages, PageMetadata, OpenWorkspace (`getOpenWorkspace`: a page's workspace, 401
                                and 404 handled), Format (money, dates, record numbers), ZonedTime (workspace-zone
                                inputs), ListQuery (a list's state from its URL), DealHistory (the status track's movers),
                                Reminders (the bell's count and its "20+"), PeriodQuery (a dashboard's or report's
                                `?from&to`, read leniently, and the picker's presets), Reports (the
                                report tabs: `?tab=`, which take a period), Audit (the trail's record types and URL state)
src/libs/Auth.ts                session cookie rules (names, lifetimes, flags)
src/proxy.ts                    i18n routing + auth: protects /app and /dashboard, refreshes tokens (for /api/crm too)
src/validations/                zod schemas mirroring the backend's request rules (CRM: crm/*)
src/components/ui/              shadcn/ui primitives (themed; add with `pnpm dlx shadcn add`)
src/components/report/          Marksheet domain UI: marks, totals, results table (demos only)
src/components/marketing/       the public landing page: hero capture, section row and developer note, capture sheet
src/components/crm/**           the CRM: shell/ (rail, collapsible sidebar, location, + New, switcher, account menu, record search, reminders bell), settings/, seals, dashboard/
                                (the home: KPI strip, my deals, follow-ups, pipeline, won and lost, stages, recent activity and changes),
                                audit/ (`AuditEventItem`, `AuditTrail`, `RecordHistory`), reports/ (the tabs and a panel per report, `ChartTable`),
                                PeriodPicker, and per record:
                                company/ contact/ lead/ deal/ task/ activity/, with the shared list/ (list kit),
                                record/ (header, facts, archive) and fields/ (pickers, owner, date and time)
src/components/ src/templates/  UI (MarketingTemplate, AppShell); src/locales/*.json  all user-visible text
tests/e2e/                      Playwright, always against the real backend (crm/*: the CRM specs and their helpers;
                                Journey.e2e.ts: the brief's 10-step journey)
public/landing/                 the landing page's real captures of the app (`scripts/capture-landing.ts`; its README)
docker/  env/  scripts/  docs/  same roles as in the API repo (docs/user-guide.md: the CRM's workflows)
```

## Commands

| Task | Command |
|---|---|
| Format + autofix | `make fmt` |
| Lint, types, unused code, i18n keys | `make lint` |
| Unit + UI tests | `make test` |
| Lint + tests + build, as in CI | `make verify` |
| Backend for local dev | the API repo's `make up` with `APP_PORT=8081`, then `BACKEND_URL=http://localhost:8081` in `env/.env` and `pnpm dev` |
| End-to-end (dev server + backend) | `pnpm exec playwright test --project=chromium --workers=1` (one worker; never beside a Maven build) |
| End-to-end as CI does (containers) | `make e2e-image` (needs the API image, not published yet) |
| Regenerate API types | `BACKEND_URL=http://localhost:8081 pnpm api:types` (CI fails when they are out of date: `make api-check`) |

`make backend-up` and `make e2e` pull `ghcr.io/neszadev/aureon-crm-api`, which isn't published
yet (publishing needs the owner's approval): run the API repo instead
([testing](docs/testing.md#the-crm-backend)).

Use `pnpm` (version pinned in `package.json` → `packageManager`), never npm or bun.

## Definition of done

1. `make verify` passes; the end-to-end suite too when pages, actions, auth or the proxy changed.
2. New behaviour has a test: `*.test.ts` (logic), `*.test.tsx` (component), `*.e2e.ts` (flows).
3. `git status` shows only intended files. Never commit `env/.env`, `.next/`, test reports.
4. Conventional Commits: `type: summary` (`feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`),
   checked by lefthook locally and commitlint in CI.

## Backend integration rules

- Talk to the backend only from the server: `src/actions/*` (writes), `src/libs/api/Queries.ts`
  (reads for server components) and the CSV export route (`src/app/api/crm/`). Never call the
  backend from client components or `fetch` it by hand; use the typed client from `Backend.ts`.
- `schema.d.ts` is **generated**: after a backend API change run `make api-types` and commit it.
  Type errors that follow are the point: fix the callers.
- The backend's error body is `ApiError` (`components.schemas.ApiError`, re-exported by
  `ApiError.ts`). Decide by its `code` (`errorCode`), never by its message text. Map
  failures with `toActionError` (CRM actions: `actionFailure`): the message is the `ApiError`
  translation of the code, or of the status for an error without one; a 401 ends the session, as
  the CRM rules below say.
- Keep zod rules in `src/validations/` in sync with the backend's request constraints.

## CRM rules

- **Tokens are never logged**: access, refresh and invitation tokens. No logger call receives
  one; backend paths go through `redactPath` (`ApiError.ts`); `next.config.ts` keeps invite URLs
  and Server Function arguments (passwords) out of the dev log; invite pages send no `Referer`.
- **`?next=` only through `safeNextPath`** (`src/libs/SafeRedirect.ts`, `/app/**` and
  `/invite/**`); never redirect to a raw query value.
- **A backend 401 ends the session**: pages and layouts can't delete cookies, so they call
  `endRejectedSession` (`/api/session/expired`); never redirect a page straight to `/sign-in`
  (the proxy still sees the cookie: a loop). Server actions end it through `actionFailure`
  (`redirectIfUnauthorized`), which clears the cookies and goes to `/sign-in?expired=1`, but keeps
  them when the request sent no access token (a parallel request may have just refreshed them).
  The export route does the same and answers a bare 401, which its button turns into sign-in.
  A 5xx throws to the error boundary; a 404 on the workspace is `notFound()`.
- **Record forms always send the `version` they read and the current owner** (`ownerId` /
  `assigneeId`; `null` unassigns). A stale version is `VERSION_CONFLICT`: `actionFailure` turns
  it into "Someone else changed this" with `conflict: true`, and the UI offers a reload.
- **Permissions come from `GET /workspaces/{id}` → `permissions`**: hide what `can()` denies,
  and still handle the backend's 403 (`ForbiddenNotice`, or the refusal in a toast or form).

## Files that need extra care

| Path | Rule |
|---|---|
| `src/proxy.ts`, `src/libs/Auth.ts`, `src/actions/AuthActions.ts` | Auth: cookies stay `httpOnly`; a failed refresh must not delete cookies (parallel requests race on rotation). Change only with `tests/e2e/Auth.e2e.ts` green. |
| `src/libs/Env.ts` | Every env var is declared and validated here; never read `process.env` elsewhere. `BACKEND_URL` stays server-only (no `NEXT_PUBLIC_`). |
| `src/libs/api/schema.d.ts` | Generated. Never edit by hand. |
| `docker/Dockerfile` | Hoisted install + direct `next` binary are required for the standalone build; keep the runtime non-root. Check with `make e2e-image`. |
| `.github/workflows/` | Checks live only in `ci.yml`, publishing only in `publish-image.yml`; `cd-*.yml` just call them. |

## Forbidden shortcuts

- Skipping or weakening checks: `test.skip`, `.only`, deleting assertions, `oxlint-disable` to
  silence a real finding, `--no-verify`, or excluding files from lint/knip to get green.
- Storing tokens anywhere but httpOnly cookies (no localStorage, no `NEXT_PUBLIC_` secrets).
- Hard-coded user-visible strings, or adding a key to only one locale.
- Adding a third-party service/SDK (analytics, monitoring, auth provider) without a decision
  recorded in `docs/plans/`.
- Force-pushing or committing directly to `dev` or `main`: use a branch and a PR into `dev`.

## Code conventions

- Clarity and consistency over cleverness. Minimal changes. Match existing patterns.
- TypeScript everywhere; no `any` unless isolated and necessary. Avoid casting; use narrowing.
- No unnecessary `try/catch`. Named exports only (default exports only for Next.js pages/layouts).
- Absolute imports via `@/` unless same directory. Zod type-only: `import type * as z from 'zod';`.
- Let the compiler infer return types unless an annotation adds clarity.
- Options object for 3+ params, optional flags, or ambiguous args.
- Hypothesis-driven debugging: 1-3 causes, validate the most likely first.

### Styling
Tailwind v4 utility classes. Reuse shared components (`src/components/ui`, `src/components/report`)
and the tokens in `src/styles/global.css`; see `DESIGN.md`. Responsive. No unnecessary classes.

### React
- No `useMemo`/`useCallback` (React compiler handles it). Avoid `useEffect`.
- Single `props` param with inline type; access as `props.foo` (no destructuring).
- Use `React.ReactNode`, not `ReactNode`. Inline short event handlers.
- Server components can't call capitalised functions (React compiler): put backend reads in
  `Queries.ts` instead of calling `api.GET(...)` in a page.
- Show a server action's `fieldErrors` with `applyFieldErrors` (`src/libs/form/`), never a bare
  `setError` loop (`make lint` fails on `.setError(` outside `src/libs/form/`): `setError` edits
  `errors` in place, which the compiled (production) form does not see. It returns the result for
  the form's alert, which says what the backend said about an error that belongs to no field
  (`setFailure(applyFieldErrors(form, result, toField))`). Vitest compiles with the React Compiler
  too, so a test that asserts the error text and `aria-invalid` catches it; the e2e suite should
  also pass against `pnpm build` + `next start`.
- Await a server action in a client component through `useSettle` (`src/utils/SettleAction.ts`):
  `await settle(action(...))`. An action rejects outright when the browser is offline, the server
  can't be reached or it fails on the action; from a transition that throws to the error boundary
  and blanks the page, and in a form it leaves nothing on screen. `settle` turns it into a failed
  result, which the usual feedback shows (a toast for a row action, `ActionAlert` in a form or
  dialog): "couldn't reach the server" when the request never got through (fetch's `TypeError`),
  the generic "that didn't work" when the server failed on it. A dialog that sends a request stays
  open while it is on its way (`useInFlight`, `src/utils/InFlight.ts`).
- A form that stays mounted after a save has to clear or rebase its fields in a way that still
  works once compiled. The React Compiler (production builds, and the vitest `ui` project) runs
  `form.register(...)` once per field instead of on every render, and react-hook-form finds a
  field's input through that one registration. A form whose `register` runs on every render is
  exempt; the save-twice test is the gate, not this rule. To clear fields, call `form.resetField`
  for each: `form.resetField('subject')` back to its default, or
  `form.resetField('occurredAt', { defaultValue: now })` to a new one (`form.reset(...)` clears
  them the first time and never again). To rebase on what was saved (`form.reset(values)`), pass
  `{ keepFieldsRef: true }`, or the next edit isn't tracked. Test it: save, retype, save again,
  and assert the second call carries the new values (and, for a clear, that the fields are empty
  again).

### Pages
- Default export name ends with `Page`. Props alias (if reused) ends with `PageProps`.
- Locale pages: `props: { params: Promise<{ locale: string }> }` → `await props.params` → `setRequestLocale(locale)`.
- Escape glob chars in shell commands for Next.js paths (`'src/app/[locale]/...'`).
- Dashboard pages sit behind auth; define meta once in the layout.

### i18n (next-intl)
- Never hard-code user-visible strings. New page namespaces end with `Page`.
- Server: `getTranslations`; Client: `useTranslations`. Sentence case. Use `t.rich(...)` for markup.
- Client messages: the root layout gives the public pages' client components only the `ErrorPage`
  and `LocaleSwitcher` namespaces (their HTML stays light); the `(center)`, `app` and `dashboard`
  layouts give theirs every message. A client component on a public page that translates another
  namespace needs it added in `src/app/[locale]/layout.tsx`.
- Zod messages are keys in the `Validation` namespace.

### JSDoc
- `/**` directly above the symbol; short, present-tense description.
- Order: description → `@param` → `@returns` → `@throws` (only if it can throw).

### Tests
- `*.test.ts` co-located with implementation; `*.e2e.ts` in `tests/e2e/`.
- Top `describe` = subject; nested `describe` groups scenarios.
- `it`/`test` titles: short, third-person present, `verb + object + context`, no period.
- E2E tests register their own user (`tests/e2e/helpers.ts`), never rely on order or shared data.
- Avoid mocking unless necessary.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
