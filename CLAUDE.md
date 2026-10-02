@AGENTS.md

## Claude Code specifics

- `.claude/settings.json` pre-approves the build and test commands above. Personal overrides
  go in `.claude/settings.local.json` (git-ignored).
- For auth (`src/proxy.ts`, `src/libs/Auth.ts`, `src/actions/AuthActions.ts`), the Dockerfile or
  CI, plan first and state the verification you will run before editing.
