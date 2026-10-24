# Landing page captures

Real screenshots of the running app, used by the public landing page (`src/app/[locale]/(marketing)/page.tsx`).
Nothing here is drawn, mocked or edited: each file is a Playwright screenshot, converted to WebP.

- **Command:** `APP_URL=http://localhost:3105 pnpm capture:landing` (`scripts/capture-landing.ts`), against
  a production build (`BACKEND_URL=http://localhost:8081 APP_URL=http://localhost:3105 pnpm exec next start -p 3105`)
  and the `aureon-crm-api` backend with its demo workspace. Then each file's provenance goes beside it, in
  `<file>.webp.json`: `impeccable embed-prompt public/landing/<file>.webp --prompt "<the origin line below>"`
  for each file (`impeccable embed-prompt --scan public/landing` lists any without one).
- **Date:** 2026-10-24.
- **Data:** the fictional demo workspace **Northwind Supply**, signed in as its owner (`admin@e2e.test`, the
  account the e2e suite seeds it for). Every company, person, amount and date is invented by that seed; its
  members are Hana Sato, Mia Rossi, Riley Chen and Ravi Patel, and its owner has no display name, so the app
  shows their email.
- **Format:** reduced motion, `cwebp -q 80 -m 6`; the desktop captures at device scale 2, the narrow
  crops (`*-390*`, `tasks-inbox`) at 3. Each screen has a light (`-light`) and a dark (`-dark`) capture; the
  page shows the one matching its theme. Below 768 px the page shows the narrow crop of each section instead
  of the whole screen; the Thai page shows the Thai crops (`-th`).
- **Origin line** (in each file's `.webp.json`): `Real screenshot of the Aureon CRM app (demo workspace Northwind
  Supply, fictional data), taken by scripts/capture-landing.ts on 2026-10-24; not generated.`

| File | Screen | Viewport (CSS px) and clip |
|---|---|---|
| `board-{light,dark}.webp` | Deals board in the app's shell (hero, from 768 px) | 1440 × 900, down to the end of the columns |
| `board-hero-390[-th]-{light,dark}.webp` | Phone deals board, its first stage from the stage picker down (hero, below 768 px) | 390 × 844, 390 × 520 from the picker |
| `deals-list-{light,dark}.webp` | Deals list in its status sections | 1440 × 900 |
| `deals-list-390[-th]-{light,dark}.webp` | The deals list's first status section on a phone | 390 × 844, the section |
| `deal-{light,dark}.webp` | The open deal furthest along the pipeline, in the record panel over the deals list | 1440 × 900 |
| `deal-390[-th]-{light,dark}.webp` | The same deal's header on a phone: pill, owner, track | 390 × 844, the header |
| `tasks-{light,dark}.webp` | Tasks by due date, with the inbox open | 1440 × 760 |
| `tasks-inbox[-th]-{light,dark}.webp` | The inbox popover (its section below 768 px) | 1440 × 760, inside the popover's edge |
| `dashboard-{light,dark}.webp` | Insights › Dashboard, down to the panels above its recent activity | 1440 × 900 |
| `dashboard-390[-th]-{light,dark}.webp` | The figures and the open deals by stage on a phone | 390 × 844 |
| `reports-{light,dark}.webp` | Reports, Won and lost tab, down to the chart's edge above its table | 1440 × 900 |
| `reports-390[-th]-{light,dark}.webp` | The won-and-lost chart on a phone, above its table | 390 × 844 |
| `board-390-th-{light,dark}.webp` | Deals board in Thai on a phone (the languages section) | 390 × 844 |

`[-th]`: the same crop of the Thai app (`/th`), which the Thai page shows.

`spots.json` is measured by the same run on the same screens: where the rings sit on `deals-list` (the first
section's pill), `deal` (the track in the panel) and `tasks` (the inbox), in percent of each capture.
`page.tsx` imports it, so a new capture moves the rings with it.

The demo data is relative to the day it was seeded, so a new capture shows other days and dates.
