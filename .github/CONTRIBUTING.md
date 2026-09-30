# Contributing

## Setup

```sh
make setup       # dependencies, git hooks (lefthook), Playwright browser, env/.env
make verify      # should pass before you change anything
make e2e         # needs Docker (starts the backend)
```

## Workflow

1. Branch from `dev`: `feat/…`, `fix/…`, `chore/…`, `docs/…`, `ci/…`, and open the PR against
   `dev`. Never push directly to `dev` or `main`; releases are a `dev` → `main` PR
   ([CI/CD](../docs/ci.md#releasing)).
2. Small, focused commits; mechanical changes (formatting, renames) in their own commits.
3. Before pushing: `make verify`, plus `make e2e` if you touched pages, actions, auth or the proxy.
4. Open a PR and fill in the checklist. CI (`verify` + `e2e`) must pass.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), checked by lefthook and commitlint:
`type: summary`, types `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`,
`chore`, `style`, `revert`; `BREAKING CHANGE:` footer when needed.

## Definition of done

- `make verify` passes (and `make e2e` for behaviour changes).
- New behaviour is tested ([Testing](../docs/testing.md)).
- User-visible text is in every `src/locales/*.json`.
- Backend API changes: `make api-types` run and `schema.d.ts` committed.
- New config documented in [Configuration](../docs/configuration.md) and `env/.env.example`.

Full conventions and the "don't do this" list: [AGENTS.md](../AGENTS.md). They apply to humans too.
