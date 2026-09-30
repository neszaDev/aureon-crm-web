# Configuration

All variables are declared and validated in `src/libs/Env.ts`; the app fails at startup if one
is invalid. Locally they come from `env/.env` (created from `env/.env.example` by `make setup`,
git-ignored); in containers and CI, from the environment.

## Application

| Variable | Default | Required | Notes |
|---|---|---|---|
| `BACKEND_URL` | none | yes | Where the **server** reaches the Spring API (e.g. `http://backend:8080` in Compose). Never exposed to browsers. |
| `APP_URL` | `http://localhost:3000` | in prod | Public URL of this app. `https://` → auth cookies are `Secure`. Used for sitemap/robots. |
| `NEXT_PUBLIC_LOGGING_LEVEL` | `info` | no | `error`, `warning`, `info`, `debug`, `trace`, `fatal`. Inlined at build time. |
| `NEXT_TELEMETRY_DISABLED` | unset | no | `1` disables Next.js telemetry. |
| `SKIP_ENV_VALIDATION` | unset | no | Only for `docker build`, where runtime config doesn't exist yet. |

Runtime values are **not** baked into the image, so one image serves every environment.

## Local Docker stack (`env/.env`)

| Variable | Default | Notes |
|---|---|---|
| `BACKEND_TAG` | `dev` | Tag of `ghcr.io/neszadev/spring-postgres-boilerplate` to run |
| `BACKEND_PORT` | `8080` | Host port of the backend |
| `FRONTEND_PORT` | `3000` | Host port of the frontend container (`make up`) |
| `BACKEND_JWT_SECRET` | local placeholder | JWT secret for the local backend container (≥ 32 bytes). Never a real secret. |

When you add a variable: declare it in `Env.ts`, document it here, and add it to
`env/.env.example`. Never commit real values.
