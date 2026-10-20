import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './crm/helpers';

test.describe('Landing', () => {
  test('opens sign-up from the hero, and sign-in from the header', async ({ page, baseURL }) => {
    await page.goto('/');

    // The hero's, the first in the page's main region (the header has its own).
    await page.getByRole('main').getByRole('link', { name: 'Create a workspace' }).first().click();
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
        name: 'ทุกก้าวของความ\u2060สัมพันธ์มีตรา\u2060ประทับกำ\u2060กับ',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('link', { name: 'สร้างพื้นที่ทำงาน' }).first(),
    ).toBeVisible();
  });

  test('shows the product, its proof and the sample-product note', async ({ page, request }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Aureon CRM: every step of a relationship is signed');
    // Every section, in order, the closing band last.
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      'Capture, qualify, close. Every step keeps its signature.',
      'See how far every deal has travelled.',
      'Every deal keeps its history.',
      'Follow-ups, by whom and when.',
      "A dashboard and reports from what's stored.",
      'One workspace per business, one role per person.',
      'In English, French and Thai.',
      'Built for developers to start from.',
      'Questions',
      'Open a workspace. Sign the first step.',
    ]);
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

    await expect(page).toHaveTitle("Aureon CRM : chaque étape d'une relation est signée");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/fr\/opengraph-image/u,
    );
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
