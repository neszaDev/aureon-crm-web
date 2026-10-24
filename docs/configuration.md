# Configuration

All variables are declared and validated in `src/libs/Env.ts`; the app fails at startup if one
is invalid. Locally they come from `env/.env` (created from `env/.env.example` by `make setup`,
git-ignored); in containers and CI, from the environment.

## Application

| Variable | Default | Required | Notes |
|---|---|---|---|
| `BACKEND_URL` | none | yes | Where the **server** reaches the Spring API (`http://localhost:8081` for the API repo run locally, `http://backend:8080` in Compose). Never exposed to browsers. |
| `APP_URL` | `http://localhost:3000` | in prod, **and at build** | Public URL of this app. `https://` → auth cookies are `Secure`. Used for sitemap/robots, and as `metadataBase`: the static public pages bake their `og:image` host from it at `next build` (a Docker image built without it points at `http://localhost:3000`). |
| `NEXT_PUBLIC_LOGGING_LEVEL` | `info` | no | `error`, `warning`, `info`, `debug`, `trace`, `fatal`. Inlined at build time. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | (none) | no | Browser key for the Google Maps demo page; restrict it by HTTP referrer. Inlined at build time. |
| `NEXT_TELEMETRY_DISABLED` | unset | no | `1` disables Next.js telemetry. |
| `SKIP_ENV_VALIDATION` | unset | no | Only for `docker build`, where runtime config doesn't exist yet. |

Runtime values are **not** baked into the image, so one image serves every environment.

**Deployment requirement:** run the app behind a reverse proxy that makes the client's address
the **last** `X-Forwarded-For` entry (overwriting the header, or appending with
`$proxy_add_x_forwarded_for`) and passes the browser's `Host` on. In nginx:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header Host $host;   # $http_host when the public URL has a port
```

The backend's per-IP sign-in and registration limits key on that last entry
([client IP](backend-integration.md#client-ip-and-rate-limits)). Exposed directly, a client
sends any `X-Forwarded-For` it likes, Next.js keeps it, and those limits don't hold; the
per-email limit on failed sign-ins still does. Without `Host`, nginx sends its upstream's name
(`$proxy_host`), which Next compares with the browser's `Origin` (after `X-Forwarded-Host`):
every server action fails with "Invalid Server Actions request". `$host` also drops a port: when
the public URL carries one (`https://crm.example.com:8443`), pass `$http_host` instead. The proxy
also caps request bodies ([request bodies](architecture.md#request-bodies)).

## Local Docker stack (`env/.env`)

`make backend-up`, `make e2e`, `make up` and `make e2e-image` run the API from
`ghcr.io/neszadev/aureon-crm-api` (`docker/compose.yml`). **That image isn't published yet**
(publishing needs the owner's approval), so these targets fail to pull it today. Until it is,
run the API repo ([aureon-crm-api](https://github.com/neszaDev/aureon-crm-api), `feat/crm`) with
its own `make up` and `APP_PORT=8081`, and set `BACKEND_URL=http://localhost:8081` here: see
[testing](testing.md#the-crm-backend). The variables below configure the containers for when the
image exists.

| Variable | Default | Notes |
|---|---|---|
| `BACKEND_TAG` | `dev` | Tag of `ghcr.io/neszadev/aureon-crm-api` to run (not published yet) |
| `BACKEND_PORT` | `8080` | Host port of the backend |
| `FRONTEND_PORT` | `3000` | Host port of the frontend container (`make up`) |
| `BACKEND_JWT_SECRET` | local placeholder | JWT secret for the local backend container (≥ 32 bytes). Never a real secret. |
| `BACKEND_ADMIN_EMAIL` / `BACKEND_ADMIN_PASSWORD` | `admin@e2e.test` / `e2e-admin-password` | Admin the local backend creates at startup (used by e2e). Local only. |
| `BACKEND_RATE_LIMIT_PER_IP` | `10000` | Per-IP sign-in and registration limit of the local backend; high because e2e registers every user from one address |

When you add a variable: declare it in `Env.ts`, document it here, and add it to
`env/.env.example`. Never commit real values.
