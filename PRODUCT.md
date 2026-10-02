# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers on the owner's team who clone this repository to start a new web app on top of the
[spring-postgres-boilerplate](https://github.com/neszaDev/spring-postgres-boilerplate) API. They
read the code and run the app to see a working pattern, then copy, adapt or delete it for their
own product.

End users only arrive once a product is built from the template. They are not a defined audience
here, and each derived product sets its own.

## Product Purpose

A production-style starting point. A new frontend gets backend authentication, a typed API client,
i18n, tests and CI/CD that already work. Success means a developer can go from clone to a running,
signed-in app against the real backend quickly, and can extend it without rediscovering the
architecture.

The UI is a reference implementation, not a product. Each screen exists to demonstrate a pattern:
public pages, auth forms, a protected area, and an owner-scoped CRUD with a summary and pagination.

## Positioning

Unlike a generic Next.js starter, this one is wired end to end to one specific Spring backend.
The Next.js server holds the backend's JWT and rotating refresh tokens in httpOnly cookies, so
tokens never reach browser JavaScript. API types are generated from the backend's OpenAPI spec,
and CI runs end-to-end tests of the real frontend image against the real backend image.

## Operating Context

- Local dev: `make setup`, `make backend-up` (Postgres and the published backend image), then
  `pnpm dev` on http://localhost:3000.
- Repo flow matches the backend: feature branch → PR into `dev` → release PR `dev` → `main`.
  Images are published to `ghcr.io/neszadev/nextjs-boilerplate`.
- The demo flow developers walk through: sign up at `/sign-up`, then open the dashboard and
  *Test results*.
- Rules for agents and humans live in `AGENTS.md`. The architecture is in `docs/architecture.md`.

## Capabilities and Constraints

- Routes: public `(marketing)` home and about; `(auth)` sign-in and sign-up; and the protected
  `/dashboard` with `dashboard/test-results`.
- Test results: create (name, status `PENDING`/`PASSED`/`FAILED`, score 0–100, tested-at date,
  notes), list with pagination, per-status summary, delete. Owner-scoped.
- Stack: Next.js 16 App Router, React 19 with the React compiler, TypeScript, Tailwind v4,
  next-intl (en, fr; `as-needed` locale prefix), react-hook-form + zod, Storybook, Vitest,
  Playwright.
- Only the server talks to the backend: `src/actions/*` for writes and
  `src/libs/api/Queries.ts` for reads. Client components never call it.
- All user-visible text lives in `src/locales/*.json`, and every string must exist in both en
  and fr.
- No SaaS integrations and no frontend database. Re-adding one needs a recorded decision.
- Terminology: "test results" is the example resource. It is a placeholder domain, and derived
  products are expected to replace it.

## Brand Commitments

None. The working name is "Next.js + Spring Boilerplate" (`AppConfig.name`). There is no logo,
voice or identity to preserve beyond the favicons in `public/`. Upstream credit to ixartz's
Next.js Boilerplate (MIT) must stay on the about page.

## Evidence on Hand

- Real, working features: auth with token refresh, dashboard, test-results CRUD, en/fr.
- No users, customers, testimonials, metrics or adoption numbers. Future work must not invent
  them.

## Product Principles

1. **Each screen teaches a pattern.** Demo UI should show how to do something correctly and be
   easy to replace. It is not a product to market.
2. **Easy to delete.** Derived products will reskin or remove the demo. Design choices should
   lower that cost, not raise it.
3. **Production-grade defaults.** Accessibility, i18n, error states and security stay at the
   level a real product needs, because developers copy whatever the template shows them.
4. **The backend is the source of truth.** The UI reflects the backend's rules and errors
   rather than duplicating them.
