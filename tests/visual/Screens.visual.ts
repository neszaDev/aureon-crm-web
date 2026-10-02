import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { signUp } from '../e2e/helpers';

// Screens whose content is fixed (no dates, no random sample data), so a pixel diff means a
// real change to a token, a primitive or a layout.
const screens = [
  '/dashboard/campus',
  '/dashboard/theme/colors',
  '/dashboard/theme/typography',
  '/dashboard/base/cards',
  '/dashboard/buttons/standard-buttons',
  '/dashboard/forms/basic-forms',
  '/dashboard/widgets',
];

const screenshot = async (page: Page, name: string) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    // The signed-in user is a new random address on every run.
    mask: [page.getByTitle(/@example\.com$/u)],
    maxDiffPixelRatio: 0.001,
  });
};

test.describe('Visual regression', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('sign-in page', async ({ page }) => {
    await page.goto('/sign-in');

    await screenshot(page, 'sign-in.png');
  });

  test.describe('Signed-in screens', () => {
    const session: { page?: Page } = {};
    const signedInPage = () => {
      if (!session.page) {
        throw new Error('beforeAll did not sign in');
      }

      return session.page;
    };

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
        reducedMotion: 'reduce',
      });
      await signUp(page);
      session.page = page;
    });

    test.afterAll(async () => {
      await session.page?.close();
    });

    for (const route of screens) {
      test(`matches ${route}`, async () => {
        const page = signedInPage();
        await page.goto(`${route}/`);

        await screenshot(page, `${route.slice('/dashboard/'.length).replaceAll('/', '-')}.png`);
      });
    }
  });
});
