// Captures the landing page's screenshots from the running app (`pnpm capture:landing`): the
// fictional demo workspace, signed in as its owner, in light and dark. Run it against a
// production build on a spare port, with the API's demo data seeded (DEMO_DATA=true there):
//
//   BACKEND_URL=http://localhost:8081 APP_URL=http://localhost:3105 pnpm exec next start -p 3105
//   APP_URL=http://localhost:3105 pnpm capture:landing
//
// PNGs go to a scratch directory (CAPTURE_DIR), WebP files (cwebp) to public/landing/. Every
// file's provenance is in public/landing/README.md: update its date when you capture again.
/* oxlint-disable no-await-in-loop -- one browser page takes one shot after another */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { chromium } from '@playwright/test';

const APP_URL = process.env.APP_URL ?? 'http://localhost:3105';
const EMAIL = process.env.DEMO_EMAIL ?? 'owner@demo.test';
const PASSWORD = process.env.DEMO_PASSWORD ?? 'demo-password';
const WORKSPACE = 'Northwind Supply (demo)';
const RAW = process.env.CAPTURE_DIR ?? path.join(tmpdir(), 'aureon-landing');
const OUT = 'public/landing';

type Clip = { x: number; y: number; width: number; height: number };
type Shot = {
  name: string;
  // `{ws}` is the demo workspace's path (`/app/12`), `{deal}` the chosen deal's id. The locale
  // prefix is explicit: the app remembers the last locale it was opened in.
  path: string;
  width: number;
  height: number;
  // Before the shot: open a popover, scroll, pick a stage.
  prepare?: (page: Page) => Promise<void>;
  // The part of the page to keep, in page coordinates (the whole viewport without one).
  clip?: Clip | ((page: Page) => Promise<Clip>);
};

// The CRM rail's width from 1024 px (DESIGN.md): content clips start after it.
const RAIL = 232;
// The board cards (`DealCard`) and the boxes their members signed.
// (`:visible`: the board keeps a phone's column and a desktop's columns, one of them hidden.)
const CARD = 'li[class*="group/card"]:visible';
// A signed box is the one that says, on hover, who moved the deal there (in any language).
const SIGNED = 'ol > li > span[title]';

// An element's box in page coordinates.
const boxOf = async (page: Page, selector: string, nth = 0) => {
  const box = await page
    .locator(selector)
    .nth(nth)
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x + window.scrollX,
        y: rect.y + window.scrollY,
        width: rect.width,
        height: rect.height,
      };
    });

  return { ...box, bottom: box.y + box.height, right: box.x + box.width };
};

// The panel (the section) a heading names, in page coordinates, and the bottoms of its rows.
const panelOf = async (page: Page, heading: string) =>
  await page
    .getByRole('heading', { name: heading, exact: true })
    .first()
    .evaluate((title) => {
      const panel = title.closest('section') ?? title;
      const rect = panel.getBoundingClientRect();
      const rows = [...panel.querySelectorAll(':scope > ul > li')].map(
        (row) => row.getBoundingClientRect().bottom + window.scrollY,
      );
      return { y: rect.y + window.scrollY, bottom: rect.bottom + window.scrollY, rows };
    });

// The board card whose stamp row carries the most signatures (the first on a tie).
const signedCard = async (page: Page) => {
  const counts = await page
    .locator(CARD)
    .evaluateAll(
      (cards, signed) => cards.map((card) => card.querySelectorAll(signed).length),
      SIGNED,
    );

  return counts.indexOf(Math.max(...counts));
};

// On a phone, shows the stage whose first card carries the most signatures, scrolled to it.
const toSignedCard = async (page: Page) => {
  const picker = page.locator('#board-stage');
  const stages = await picker
    .locator('option')
    .evaluateAll((options) => options.map((option) => option.getAttribute('value') ?? ''));
  let best = { stage: stages[0] ?? '', signed: -1 };
  for (const stage of stages) {
    await picker.selectOption(stage);
    const signed = await page.locator(CARD).first().locator(SIGNED).count();
    if (signed > best.signed) {
      best = { stage, signed };
    }
  }
  await picker.selectOption(best.stage);
  await page.locator(CARD).first().scrollIntoViewIfNeeded();
};

