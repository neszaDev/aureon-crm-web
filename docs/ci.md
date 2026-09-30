# CI/CD

Same model as the backend repo.

## Branches and environments

```
feature/* ──PR──▶ dev ──PR (release)──▶ main ──tag v1.2.3──▶ versioned image
                   │                     │
            CI/CD - dev            CI/CD - main
            publish :dev           approval, then publish :main :latest
```

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yml` (**CI**) | every pull request | `verify` + `e2e`; required to merge |
| `cd-dev.yml` (**CI/CD - dev**) | push to `dev` | CI, then publish `ghcr.io/<repo>:dev` |
| `cd-main.yml` (**CI/CD - main**) | push to `main`, tags `v*` | CI, **approval** on `main`, then publish `:main` + `:latest` or `:1.2.3` + `:1.2` |
| `publish-image.yml` | called by the two above | the only place image build + push is defined |
| `cleanup-pr-cache.yml` | PR closed | delete that PR's Actions caches |

Every image also gets `:sha-<short>`. Nothing is published unless CI (including E2E) passes for
the same commit.

## CI jobs

| Job | Runs | Local equivalent |
|---|---|---|
| `verify` | commitlint (PR commits), lint, types, knip, i18n keys, unit + UI tests, production build | `make verify` |
| `e2e` | builds the frontend image, starts it with the backend image (`BACKEND_TAG`, default `dev`) and Postgres, runs Playwright against it | `make e2e-image` |

On failure `e2e` uploads the Playwright report and prints container logs.

**Backend version:** E2E runs against the backend's `:dev` image. A backend change that breaks
the frontend shows up in the next frontend CI run; pin `BACKEND_TAG` in `env/.env.example` to a
release tag once both sides version their releases.

## Releasing

1. Open a PR `dev` → `main`, merge when CI is green.
2. Approve the **main** deployment in the Actions run: `:main` and `:latest` are published.
3. Versioned release: tag `main` (`git tag v1.2.0 && git push origin v1.2.0`), approve again.

## Dependabot

Weekly pnpm, Actions and Docker updates against `dev`; minor/patch grouped, majors separate (the
Node major is ignored: it's a project decision).

## Repository settings

| Setting | Value |
|---|---|
| Branch protection: `main`, `dev` | require `verify` + `e2e`; no force-push/deletion |
| Environment `dev` | deployable from `dev` only |
| Environment `main` | required reviewer; deployable from `main` and `v*` tags |
| Automatically delete head branches | on |
