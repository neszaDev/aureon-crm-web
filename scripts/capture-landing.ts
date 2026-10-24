// Captures the landing page's screenshots from the running app (`pnpm capture:landing`): the
// fictional demo workspace, signed in as its owner, in light and dark. Run it against a
// production build on a spare port, with the backend's demo workspace there (its e2e admin's
// "Northwind Supply", which the e2e global setup seeds):
//
//   BACKEND_URL=http://localhost:8081 APP_URL=http://localhost:3105 pnpm exec next start -p 3105
//   APP_URL=http://localhost:3105 pnpm capture:landing
//
// PNGs go to a scratch directory (CAPTURE_DIR), WebP files (cwebp) to public/landing/, and where
// each section's ring sits to public/landing/spots.json, which the page imports. Every file's
// provenance is in public/landing/README.md (update its date when you capture again), and beside
// the file (`<file>.webp.json`, the README's `impeccable embed-prompt` command).
/* oxlint-disable no-await-in-loop -- one browser page takes one shot after another */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { chromium } from '@playwright/test';

const APP_URL = process.env.APP_URL ?? 'http://localhost:3105';
const EMAIL = process.env.DEMO_EMAIL ?? 'admin@e2e.test';
const PASSWORD = process.env.DEMO_PASSWORD ?? 'e2e-admin-password';
const WORKSPACE = process.env.DEMO_WORKSPACE ?? 'Northwind Supply';
const RAW = process.env.CAPTURE_DIR ?? path.join(tmpdir(), 'aureon-landing');
const OUT = 'public/landing';

// The app's own words for what the shots look for, in each language they are taken in.
type Locale = 'en' | 'th';
const MESSAGES: Record<Locale, Record<string, Record<string, string>>> = {
  en: JSON.parse(readFileSync('src/locales/en.json', 'utf-8')),
  th: JSON.parse(readFileSync('src/locales/th.json', 'utf-8')),
};
const say = (locale: Locale, key: string) => {
  const [namespace = '', name = ''] = key.split('.');
  const text = MESSAGES[locale][namespace]?.[name];
  if (!text) {
    throw new Error(`No ${key} in ${locale}`);
  }

  return text;
};

type Clip = { x: number; y: number; width: number; height: number };
type Shot = {
  name: string;
  // `{ws}` is the demo workspace's path (`/app/12`), `{deal}` the chosen deal's id. The locale
  // prefix is explicit: the app remembers the last locale it was opened in.
  path: string;
  width: number;
  height: number;
  // Before the shot: open the record panel or a popover, scroll.
  prepare?: (page: Page, deal: string) => Promise<void>;
  // The part of the page to keep, in page coordinates (the whole viewport without one).
  clip?: Clip | ((page: Page) => Promise<Clip>);
};

// The lists' status sections (`StatusSection`), and the phone board's stage picker.
const SECTION = '#crm-main [data-slot=collapsible]';
const STAGE_PICKER = 'label[for="board-stage"]';

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

// A box's whole pixels only: a clip on a fraction takes a sliver of what lies beside it.
const inside = (box: Clip) => {
  const x = Math.ceil(box.x);
  const y = Math.ceil(box.y);
  return {
    x,
    y,
    width: Math.floor(box.x + box.width) - x,
    height: Math.floor(box.y + box.height) - y,
  };
};

// The panel (the section) a heading names, in page coordinates.
const panelOf = async (page: Page, heading: string) =>
  await page
    .getByRole('heading', { name: heading, exact: true })
    .first()
    .evaluate((title) => {
      const panel = title.closest('section') ?? title;
      const rect = panel.getBoundingClientRect();
      return { y: rect.y + window.scrollY, bottom: rect.bottom + window.scrollY };
    });

// Opens a deal in the record panel from its row in the deals list.
const openDeal = async (page: Page, deal: string) => {
  await page.locator(`#crm-main a[href$="/deals/${deal}"]`).first().click();
  await page.getByRole('dialog').getByRole('heading', { level: 1 }).waitFor();
};

const openInbox = async (page: Page, locale: Locale = 'en') => {
  const title = say(locale, 'RemindersBell.title');
  await page.getByRole('button', { name: new RegExp(`^${title}`, 'u') }).click();
  await page.getByRole('dialog', { name: title }).waitFor();
};

