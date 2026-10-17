# Contributing

## Setup

```sh
make setup       # dependencies, git hooks (lefthook), Playwright browser, env/.env
make verify      # should pass before you change anything
```

The end-to-end suite needs the API: run [aureon-crm-api](https://github.com/neszaDev/aureon-crm-api)
(`feat/crm`) with its `make up` and `APP_PORT=8081`, then
`BACKEND_URL=http://localhost:8081 pnpm exec playwright test --project=chromium --workers=1`
([testing](../docs/testing.md#the-crm-backend)). `make e2e` needs the API image, which isn't
published yet.

## Workflow

1. Branch from `dev`: `feat/…`, `fix/…`, `chore/…`, `docs/…`, `ci/…`, and open the PR against
   `dev`. Never push directly to `dev` or `main`; releases are a `dev` → `main` PR
   ([CI/CD](../docs/ci.md#releasing)).
2. Small, focused commits; mechanical changes (formatting, renames) in their own commits.
3. Before pushing: `make verify`, plus the end-to-end suite if you touched pages, actions, auth or
   the proxy.
4. Open a PR and fill in the checklist. CI must pass (the **CI Gate** check).

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), checked by lefthook and commitlint:
`type: summary`, types `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`,
`chore`, `style`, `revert`; `BREAKING CHANGE:` footer when needed.

## Definition of done

- `make verify` passes (and the end-to-end suite for behaviour changes).
- New behaviour is tested ([Testing](../docs/testing.md)).
- User-visible text is in every `src/locales/*.json`.
- Backend API changes: `make api-types` run and `schema.d.ts` committed.
- New config documented in [Configuration](../docs/configuration.md) and `env/.env.example`.

Full conventions and the "don't do this" list: [AGENTS.md](../AGENTS.md). They apply to humans too.
