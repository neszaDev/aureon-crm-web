# AGENTS.md

Instructions for AI coding agents (and a quick reference for humans) working in this repository.
Keep this file the single source of truth; `CLAUDE.md` only imports it.

## What this is

A Next.js 16 (App Router) frontend for the
[spring-postgres-boilerplate](https://github.com/neszaDev/spring-postgres-boilerplate) API.
The Next.js **server** talks to the backend: sign-in/sign-up/sign-out, a protected dashboard,
owner-scoped test-results CRUD and file uploads, and admin user management. Tokens live in
httpOnly cookies and never reach browser JS.
Architecture: [docs/architecture.md](docs/architecture.md). Guides:
[configuration](docs/configuration.md) · [backend integration](docs/backend-integration.md) ·
[testing](docs/testing.md) · [CI/CD](docs/ci.md).

## Layout

```
src/app/[locale]/(marketing)/   public pages (home, about)
src/app/[locale]/(auth)/        sign-in, sign-up (centered) and dashboard/* (protected)
src/actions/                    server actions: the only place that mutates via the backend
src/libs/api/                   Backend.ts (typed client), Queries.ts (reads for pages),
                                ApiError.ts, schema.d.ts (GENERATED, see below)
src/libs/Auth.ts                session cookie rules (names, lifetimes, flags)
src/proxy.ts                    i18n routing + auth: protects /dashboard, refreshes tokens
src/validations/                zod schemas mirroring the backend's request rules
src/components/ui/              shadcn/ui primitives (themed; add with `pnpm dlx shadcn add`)
src/components/report/          Marksheet domain UI: marks, totals, results table
src/components/ src/templates/  UI (MarketingTemplate, AppShell); src/locales/*.json  all user-visible text
tests/e2e/                      Playwright, always against the real backend
docker/  env/  scripts/  docs/  same roles as in the backend repo
```

## Commands

| Task | Command |
|---|---|
| Format + autofix | `make fmt` |
| Lint, types, unused code, i18n keys | `make lint` |
| Unit + UI tests | `make test` |
| Lint + tests + build, as in CI | `make verify` |
| Backend for local dev | `make backend-up`, then `pnpm dev` |
| End-to-end (dev server + backend) | `make e2e` |
| End-to-end as CI does (containers) | `make e2e-image` |
| Regenerate API types | `make api-types` (CI fails when they are out of date: `make api-check`) |

Use `pnpm` (version pinned in `package.json` → `packageManager`), never npm or bun.

## Definition of done

1. `make verify` passes; `make e2e` too when pages, actions, auth or the proxy changed.
2. New behaviour has a test: `*.test.ts` (logic), `*.test.tsx` (component), `*.e2e.ts` (flows).
3. `git status` shows only intended files. Never commit `env/.env`, `.next/`, test reports.
4. Conventional Commits: `type: summary` (`feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`),
   checked by lefthook locally and commitlint in CI.

## Backend integration rules

- Talk to the backend only from the server: `src/actions/*` (writes) and `src/libs/api/Queries.ts`
  (reads for server components). Never call the backend from client components or `fetch` it
  by hand; use the typed client from `Backend.ts`.
- `schema.d.ts` is **generated**: after a backend API change run `make api-types` and commit it.
  Type errors that follow are the point: fix the callers.
- The backend's error body is `ApiError` (hand-written in `ApiError.ts`; not in its spec). Map
  failures with `toActionError`; handle 401 by redirecting to sign-in.
- Keep zod rules in `src/validations/` in sync with the backend's request constraints.

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

### Pages
- Default export name ends with `Page`. Props alias (if reused) ends with `PageProps`.
- Locale pages: `props: { params: Promise<{ locale: string }> }` → `await props.params` → `setRequestLocale(locale)`.
- Escape glob chars in shell commands for Next.js paths (`'src/app/[locale]/...'`).
- Dashboard pages sit behind auth; define meta once in the layout.

### i18n (next-intl)
- Never hard-code user-visible strings. New page namespaces end with `Page`.
- Server: `getTranslations`; Client: `useTranslations`. Sentence case. Use `t.rich(...)` for markup.
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
