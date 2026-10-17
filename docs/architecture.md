# Architecture

## Request flow

```mermaid
flowchart LR
  B[Browser] -->|page / server action| P[proxy.ts<br/>i18n + auth]
  P -->|no access cookie + refresh cookie| R[POST /auth/refresh]
  P --> RSC[Server components<br/>libs/api/Queries.ts]
  B -->|form submit| SA[Server actions<br/>src/actions/*]
  RSC -->|Bearer access token| API[(Spring API)]
  SA -->|Bearer access token| API
  R --> API
  API --> PG[(PostgreSQL)]
```

The browser never talks to the backend and never sees a token. Everything goes through the
Next.js server, which holds the session in two **httpOnly** cookies.

## Session design

| Cookie | Holds | Lifetime |
|---|---|---|
| `access_token` | backend JWT (15 min by default) | token lifetime − 30 s |
| `refresh_token` | backend refresh token (rotates on use) | refresh-token lifetime |

- **Sign-in/sign-up** (`src/actions/AuthActions.ts`) call the backend, set both cookies and go
  to `/app`, or to the page's `?next=` when `safeNextPath` (`src/libs/SafeRedirect.ts`) accepts
  it (only `/app/**` and `/invite/**`; this is what keeps it from being an open redirect).
- **Protected pages** (`/app/**` and `/dashboard/**`, any locale) go through `src/proxy.ts`.
  With no access cookie but a refresh cookie, it calls `/auth/refresh`, sets the new cookies on
  the request (so this render already uses them) and on the response (so the browser keeps
  them). With neither, it redirects to `/sign-in`.
- Because each cookie expires with its token, "is the access cookie present?" is the only check
  needed: no JWT decoding in the frontend.
- **A failed refresh does not delete cookies.** Two tabs can refresh at once and, with rotation,
  the second one loses; deleting would sign out the tab that just succeeded.
- **Sign-out** revokes the refresh token on the backend (best effort) and clears both cookies.
- A backend **401** anywhere else (e.g. a deleted account) ends the session: pages and layouts
  redirect to `/api/session/expired` (outside the proxy), which deletes both cookies and goes to
  `/sign-in?expired=1` with a notice; server actions delete them themselves. Sending the user
  straight to `/sign-in` would loop, since the proxy still sees the access cookie. This is not
  the refresh race above: the backend's 401 is final.
- Cookies are `Secure` when `APP_URL` is `https://`.

## Where code goes

| Need | Put it in |
|---|---|
| A page | `src/app/[locale]/(marketing)` (public), `(auth)/app/[workspaceId]` (the CRM) or `(auth)/dashboard` (demos) |
| Read data for a page | a function in `src/libs/api/Queries.ts` (CRM: `CrmQueries.ts`) |
| Change data | a server action in `src/actions/` (validate with zod, map errors, revalidate) |
| Validation rules | `src/validations/`, mirroring the backend's request constraints |
| Text | `src/locales/en.json` **and** every other locale |
| Env var | `src/libs/Env.ts` + [configuration.md](configuration.md) + `env/.env.example` |

## Rendering

Public pages are statically generated per locale. Everything under `app` and
`dashboard` is `force-dynamic`: personal data is never prerendered or cached.

## Deployment shape

`docker/Dockerfile` builds Next's standalone server (non-root, `node server.js`). The same image
runs in every environment; `BACKEND_URL` and `APP_URL` are read at startup, not baked in.
