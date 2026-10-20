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
- **Format:** reduced motion, `cwebp -q 80 -m 6`; the desktop captures at device scale 2, the narrow
  crops (`*-390*`, `board-card`, `tasks-reminders`) at 3. Each screen has a light (`-light`) and a dark,
  lacquer (`-dark`) capture; the page shows the one matching its theme. Below 768 px the page shows the
  narrow crop of each section instead of the whole screen; the Thai page shows the Thai crops (`-th`).

| File | Screen | Viewport (CSS px) and clip |
|---|---|---|
| `board-columns-{light,dark}.webp` | Deals board, the stage columns only (hero, from 768 px) | 1440 × 1200, clipped to the board |
| `board-card-390-{light,dark}.webp` | Phone deals board, the stage whose first card is the most signed, from that card down (hero, below 768 px) | 390 × 844, 390 × 470 from the card |
| `board-card-390-th-{light,dark}.webp` | The same, in Thai (the Thai page's hero, below 768 px) | 390 × 844, 390 × 470 from the card |
| `board-{light,dark}.webp` | Deals board with the rail and filters | 1440 × 900 |
| `board-card[-th]-{light,dark}.webp` | The board's most signed card (its section below 768 px; the card the ring marks) | 1440 × 1200, the card + 12 px |
| `deal-{light,dark}.webp` | The won deal with the most different signers, without the rail, down to its stage history | 1440 × 1100, from x = 248 |
| `deal-390[-th]-{light,dark}.webp` | The same deal on a phone, its stamp row down to its stage history | 390 × 844, full page |
| `tasks-{light,dark}.webp` | My tasks, with the reminders bell open | 1440 × 680 |
| `tasks-reminders[-th]-{light,dark}.webp` | The reminders popover (its section below 768 px) | 1440 × 680, inside the popover's edge |
| `dashboard-{light,dark}.webp` | Dashboard below 1024 px (one column), down to the last whole "My deals" row above 760 px | 1000 × 900 |
| `dashboard-390[-th]-{light,dark}.webp` | "My deals" on a phone, down to its second row | 390 × 844 |
| `reports-{light,dark}.webp` | Reports, Won and lost tab, down to the chart's edge above its table | 1000 × 900 |
| `reports-390[-th]-{light,dark}.webp` | The won-and-lost chart on a phone, above its table | 390 × 844 |
| `board-390-th-{light,dark}.webp` | Deals board in Thai on a phone (the languages section) | 390 × 844 |

`[-th]`: the same crop of the Thai app (`/th`), which the Thai page shows.

`spots.json` is measured by the same run on the same screens: where the rings sit on `board`, `deal`
and `tasks` (in percent of each capture), and how far the report sheet covers the dashboard (in percent
of the width). `page.tsx` imports it, so a new capture moves the rings with it.

The demo data is relative to the day it was seeded, so a new capture shows other days and dates.
