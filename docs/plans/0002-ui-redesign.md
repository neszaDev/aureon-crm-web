# UI redesign plan: a sample product on shared components

## Context

The first frontend shipped working pages with almost no design: gray text, a top nav, unstyled
forms. Because derived products copy whatever the template shows, the owner asked for a full
redesign (landing page, sign-in, dashboard and the rest) built on shared components, so every
screen stays consistent.

## Decisions (made with the owner, 2026-10-01)

| Question | Decision | Why |
|---|---|---|
| What does the landing page sell? | A **sample product, "Marksheet"**, labelled as a sample everywhere | Shows derived apps what a finished marketing page looks like; its features are exactly the demo's real ones, so nothing is invented |
| Which surfaces? | Landing, about, sign-in/up, app shell with sidebar + mobile drawer, richer overview, test results, account, 404/error/loading | Everything a new product needs on day one |
| Shared components | **shadcn/ui (Radix)**, generated into `src/components/ui/` and themed | Accessible primitives (dialog, sheet, labels) owned in the repo, no runtime service |
| Visual direction | "Report card": folder green, ruled card stock, navy ink, hand-drawn marks | Chosen from a set of directions; recorded in `DESIGN.md` |

## What changed

- **Tokens** in `src/styles/global.css` (`:root` + `@theme inline`); shadcn semantic tokens map onto them.
- **Primitives** in `src/components/ui/` (shadcn, themed). Unused parts were deleted rather than
  ignored, so knip stays strict. The shadcn sidebar was not adopted: it failed the lint rules and
  a ~60-line shell (`src/templates/AppShell.tsx` + `Sheet`) covers the need.
- **Domain components** in `src/components/report/`: `Mark`, `StatusMark`, `TotalsStrip`,
  `ResultsTable`, `SampleCard`. The landing page renders the same `ResultsTable` as the app.
- **Templates**: `MarketingTemplate` (public pages) and `AppShell` (signed-in pages) replace `BaseTemplate`.
- **Fonts**: Libre Franklin and Kalam via `next/font/google` (self-hosted at build time).
- **Behaviour**: deleting a result now asks for confirmation; new rows draw their mark on.
- **Dependencies**: `radix-ui`, `class-variance-authority`, `cn` (shadcn's class merger),
  `lucide-react`, `tw-animate-css`; `shadcn` as a dev dependency for its CSS and CLI.

## Replacing the sample

Swap the copy in `src/locales/*.json` (`Brand`, `Index`, `About`, …), `AppConfig.name`, and the
test-results domain. Keep the tokens and components; adjust `DESIGN.md` if the look changes.