// Scrolls a phone-width board so its stage picker sits under the sticky top bar.
const toBoard = async (page: Page) => {
  await page.locator('label[for="board-stage"]').evaluate((label) => {
    window.scrollTo(0, label.getBoundingClientRect().top + window.scrollY - 56 - 16);
  });
};

const openReminders = async (page: Page) => {
  await page.getByRole('button', { name: /^Reminders/u }).click();
  await page.getByRole('dialog', { name: 'Reminders' }).waitFor();
};

// The "Table" toggle under a report's chart: clips end above it, on the chart's edge.
const tableToggle = 'button[aria-expanded]:text-is("Table")';

const SHOTS: Shot[] = [
  {
    // The hero: the board's columns only, without the rail and the page header.
    name: 'board-columns',
    path: '/en{ws}/deals',
    width: 1440,
    height: 1200,
    clip: async (page) => {
      const board = await boxOf(page, '.board-scroll');
      return { x: board.x - 20, y: board.y - 20, width: 1440 - board.x + 20, height: 720 };
    },
  },
  { name: 'board', path: '/en{ws}/deals', width: 1440, height: 900 },
  {
    // The record without the rail, down to the end of its stage history.
    name: 'deal',
    path: '/en{ws}/deals/{deal}',
    width: 1440,
    height: 1100,
    clip: async (page) => {
      const history = await panelOf(page, 'Stage history');
      return { x: RAIL + 16, y: 0, width: 1440 - RAIL - 32, height: history.bottom + 20 };
    },
  },
  {
    // Below 1024 px, where the panels stack: down to the end of the last whole "My deals" row
    // above 760 px, so the capture ends on a row's edge in its one column.
    name: 'dashboard',
    path: '/en{ws}',
    width: 1000,
    height: 900,
    clip: async (page) => {
      const { rows } = await panelOf(page, 'My deals');
      return { x: 0, y: 0, width: 1000, height: Math.max(...rows.filter((row) => row <= 760)) };
    },
  },
  {
    // Down to the chart's edge, above its table.
    name: 'reports',
    path: '/en{ws}/reports?tab=won-lost',
    width: 1000,
    height: 900,
    clip: async (page) => {
      const toggle = await boxOf(page, tableToggle);
      return { x: 0, y: 0, width: 1000, height: toggle.y - 8 };
    },
  },
  { name: 'tasks', path: '/en{ws}/tasks', width: 1440, height: 680, prepare: openReminders },
  { name: 'board-390-th', path: '/th{ws}/deals', width: 390, height: 844, prepare: toBoard },
];

