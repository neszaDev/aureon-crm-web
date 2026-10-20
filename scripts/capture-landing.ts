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
  // Before the shot: open a popover, scroll.
  prepare?: (page: Page) => Promise<void>;
  // The part of the viewport to keep (the whole viewport without one).
  clip?: Clip | ((page: Page) => Promise<Clip>);
};

// The CRM rail's width from 1024 px (DESIGN.md): content clips start after it.
const RAIL = 232;

// Scrolls a phone-width board so its stage picker sits under the sticky top bar.
const toBoard = async (page: Page) => {
  await page.locator('label[for="board-stage"]').evaluate((label) => {
    window.scrollTo(0, label.getBoundingClientRect().top + window.scrollY - 56 - 16);
  });
};

const SHOTS: Shot[] = [
  {
    // The hero: the board's columns only, without the rail and the page header.
    name: 'board-columns',
    path: '/en{ws}/deals',
    width: 1440,
    height: 1200,
    clip: async (page) => {
      const box = await page.locator('.board-scroll').boundingBox();
      if (!box) {
        throw new Error('No board on the deals page');
      }

      return { x: box.x - 20, y: box.y - 20, width: 1440 - box.x + 20, height: 720 };
    },
  },
  { name: 'board', path: '/en{ws}/deals', width: 1440, height: 900 },
  // Tall enough for the stamp row and the stage history under the facts.
  { name: 'deal', path: '/en{ws}/deals/{deal}', width: 1440, height: 1100 },
  {
    name: 'dashboard',
    path: '/en{ws}',
    width: 1280,
    height: 640,
    clip: { x: RAIL, y: 0, width: 1280 - RAIL, height: 640 },
  },
  {
    name: 'reports',
    path: '/en{ws}/reports?tab=won-lost',
    width: 1280,
    height: 700,
    clip: { x: RAIL, y: 0, width: 1280 - RAIL, height: 700 },
  },
  {
    name: 'tasks',
    path: '/en{ws}/tasks',
    width: 1440,
    height: 680,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Reminders/u }).click();
      await page.getByRole('dialog', { name: 'Reminders' }).waitFor();
    },
  },
  {
    // The phone hero shows only the sheet's top: the bar, the stage picker and the first card.
    name: 'board-390',
    path: '/en{ws}/deals',
    width: 390,
    height: 844,
    prepare: toBoard,
    clip: { x: 0, y: 0, width: 390, height: 480 },
  },
  { name: 'board-390-th', path: '/th{ws}/deals', width: 390, height: 844, prepare: toBoard },
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
    const titles = await page
      .locator('[title^="Moved here by"]')
      .evaluateAll((boxes) => boxes.map((box) => box.getAttribute('title')));
    const signers = new Set(titles).size * 100 + titles.length;
    if (signers > best.signers) {
      best = { id: id ?? '', signers };
    }
  }
  if (!best.id) {
    throw new Error('No won deal in the demo workspace');
  }

  return best.id;
};

mkdirSync(RAW, { recursive: true });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    baseURL: APP_URL,
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    locale: 'en-US',
  });
  const page = await context.newPage();
  await page.goto('/en/sign-in');
  await page.getByLabel('Email address').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/app(?:\/\d+)?$/u);
  if (!/\/app\/\d+$/u.test(page.url())) {
    await page.getByRole('link', { name: WORKSPACE }).click();
    await page.waitForURL(/\/app\/\d+$/u);
  }
  const workspace = new URL(page.url()).pathname;
  const deal = await chooseDeal(page, workspace);
  console.log(`workspace ${workspace}, deal ${deal}`);

  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme });
    for (const shot of SHOTS) {
      await page.setViewportSize({ width: shot.width, height: shot.height });
      await page.goto(shot.path.replace('{ws}', workspace).replace('{deal}', deal));
      await settle(page);
      await shot.prepare?.(page);
      await settle(page);
      const clip = typeof shot.clip === 'function' ? await shot.clip(page) : shot.clip;
      const file = path.join(RAW, `${shot.name}-${theme}.png`);
      await page.screenshot({ path: file, clip });
      console.log(`captured ${file}`);
    }
  }
} finally {
  await browser.close();
}

mkdirSync(OUT, { recursive: true });
for (const theme of ['light', 'dark']) {
  for (const shot of SHOTS) {
    const name = `${shot.name}-${theme}`;
    const args = ['-quiet', '-q', '80', '-m', '6', path.join(RAW, `${name}.png`)];
    execFileSync('cwebp', [...args, '-o', path.join(OUT, `${name}.webp`)]);
    console.log(`wrote ${OUT}/${name}.webp`);
  }
}
