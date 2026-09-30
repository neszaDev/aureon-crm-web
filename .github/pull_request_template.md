## What and why

<!-- One or two sentences. Link the issue/ticket if there is one. -->

## Checklist

- [ ] `make verify` passes locally (and `make e2e` if pages, actions, auth or the proxy changed)
- [ ] New behaviour is covered by a `*.test.ts(x)` or `*.e2e.ts`
- [ ] User-visible text is in `src/locales/*.json` (all locales), not hard-coded
- [ ] If the backend API changed: `pnpm api:types` was run and `schema.d.ts` is committed
- [ ] Docs updated if commands, config or env vars changed (`README.md`, `docs/`, `env/.env.example`)
- [ ] No secrets, `env/.env`, build output or test reports committed