// Below 768 px the page shows these instead: narrow crops around each part a section is about,
// drawn at a phone's density.
const NARROW: Shot[] = [
  ...['en', 'th'].map((locale) => ({
    // The phone hero: the stage whose first card is the most signed, from that card down.
    name: locale === 'en' ? 'board-card-390' : 'board-card-390-th',
    path: `/${locale}{ws}/deals`,
    width: 390,
    height: 844,
    prepare: toSignedCard,
    clip: async (page: Page) => {
      const card = await boxOf(page, CARD);
      return { x: 0, y: card.y - 12, width: 390, height: 470 };
    },
  })),
  {
    name: 'board-card',
    path: '/en{ws}/deals',
    width: 1440,
    height: 1200,
    clip: async (page) => {
      const card = await boxOf(page, CARD, await signedCard(page));
      return { x: card.x - 12, y: card.y - 12, width: card.width + 24, height: card.height + 24 };
    },
  },
  {
    // The won deal on a phone: its stamp row down to the end of its stage history.
    name: 'deal-390',
    path: '/en{ws}/deals/{deal}',
    width: 390,
    height: 844,
    clip: async (page) => {
      const row = await boxOf(page, 'section:has(ol[aria-label="Deal progress"])');
      const history = await panelOf(page, 'Stage history');
      return { x: 0, y: row.y - 16, width: 390, height: history.bottom + 16 - (row.y - 16) };
    },
  },
  {
    name: 'tasks-reminders',
    path: '/en{ws}/tasks',
    width: 1440,
    height: 680,
    prepare: openReminders,
    clip: async (page) => {
      // The popover alone: around it lie pieces of the page it covers.
      const sheet = await boxOf(page, '[role="dialog"]');
      return { x: sheet.x - 1, y: sheet.y - 1, width: sheet.width + 2, height: sheet.height + 2 };
    },
  },
  {
    // "My deals" on a phone, down to the end of its second row.
    name: 'dashboard-390',
    path: '/en{ws}',
    width: 390,
    height: 844,
    clip: async (page) => {
      const panel = await panelOf(page, 'My deals');
      const second = panel.rows[1] ?? panel.bottom;
      return { x: 0, y: panel.y - 16, width: 390, height: second - (panel.y - 16) };
    },
  },
  {
    name: 'reports-390',
    path: '/en{ws}/reports?tab=won-lost',
    width: 390,
    height: 844,
    clip: async (page) => {
      const panel = await panelOf(page, 'Won and lost by month');
      const toggle = await boxOf(page, tableToggle);
      return { x: 0, y: panel.y - 16, width: 390, height: toggle.y - 8 - (panel.y - 16) };
    },
  },
];

// Waits for the page's data, fonts, and the end of every time-based animation.
const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== 'running' || !(animation.timeline instanceof DocumentTimeline),
      ),
  );
};

// The won deal whose stamp row carries the most different signers: the record shot.
const chooseDeal = async (page: Page, workspace: string) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/en${workspace}/deals`);
  // The Won column's link: the list of its deals.
  await page.getByRole('link', { name: 'View in list' }).first().click();
  await page.waitForURL(/view=list/u);
  const ids = await page
    .locator(`a[href*="${workspace}/deals/"]`)
    .evaluateAll((links) => [
      ...new Set(
        links.map((link) => /\/deals\/(\d+)$/u.exec(link.getAttribute('href') ?? '')?.[1]),
      ),
    ]);
  let best = { id: '', signers: -1 };
  for (const id of ids.filter(Boolean)) {
    await page.goto(`/en${workspace}/deals/${id}`);
    // Won by its status (the badge from the stage's kind), whatever the stage is called.
    const won = await page.locator('[data-slot="badge"]', { hasText: /^Won$/u }).count();
    const titles = await page
      .locator(SIGNED)
      .evaluateAll((boxes) => boxes.map((box) => box.getAttribute('title')));
    const signers = new Set(titles).size * 100 + titles.length;
    if (won > 0 && signers > best.signers) {
      best = { id: id ?? '', signers };
    }
  }
  if (!best.id) {
    throw new Error('No won deal in the demo workspace');
  }

  return best.id;
};

// A box in percent of the capture it sits on, and a box grown on every side.
const percent = (box: Clip, frame: Clip) =>
  Object.fromEntries(
    Object.entries({
      left: (box.x - frame.x) / frame.width,
      top: (box.y - frame.y) / frame.height,
      width: box.width / frame.width,
      height: box.height / frame.height,
    }).map(([key, value]) => [key, `${(value * 100).toFixed(1)}%`]),
  );
const pad = (box: Clip, by: number) => ({
  x: box.x - by,
  y: box.y - by,
  width: box.width + 2 * by,
  height: box.height + 2 * by,
});

// Where each section's ring sits on its capture, in percent, for the `spot` props in page.tsx.
const spots = async (page: Page, workspace: string, deal: string) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/en${workspace}/deals`);
  await settle(page);
  const card = await boxOf(page, CARD, await signedCard(page));
  console.log('board spot', percent(pad(card, 4), { x: 0, y: 0, width: 1440, height: 900 }));

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`/en${workspace}/deals/${deal}`);
  await settle(page);
  // The row's boxes, not the list, which runs the panel's width.
  const boxes = await page
    .locator('ol[aria-label="Deal progress"] > li')
    .evaluateAll((items) => items.map((item) => item.getBoundingClientRect()));
  const left = Math.min(...boxes.map((box) => box.x));
  const top = Math.min(...boxes.map((box) => box.y));
  const row = {
    x: left,
    y: top,
    width: Math.max(...boxes.map((box) => box.right)) - left,
    height: Math.max(...boxes.map((box) => box.bottom)) - top,
  };
  const history = await panelOf(page, 'Stage history');
  const frame = { x: RAIL + 16, y: 0, width: 1440 - RAIL - 32, height: history.bottom + 20 };
  console.log('deal spot', percent(pad(row, 8), frame));

  await page.setViewportSize({ width: 1440, height: 680 });
  await page.goto(`/en${workspace}/tasks`);
  await settle(page);
  await openReminders(page);
  const sheet = await boxOf(page, '[role="dialog"]');
  console.log('tasks spot', percent(pad(sheet, 4), { x: 0, y: 0, width: 1440, height: 680 }));

  // The report covers the dashboard's last whole row: its height, in percent of the width.
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.goto(`/en${workspace}`);
  await settle(page);
  const { rows } = await panelOf(page, 'My deals');
  const kept = rows.filter((bottom) => bottom <= 760);
  const height = (kept.at(-1) ?? 0) - (kept.at(-2) ?? 0);
  console.log('report overlap', `${((height / 1000) * 100).toFixed(1)}%`);
};

