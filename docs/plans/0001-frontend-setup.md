# Frontend setup plan: Next.js Boilerplate → frontend for the Spring API

## Context

The backend ([spring-postgres-boilerplate](https://github.com/neszaDev/spring-postgres-boilerplate))
was hardened into a production-style repository (see its `docs/plans/0001-repository-hardening.md`).
This repo starts from [ixartz/Next-js-Boilerplate](https://github.com/ixartz/Next-js-Boilerplate)
at commit `9df22d0` (MIT), imported as a single commit, and adapts it to:

1. use the backend for authentication and data, and
2. follow the same repository structure and delivery model as the backend.

## Decisions (made with the owner, 2026-09-30)

| Question | Decision | Why |
|---|---|---|
| Where does the frontend live? | Separate repo, not a fork | Independent CI/CD and image; the backend repo stays unchanged. A fork of a public repo stays public and linked to upstream. |
| Login | The backend's JWT + refresh tokens, kept in httpOnly cookies by the Next.js server | One source of truth for users; no external auth service; tokens never reach browser JS |
| SaaS integrations and the frontend DB | Removed | Each needed an account; the DB duplicated the backend's. Re-add one only with a recorded decision. |
| Package manager | pnpm (pinned via `packageManager`) | Matches the team's other Next.js project; strict dependency resolution |

## Removed from upstream

Clerk; Drizzle ORM, PGlite, migrations and the Counter demo; Arcjet; Sentry and Spotlight;
PostHog; Better Stack log shipping; Checkly; Crowdin; Codecov; CodeRabbit; Chromatic visual tests;
semantic-release; demo/sponsor pages and assets; funding config; the agent instruction that
advertised a paid product.

## Kept from upstream

Next.js 16 App Router, React 19 + React compiler, TypeScript, Tailwind v4, next-intl (en/fr),
react-hook-form + zod, t3-env, LogTape (console), `translation-resilience`, Vitest (unit + browser
mode), Playwright, Storybook, oxlint/oxfmt via ultracite, knip, lefthook + commitlint, the
VS Code setup, and upstream's code conventions (now in `AGENTS.md`).

## Added

- **Backend integration:** typed client generated from the backend's OpenAPI spec
  (`openapi-fetch`, `make api-types`); server actions for auth and test results; a query layer;
  the auth proxy with token refresh; `ApiError` mapping; dashboard + test-results pages.
- **Structure matching the backend:** `docker/` (Dockerfile + compose with the backend image),
  `env/`, `scripts/`, `docs/`, Makefile with the same target names, `AGENTS.md` + `CLAUDE.md` +
  `.claude/settings.json`, and the backend's CI/CD model (`ci.yml`, `cd-dev.yml`, `cd-main.yml`,
  reusable `publish-image.yml`, `cleanup-pr-cache.yml`, Dependabot against `dev`, PR template,
  `.github/CONTRIBUTING.md`).
- **Tests:** unit tests for session/error/validation logic; E2E against the real backend,
  including token refresh through the proxy. CI runs E2E against the production image.

## Problems found and solved while building

| Problem | Fix |
|---|---|
| pnpm exposed undeclared imports (`vite`, `@clerk/shared`) hidden by npm's flat install | Declared `vite`; Clerk removed |
| `openapi-typescript` needs the TypeScript 5 compiler API; the project uses TypeScript 7 | Run it via `pnpm dlx` with pinned versions instead of a dependency |
| React compiler rejects `api.GET(...)` in server components | Query layer (`Queries.ts`) |
| Standalone build misses files under pnpm's symlinked layout (`@swc/helpers`) | Hoisted install in the image only, and call `next` directly (`pnpm exec` would reinstall) |
| `next start` isn't meant for standalone output | E2E in CI runs against the Docker image itself |
| macOS case-insensitivity kept the upstream `CI.yml` name, which the CD workflows couldn't call | Case-only rename to `ci.yml` |

## Out of scope / next

- Deploying the image to a host (same open question as the backend).
- Versioned contract between the two repos: E2E uses the backend's `:dev` image; pin
  `BACKEND_TAG` to release tags once both sides tag releases.
- Business features (e.g. an HR app) and roles/permissions: see the backend's proposed plan 0002.
