# Backend integration

## Typed client

`src/libs/api/schema.d.ts` is generated from the backend's OpenAPI spec (`/v3/api-docs`).
`Backend.ts` wraps it with [openapi-fetch](https://openapi-ts.dev/openapi-fetch/), so paths,
parameters and bodies are type-checked:

```ts
const api = await authedBackend();          // sends the user's access token
const { data, error, response } = await api.GET('/api/v1/test-results', {
  params: { query: { page: 0, size: 20 } },
});
```

Use `backend` (no token) only for the auth endpoints. Pages don't call the client directly: they
use functions in `Queries.ts` (the React compiler rejects `api.GET(...)` inside components, and
it keeps API paths in one place).

## Regenerating types

```sh
make api-types     # starts the backend if needed, then writes schema.d.ts
```

Run it whenever the backend API changes (or `BACKEND_TAG` moves to a version with changes) and
commit `schema.d.ts`. The generator runs through `pnpm dlx` with pinned versions
(openapi-typescript 7 needs the TypeScript 5 compiler API; this project uses TypeScript 7).

**Type errors after regenerating are the point.** A renamed field or removed endpoint in the
backend shows up here at compile time instead of in production.

## Errors

Every backend error has the same body, `ApiError` (`status`, `message`, `fieldErrors`, …). It
isn't in the backend's spec, so it's written by hand in `ApiError.ts`. In actions:

- `toActionError(error, fallback)` turns it into `{ ok: false, message, fieldErrors }`, which
  forms render (`fieldErrors` go under their inputs).
- Handle known statuses first with translated messages (401 invalid credentials, 409 email
  taken), then fall back to the backend's message.
- A 401 on an authenticated call means the session is gone: redirect to `/sign-in`
  (`redirectIfUnauthorized` in `src/libs/api/Session.ts`).
- 403 means the user lacks a role (admin pages): render `AdminOnlyNotice`, don't redirect.
- 429 (sign-in, sign-up) carries `Retry-After`; the form says how many minutes to wait.

## Client IP and rate limits

The backend limits sign-in and registration per client IP. Every request reaches it from this
server, so `AuthActions` forwards the browser's address as `X-Forwarded-For`
(`src/libs/api/ClientIp.ts`: the last entry of the incoming header, which Next.js or the proxy in
front of it wrote). The backend trusts that header only from private and loopback addresses.
Behind more than one proxy, or with this server exposed directly, adjust `clientIpFrom`.

## Files

Uploads go through a server action (`FileActions.uploadFile`, multipart to `POST /files`).
`next.config.ts` raises the server-action and proxy body limits to 11 MB to fit the backend's
10 MB maximum. Downloads stream through `dashboard/files/[id]/content/route.ts`, so the browser
never calls the backend and the token stays in its httpOnly cookie; the proxy refreshes it first.
The route always answers with an attachment, `nosniff` and a sandbox CSP.
- Unexpected and 5xx responses are logged (`src/libs/Logger.ts`).

## Adding an endpoint end to end

1. Backend: implement and merge the endpoint (its own repo).
2. Here: `make api-types`, commit `schema.d.ts`.
3. Reads: add a function to `Queries.ts`. Writes: add a server action in `src/actions/`, with a
   zod schema in `src/validations/` matching the backend's constraints.
4. UI + texts in every locale, then a unit test for new logic and an `*.e2e.ts` flow.