const signIn = async (page: Page) => {
  await page.goto('/en/sign-in');
  await page.getByLabel('Email address').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/app(?:\/\d+)?$/u);
  if (!/\/app\/\d+$/u.test(page.url())) {
    await page.getByRole('link', { name: WORKSPACE }).click();
    await page.waitForURL(/\/app\/\d+$/u);
  }

  return new URL(page.url()).pathname;
};

mkdirSync(RAW, { recursive: true });
const browser = await chromium.launch();
try {
  let deal = '';
  // The desktop captures at twice the density, the narrow crops at a phone's.
  for (const [scale, shots] of [
    [2, SHOTS],
    [3, NARROW],
  ] as const) {
    const context = await browser.newContext({
      baseURL: APP_URL,
      deviceScaleFactor: scale,
      reducedMotion: 'reduce',
      locale: 'en-US',
    });
    const page = await context.newPage();
    const workspace = await signIn(page);
    if (!deal) {
      deal = await chooseDeal(page, workspace);
      console.log(`workspace ${workspace}, deal ${deal}`);
      await spots(page, workspace, deal);
    }

    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      for (const shot of shots) {
        await page.setViewportSize({ width: shot.width, height: shot.height });
        await page.goto(shot.path.replace('{ws}', workspace).replace('{deal}', deal));
        await settle(page);
        await shot.prepare?.(page);
        await settle(page);
        // The pointer rests in the bottom-right corner, on no control.
        await page.mouse.move(shot.width - 1, shot.height - 1);
        const clip = typeof shot.clip === 'function' ? await shot.clip(page) : shot.clip;
        const file = path.join(RAW, `${shot.name}-${theme}.png`);
        await page.screenshot({ path: file, clip, fullPage: Boolean(clip) });
        console.log(`captured ${file}`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

mkdirSync(OUT, { recursive: true });
for (const theme of ['light', 'dark']) {
  for (const shot of [...SHOTS, ...NARROW]) {
    const name = `${shot.name}-${theme}`;
    const args = ['-quiet', '-q', '80', '-m', '6', path.join(RAW, `${name}.png`)];
    execFileSync('cwebp', [...args, '-o', path.join(OUT, `${name}.webp`)]);
    console.log(`wrote ${OUT}/${name}.webp`);
  }
}