// Scrolls a phone-width board so its stage picker sits under the sticky top bar.
const toBoard = async (page: Page) => {
  await page.locator(STAGE_PICKER).evaluate((label) => {
    window.scrollTo(0, label.getBoundingClientRect().top + window.scrollY - 56 - 16);
  });
};

// The "Table" toggle under a report's chart: clips end above it, on the chart's edge.
const tableToggle = (locale: Locale) =>
  `button[aria-expanded]:text-is("${say(locale, 'ChartTable.label')}")`;

// The desktop captures: the whole app at 1440 px, as a visitor would see it.
const SHOTS: Shot[] = [
  {
    // The hero: the deals board in its shell, down to the end of its columns.
    name: 'board',
    path: '/en{ws}/deals',
    width: 1440,
    height: 900,
    clip: async (page) => {
      const board = await boxOf(page, '.board-scroll');
      return { x: 0, y: 0, width: 1440, height: Math.min(900, Math.ceil(board.bottom) + 20) };
    },
  },
  // The deals list in its status sections.
  { name: 'deals-list', path: '/en{ws}/deals?view=list', width: 1440, height: 900 },
  {
    // The chosen deal in the record panel, over the list.
    name: 'deal',
    path: '/en{ws}/deals?view=list',
    width: 1440,
    height: 900,
    prepare: openDeal,
  },
  {
    name: 'tasks',
    path: '/en{ws}/tasks',
    width: 1440,
    height: 760,
    prepare: async (page) => {
      await openInbox(page);
    },
  },
  {
    // Insights › Dashboard, down to the panels above its recent activity.
    name: 'dashboard',
    path: '/en{ws}/dashboard',
    width: 1440,
    height: 900,
    clip: async (page) => {
      const activity = await panelOf(page, say('en', 'RecentActivity.title'));
      return { x: 0, y: 0, width: 1440, height: Math.floor(activity.y) - 4 };
    },
  },
  {
    // Reports, Won and lost, down to the chart's edge, above its table.
    name: 'reports',
    path: '/en{ws}/reports?tab=won-lost',
    width: 1440,
    height: 900,
    clip: async (page) => {
      const toggle = await boxOf(page, tableToggle('en'));
      return { x: 0, y: 0, width: 1440, height: Math.floor(toggle.y) - 8 };
    },
  },
  // The languages section: the deals board in Thai on a phone.
  { name: 'board-390-th', path: '/th{ws}/deals', width: 390, height: 844, prepare: toBoard },
];

// Below 768 px the page shows these instead: narrow crops around each part a section is about,
// drawn at a phone's density, in English and in Thai (`-th`, for the Thai page).
const NARROW: Shot[] = (['en', 'th'] as const).flatMap((locale): Shot[] => {
  const suffix = locale === 'en' ? '' : '-th';
  return [
    {
      // The phone hero: the board's first stage, from its picker down.
      name: `board-hero-390${suffix}`,
      path: `/${locale}{ws}/deals`,
      width: 390,
      height: 844,
      clip: async (page) => {
        const picker = await boxOf(page, STAGE_PICKER);
        return { x: 0, y: Math.floor(picker.y) - 12, width: 390, height: 520 };
      },
    },
    {
      // The deals list's first status section.
      name: `deals-list-390${suffix}`,
      path: `/${locale}{ws}/deals?view=list`,
      width: 390,
      height: 844,
      clip: async (page) => {
        const section = await boxOf(page, SECTION);
        return {
          x: 0,
          y: Math.floor(section.y) - 12,
          width: 390,
          height: Math.ceil(section.height) + 24,
        };
      },
    },
    {
      // The deal's header: its pill, owner and track.
      name: `deal-390${suffix}`,
      path: `/${locale}{ws}/deals/{deal}`,
      width: 390,
      height: 844,
      clip: async (page) => {
        const header = await boxOf(page, '#crm-main [data-record] > header');
        return {
          x: 0,
          y: Math.floor(header.y) - 16,
          width: 390,
          height: Math.ceil(header.height) + 32,
        };
      },
    },
    {
      name: `tasks-inbox${suffix}`,
      path: `/${locale}{ws}/tasks`,
      width: 1440,
      height: 760,
      prepare: async (page) => {
        await openInbox(page, locale);
      },
      // The popover alone, inside its edge: around it lie pieces of the page it covers.
      clip: async (page) => inside(await boxOf(page, '[role="dialog"]')),
    },
    {
      // The figures and the open deals by stage.
      name: `dashboard-390${suffix}`,
      path: `/${locale}{ws}/dashboard`,
      width: 390,
      height: 844,
      clip: async (page) => {
        const main = await boxOf(page, '#crm-main');
        const stages = await panelOf(page, say(locale, 'StageDistribution.title'));
        return {
          x: 0,
          y: Math.floor(main.y),
          width: 390,
          height: Math.ceil(stages.bottom) + 16 - Math.floor(main.y),
        };
      },
    },
    {
      name: `reports-390${suffix}`,
      path: `/${locale}{ws}/reports?tab=won-lost`,
      width: 390,
      height: 844,
      clip: async (page) => {
        const panel = await panelOf(page, say(locale, 'WonLostReport.title'));
        const toggle = await boxOf(page, tableToggle(locale));
        const top = Math.floor(panel.y) - 16;
        return { x: 0, y: top, width: 390, height: Math.floor(toggle.y) - 8 - top };
      },
    },
  ];
});

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

