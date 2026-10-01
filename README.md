# Next.js + Spring Boilerplate (frontend)

A **Next.js 16** (App Router, React 19, TypeScript, Tailwind v4) frontend for the
[spring-postgres-boilerplate](https://github.com/neszaDev/spring-postgres-boilerplate) API:
sign-up/sign-in with the backend's JWT and rotating refresh tokens (kept in httpOnly cookies), a
protected dashboard, a test-results CRUD example, i18n (en/fr), a designed UI on shadcn/ui
(a sample product, "Marksheet", see [the redesign plan](docs/plans/0002-ui-redesign.md)), and a CI/CD pipeline that tests the
real frontend image against the real backend image.

Based on [Next.js Boilerplate](https://github.com/ixartz/Next-js-Boilerplate) by ixartz (MIT); the
auth provider, database and SaaS integrations were replaced by the Spring backend.

## Prerequisites

- **Node.js 24+** and **pnpm** (`corepack enable` picks the pinned version)
- **Docker**, to run the backend locally (the published backend image, no Java needed)
- `make`

## Quick start

```sh
make setup        # pnpm install (+ git hooks), Playwright browser, env/.env
make backend-up   # Postgres + backend API on http://localhost:8080
pnpm dev          # frontend on http://localhost:3000
```

Sign up at `/sign-up`, then open *Test results*. `make up` runs everything in containers instead.

## Commands

| Command | What it does |
|---|---|
| `make fmt` | Format and auto-fix lint issues |
| `make lint` | Lint, type check, unused code/deps (knip), i18n keys |
| `make test` | Unit + UI component tests |
| `make verify` | Everything CI's `verify` job runs (lint + tests + production build) |
| `make e2e` | Playwright against `pnpm dev` + the backend |
| `make e2e-image` | Playwright against the production image, as CI does |
| `make api-types` | Regenerate API types from the backend's OpenAPI spec |
| `make up` / `make down` | Full stack in containers / stop it |

Run `make` to list them all.

## Project layout

```
src/app/[locale]/   pages: (marketing) public, (auth) sign-in/up + protected dashboard
src/actions/        server actions (sign-in/up/out, create/delete test results)
src/libs/api/       typed backend client, read queries, error mapping, generated schema
src/proxy.ts        i18n routing + auth (protects /dashboard, refreshes tokens)
tests/e2e/          Playwright, always against the real backend
docker/  env/  scripts/  docs/  .github/   same roles as in the backend repo
```

## Documentation

| Guide | Covers |
|---|---|
| [Architecture](docs/architecture.md) | Request flow, auth/session design, where code goes |
| [Backend integration](docs/backend-integration.md) | Typed client, regenerating types, errors, adding an endpoint |
| [Configuration](docs/configuration.md) | Every environment variable |
| [Testing](docs/testing.md) | Unit, UI and end-to-end tests |
| [CI/CD](docs/ci.md) | Branches, workflows, image publishing, releasing |
| [Contributing](.github/CONTRIBUTING.md) | Branches, commits, PR checklist |
| [AGENTS.md](AGENTS.md) | Rules for AI coding agents (also a good checklist for humans) |
| [Plan](docs/plans/0001-frontend-setup.md) | Why the repo is set up this way |
| [UI plan](docs/plans/0002-ui-redesign.md) · [DESIGN.md](DESIGN.md) | The redesign and its design system |

## Deploying

CI/CD publishes the tested image to `ghcr.io/neszadev/nextjs-boilerplate`: `:dev` from `dev`,
`:latest` / `:1.2.3` from `main` and tags after approval. Run it with `BACKEND_URL` (where the
server reaches the API) and `APP_URL` (its public URL; `https://` makes cookies `Secure`).
