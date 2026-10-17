# Aureon CRM web

The web app of **Aureon CRM**, a multi-user CRM for small and medium-sized businesses, on
**Next.js 16** (App Router, React 19, TypeScript, Tailwind v4, shadcn/ui, next-intl). Every
business is a workspace; people join one through an invitation link and get a role in it. Today
the app has sign-in and sign-up, the workspace picker and the CRM shell, workspace settings,
members and invitation links, the pipeline's stages and the lead sources, in English, French and
Thai, in light and dark themes. Companies, contacts, leads, deals, tasks and the dashboard follow
([the plan](docs/plans/0004-crm.md)).

Its backend is [aureon-crm-api](https://github.com/neszaDev/aureon-crm-api) (Spring Boot and
PostgreSQL). The CRM's specification, data model, permission matrix and REST contract live there,
in [`docs/crm/`](https://github.com/neszaDev/aureon-crm-api/tree/feat/crm/docs/crm) (on its
`feat/crm` branch, like this app's CRM, until both are merged). Only the Next.js
server talks to it: the browser never sees a token (they stay in httpOnly cookies), and the API
types are generated from its OpenAPI spec.

The repo was split from [nextjs-boilerplate](https://github.com/neszaDev/nextjs-boilerplate),
itself based on [Next.js Boilerplate](https://github.com/ixartz/Next-js-Boilerplate) by ixartz
(MIT). The boilerplate's demo pages stay at `/dashboard/**` as a component gallery.

## Prerequisites

- **Node.js 24+** and **pnpm** (`corepack enable` picks the pinned version)
- **Docker**, and a checkout of [aureon-crm-api](https://github.com/neszaDev/aureon-crm-api) to
  run the backend (its `make up` builds and runs it in Docker; no Java needed)
- `make`

## Quick start

1. The API, in a checkout of aureon-crm-api on its `feat/crm` branch:

   ```sh
   make setup   # creates its env/.env: set JWT_SECRET and APP_PORT=8081 there (for the
                # end-to-end tests also the admin and rate limits in docs/testing.md here)
   make up      # Postgres + the API on http://localhost:8081
   ```

2. The app, here:

   ```sh
   make setup   # pnpm install (+ git hooks), Playwright browser, env/.env:
                # set BACKEND_URL=http://localhost:8081 there
   pnpm dev     # the app on http://localhost:3000
   ```

Sign up at `/sign-up` and create your first workspace. The end-to-end tests run against the same
API, one worker at a time:

```sh
pnpm exec playwright test --project=chromium --workers=1
```

`make backend-up`, `make e2e` and `make up` here start the API from a published image, which
doesn't exist yet (see [configuration](docs/configuration.md#local-docker-stack-envenv)).

## Commands

| Command | What it does |
|---|---|
| `make fmt` | Format and auto-fix lint issues |
| `make lint` | Lint, type check, unused code/deps (knip), i18n keys |
| `make test` | Unit + UI component tests |
| `make verify` | Lint, unit + UI tests and the production build, as in CI |
| `make e2e` | Playwright against `pnpm dev` + the backend container |
| `make e2e-image` | Playwright against the production image, as CI does |
| `make api-types` | Regenerate API types from the backend's OpenAPI spec |
| `make up` / `make down` | Full stack in containers / stop it |

Run `make` to list them all. Against the API repo on 8081, regenerate the types with
`BACKEND_URL=http://localhost:8081 pnpm api:types`.

## Project layout

```
src/app/[locale]/   pages: (marketing) public, (auth) sign-in/up, invite links, app/** (the CRM)
                    and dashboard/** (the boilerplate's demos)
src/components/crm/ the CRM: shell/ (rail, switcher, account menu), settings/, seals, forms
src/actions/        server actions (auth; crm/: workspaces, members, invitations, pipeline, sources)
src/libs/api/       typed backend client, read queries (CrmQueries.ts), error mapping, schema
src/proxy.ts        i18n routing + auth (protects /app and /dashboard, refreshes tokens)
tests/e2e/          Playwright, always against the real backend (crm/: the CRM flows)
docker/  env/  scripts/  docs/  .github/   same roles as in the API repo
```

## Pulling boilerplate updates

The boilerplate stays a remote, so its fixes (dependency advisories, auth, CI) can be merged in:

```sh
git remote add boilerplate https://github.com/neszaDev/nextjs-boilerplate.git   # once
git fetch boilerplate
git switch -c chore/boilerplate-sync dev
git merge boilerplate/dev        # resolve conflicts, keeping the CRM's names and copy
```

Then run `make verify` and the end-to-end tests, and open a PR into `dev`.

## Documentation

| Guide | Covers |
|---|---|
| [Architecture](docs/architecture.md) | Request flow, auth/session design, the CRM's routes and shell, where code goes |
| [Backend integration](docs/backend-integration.md) | Typed client, regenerating types, errors, adding an endpoint |
| [Configuration](docs/configuration.md) | Every environment variable |
| [Testing](docs/testing.md) | Unit, UI and end-to-end tests, and running the CRM specs locally |
| [CI/CD](docs/ci.md) | Branches, workflows, image publishing, releasing |
| [Contributing](.github/CONTRIBUTING.md) | Branches, commits, PR checklist |
| [AGENTS.md](AGENTS.md) | Rules for AI coding agents (also a good checklist for humans) |
| [PRODUCT.md](PRODUCT.md) · [DESIGN.md](DESIGN.md) | Who the CRM is for, and its design system |
| [CRM plan](docs/plans/0004-crm.md) | How the CRM frontend is built, slice by slice |
| [Setup plan](docs/plans/0001-frontend-setup.md) | Why the repo is set up this way |

## Deploying

Nothing is deployed yet: the project runs locally only. When it is, CI/CD publishes the tested
image to `ghcr.io/neszadev/aureon-crm-web`: `:dev` from `dev`, `:latest` / `:1.2.3` from `main`
and tags after approval. Run it with `BACKEND_URL` (where the server reaches the API) and
`APP_URL` (its public URL; `https://` makes cookies `Secure`).
