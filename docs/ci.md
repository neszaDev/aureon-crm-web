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
| `ci.yml` (**CI**) | every pull request | the jobs below; **CI Gate** is required to merge |
| `cd-dev.yml` (**CI/CD - dev**) | push to `dev` | CI, then publish `ghcr.io/<repo>:dev` |
| `cd-main.yml` (**CI/CD - main**) | push to `main`, tags `v*` | CI, **approval** on `main`, then publish `:main` + `:latest` or `:1.2.3` + `:1.2` |
| `publish-image.yml` | called by the two above | the only place image build + push is defined |
| `cleanup-pr-cache.yml` | PR closed | delete that PR's Actions caches |

Every image also gets `:sha-<short>`. Nothing is published unless CI (including E2E) passes for
the same commit.

## CI jobs

The jobs run in parallel; `make verify` runs the first four in one go.

| Job | Runs | Local equivalent |
|---|---|---|
| **Detect changes** | decides whether code changed; docs-only PRs (`*.md`, `docs/`) skip the jobs marked † | none |
| **Lint, types & checks** | commitlint (PR commits), lint, types, knip, i18n keys | `make lint` |
| **Unit tests** † | Vitest node tests | `pnpm exec vitest run --project unit` |
| **UI tests** † | Vitest browser tests (Chromium) | `pnpm exec vitest run --project ui` |
| **Production build** † | `next build` (with the `.next/cache` restored) | `pnpm build` |
| **Security audit** | `pnpm audit --prod` (high/critical blocks), dev-dependency advisories as a warning, and on PRs `dependency-review-action` (new dependencies with high advisories or disallowed licences block) | `pnpm audit --prod` |
| **E2E, accessibility & visual** † | builds the frontend image, starts it with the backend image (`BACKEND_TAG`, default `dev`) and Postgres, then: `schema.d.ts` vs the backend's spec, Playwright (with axe checks on every app route), visual regression, and a Trivy scan of the image (fixable high/critical blocks) | `make e2e-image`, `make api-check` |
| **CI Gate** | fails when any job above failed or was cancelled (skipped is fine) | none |

On failure the E2E job uploads the Playwright reports (`playwright-report`) and prints container
logs. When screenshots have no baseline yet it uploads `visual-baselines` (see
[testing](testing.md#visual-regression)).

**Why one gate:** branch protection requires only **CI Gate**, so jobs can be added, split or
made conditional without editing repository settings.

**Image scan:** Trivy runs from its official image pinned by digest (the `trivy-action` tags were
hijacked in 2026). The runtime image ships no package manager (npm/yarn/corepack are removed),
which keeps the scan to what the server actually runs.

**Backend version:** E2E runs against the backend's `:dev` image. A backend change that breaks
the frontend shows up in the next frontend CI run; pin `BACKEND_TAG` in `env/.env.example` to a
release tag once both sides version their releases. The backend has not published a `:main` image yet; once it does, run the E2E job as a matrix
over `BACKEND_TAG: [dev, main]` so a frontend change is also checked against the released API.

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
| Branch protection: `main`, `dev` | require **CI Gate**; no force-push/deletion |
| Environment `dev` | deployable from `dev` only |
| Environment `main` | required reviewer; deployable from `main` and `v*` tags |
| Automatically delete head branches | on |
