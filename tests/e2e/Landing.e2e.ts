import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './crm/helpers';

test.describe('Landing', () => {
  test('opens sign-up from the hero, and sign-in from the header', async ({ page, baseURL }) => {
    await page.goto('/');

    // The hero's, the first in the page's main region (the header has its own): 44 px, as the
    // landing page's two main actions are.
    const create = page.getByRole('main').getByRole('link', { name: 'Create a workspace' }).first();
    const box = await create.boundingBox();
    expect(box?.height).toBe(44);
    await create.click();
    await expect(page).toHaveURL(`${baseURL}/sign-up`);

    await page.goto('/');
    await page.getByRole('banner').getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(`${baseURL}/sign-in`);
  });

  test('switches the landing page to Thai', async ({ page, baseURL }) => {
    await page.goto('/');

    await page.getByRole('combobox', { name: 'Change language' }).selectOption('th');

    await expect(page).toHaveURL(`${baseURL}/th`);
    await expect(
      page.getByRole('heading', {
        level: 1,
        // และ bound to what follows: the line before never ends on it.
        name: 'เห็นว่าทุกดี\u2060ล\u2060อยู่\u2060ขั้น\u2060ไหน และ\u2060ใครเป็นผู้\u2060รับ\u2060ผิด\u2060ชอบ',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('link', { name: 'สร้างพื้นที่ทำงาน' }).first(),
    ).toBeVisible();
  });

  test('shows the product, its proof and the sample-product note', async ({ page, request }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Aureon CRM: see where every deal stands, and who owns it');
    // Every section, in order, the closing band last.
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      'Capture, qualify, close. Every move keeps its name.',
      'Every list, in status sections.',
      'Every deal shows its whole track.',
      'Follow-ups, by whom and when.',
      "A dashboard and reports from what's stored.",
      'One workspace per business, one role per person.',
      'In English, French and Thai.',
      'Built for developers to start from.',
      'Questions',
      'Open a workspace. Move your first deal.',
    ]);
    // Each desk under the headline names whom it is for in its own first words, with no label
    // above it.
    const hero = page.getByRole('region', {
      name: 'See where every deal stands, and who owns it.',
    });
    await expect(hero.getByText(/^Your sales team changes a status/u)).toBeVisible();
    await expect(hero.getByText(/^Developers get a Next\.js 16 frontend/u)).toBeVisible();
    await expect(hero.getByText(/^For (your sales team|developers)$/u)).toHaveCount(0);
    // The hero's deal is drawn from the app's looks: assistive technology reads what it shows.
    await expect(
      page.getByText(
        'An illustration of a deal in the demo workspace: Brightwater fleet tablets, €18,500.00, in Proposal (stage 3 of 4), owned by Mia Rossi.',
      ),
    ).toBeAttached();
    // Real captures of the demo workspace, said so under each.
    await expect(
      page.getByRole('img', { name: /^The deals board of the demo workspace: deal cards/u }),
    ).toBeVisible();
    await expect(
      page.getByText('The deals board · demo workspace, fictional data').first(),
    ).toBeVisible();
    // Reminders are in-app only, and the product is a sample.
    await expect(
      page.getByText('Reminders are in-app only: nothing is sent by email, push or calendar.'),
    ).toBeVisible();
    await expect(page.getByRole('contentinfo').getByText(/is a sample product/u)).toBeVisible();

    // One shared image per language; this one is a PNG the page names.
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(image).toMatch(/\/opengraph-image/u);
    const response = await request.get(new URL(image ?? '').pathname);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toBe('image/png');
  });

  test('names its French page and shared image in French', async ({ page }) => {
    await page.goto('/fr');

    await expect(page).toHaveTitle(
      "Aureon CRM : voyez où en est chaque affaire, et qui s'en charge",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/fr\/opengraph-image/u,
    );
  });

  test("shows each section's phone crop in the page's language", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // The narrow crops, by their file names (the image optimiser's URLs carry them).
    const crops = async (path: string) => {
      await page.goto(path);
      return await page
        .locator('main picture source[media="(max-width: 767px)"]')
        .evaluateAll((sources) => sources.map((source) => source.getAttribute('srcset') ?? ''));
    };

    // English first: the app then remembers Thai, and would open / in it.
    const english = await crops('/');
    // Those of the deals list, the deal, the inbox, the dashboard and the reports, light and dark.
    expect(english).toHaveLength(10);
    expect(english.filter((srcset) => srcset.includes('-th-'))).toStrictEqual([]);
    const thai = await crops('/th');
    expect(thai).toHaveLength(10);
    expect(thai.filter((srcset) => !srcset.includes('-th-'))).toStrictEqual([]);
  });

  test('keeps the developer notes inside the page column at 1440 px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // The column's right edge is the header's: its last action ends there.
    const column = await page
      .getByRole('banner')
      .getByRole('link', { name: 'Create a workspace' })
      .boundingBox();
    const note = await page.getByText('How each part is built, beside the part.').boundingBox();
    expect(note && column && note.x + note.width).toBeLessThanOrEqual(
      (column?.x ?? 0) + (column?.width ?? 0),
    );
  });

  test('shows the hero capture in the theme chosen in the app, not the system one', async ({
    baseURL,
    context,
    page,
  }) => {
    await context.addCookies([{ name: 'theme', value: 'light', url: baseURL ?? '' }]);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    const hero = page.getByRole('img', {
      name: /^The deals board of the demo workspace: deal cards/u,
    });
    await expect(hero).toBeVisible();
    await expect
      .poll(async () => await hero.evaluate((img: HTMLImageElement) => img.currentSrc))
      .toMatch(/-light\./u);
  });

  for (const width of [390, 1440]) {
    for (const colorScheme of ['light', 'dark'] as const) {
      test(`passes the accessibility check at ${width} px in ${colorScheme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme });
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        await expectNoA11yViolations(page);
      });
    }
  }

  test('passes the accessibility check on the about page', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1, name: 'About Aureon CRM' })).toBeVisible();
    // Its own title, the landing page's shared image.
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'About Aureon CRM',
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/opengraph-image/u,
    );
    await expectNoA11yViolations(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectNoA11yViolations(page);
  });
});
