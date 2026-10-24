## What and why

<!-- One or two sentences. Link the issue/ticket if there is one. -->

## Checklist

- [ ] `make verify` passes locally (and the end-to-end suite against the API on 8081 if pages, actions, auth or the proxy changed: `BACKEND_URL=http://localhost:8081 pnpm exec playwright test --project=chromium --workers=1`)
- [ ] New behaviour is covered by a `*.test.ts(x)` or `*.e2e.ts`
- [ ] User-visible text is in `src/locales/*.json` (all locales), not hard-coded
- [ ] If the backend API changed: `pnpm api:types` was run and `schema.d.ts` is committed
- [ ] Docs updated if commands, config or env vars changed (`README.md`, `docs/`, `env/.env.example`)
- [ ] No secrets, `env/.env`, build output or test reports committed