// The open deal furthest along the pipeline, whose track shows the most moves: the first deal of
// the last open stage in the list (its sections in pipeline order; Won is green, Lost red).
const chooseDeal = async (page: Page, workspace: string) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/en${workspace}/deals?view=list`);
  await settle(page);
  const ids = await page.locator(SECTION).evaluateAll((sections) =>
    sections.flatMap((section) => {
      const tone = section.querySelector<HTMLElement>('h3 [data-tone]')?.dataset.tone;
      const href = section.querySelector('a[href*="/deals/"]')?.getAttribute('href') ?? '';
      const id = /\/deals\/(\d+)$/u.exec(href)?.[1];
      return id && tone !== 'green' && tone !== 'red' ? [id] : [];
    }),
  );
  const deal = ids.at(-1);
  if (!deal) {
    throw new Error('No open deal in the demo workspace');
  }

  return deal;
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

// Where each section's ring sits on its capture, in percent (public/landing/spots.json, which
// page.tsx imports): the list's first section heading, the deal's track in the panel, the inbox.
const spots = async (page: Page, workspace: string, deal: string) => {
  const frame = { x: 0, y: 0, width: 1440, height: 900 };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/en${workspace}/deals?view=list`);
  await settle(page);
  const lists = percent(pad(await boxOf(page, `${SECTION} h3 > button`), 6), frame);

  await openDeal(page, deal);
  await settle(page);
  const track = percent(pad(await boxOf(page, '[role="dialog"] header ol'), 8), frame);

  await page.setViewportSize({ width: 1440, height: 760 });
  await page.goto(`/en${workspace}/tasks`);
  await settle(page);
  await openInbox(page);
  const inbox = await boxOf(page, '[role="dialog"]');
  const tasks = percent(pad(inbox, 4), { ...frame, height: 760 });

  const file = path.join(OUT, 'spots.json');
  writeFileSync(file, `${JSON.stringify({ lists, deal: track, tasks }, null, 2)}\n`);
  console.log(`wrote ${file}`);
};

// Signs in and opens the demo workspace, whichever the account opened last.
const signIn = async (page: Page) => {
  await page.goto('/en/sign-in');
  await page.getByLabel('Email address').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/app(?:\/\d+)?$/u);
  await page.goto('/en/app');
  // The picker's link reads its mark's initials and the caller's role around the name.
  await page.getByRole('link').filter({ hasText: WORKSPACE }).click();
  await page.waitForURL(/\/app\/\d+$/u);

  return new URL(page.url()).pathname.replace(/^\/(?:en|fr|th)(?=\/)/u, '');
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
      mkdirSync(OUT, { recursive: true });
      await spots(page, workspace, deal);
    }

    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      for (const shot of shots) {
        await page.setViewportSize({ width: shot.width, height: shot.height });
        await page.goto(shot.path.replace('{ws}', workspace).replace('{deal}', deal));
        await settle(page);
        await shot.prepare?.(page, deal);
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
