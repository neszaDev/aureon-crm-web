# Landing page captures

Real screenshots of the running app, used by the public landing page (`src/app/[locale]/(marketing)/page.tsx`).
Nothing here is drawn, mocked or edited: each file is a Playwright screenshot, converted to WebP.

- **Command:** `APP_URL=http://localhost:3105 pnpm capture:landing` (`scripts/capture-landing.ts`), against
  a production build (`BACKEND_URL=http://localhost:8081 APP_URL=http://localhost:3105 pnpm exec next start -p 3105`)
  and the `aureon-crm-api` backend with its demo data (`DEMO_DATA=true`).
- **Date:** 2026-10-20.
- **Data:** the fictional demo workspace **Northwind Supply (demo)**, signed in as its owner (`owner@demo.test`).
  Every company, person, amount and date is invented by the API's demo seed; the seals are its four
  members (Avery Owner, Sam Admin, Morgan Manager, Riley Rep).
- **Format:** device scale factor 2, reduced motion, `cwebp -q 80 -m 6`. Each screen has a light (`-light`)
  and a dark, lacquer (`-dark`) capture; the page shows the one matching its theme.

| File | Screen | Viewport (CSS px) |
|---|---|---|
| `board-columns-{light,dark}.webp` | Deals board, the stage columns only (hero, from 768 px) | 1440 × 1200, clipped to the board |
| `board-390-{light,dark}.webp` | Deals board on a phone, scrolled to the stage column (hero, below 768 px) | 390 × 844, clipped to the top 480 |
| `board-{light,dark}.webp` | Deals board with the rail and filters | 1440 × 900 |
| `deal-{light,dark}.webp` | The won deal with the most different signers: stamp row, facts, stage history | 1440 × 1100 |
| `tasks-{light,dark}.webp` | My tasks, with the reminders bell open | 1440 × 680 |
| `dashboard-{light,dark}.webp` | Dashboard, without the rail | 1280 × 640, from x = 232 |
| `reports-{light,dark}.webp` | Reports, Won and lost tab (period: the last 30 days), without the rail | 1280 × 700, from x = 232 |
| `board-390-th-{light,dark}.webp` | Deals board in Thai on a phone | 390 × 844 |

The demo data is relative to the day it was seeded, so a new capture shows other days and dates. After
capturing again, check the rings the page draws on `board`, `deal` and `tasks` (the `spot` props in
`page.tsx`) still sit on the card, the stamp row and the reminders popover.
