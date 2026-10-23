import { expect, test } from '@playwright/test';

test.describe('Sanity', () => {
  test.describe('Static pages', () => {
    test('displays the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(
        page.getByRole('heading', { level: 1, name: 'Every step of a relationship is signed.' }),
      ).toBeVisible();
      // The demos' handwriting font is theirs alone: not declared on the public pages.
      expect(
        await page.evaluate(() =>
          getComputedStyle(document.documentElement).getPropertyValue('--font-kalam'),
        ),
      ).toBe('');
    });

    test('navigates to the about page', async ({ page }) => {
      await page.goto('/');

      // The footer's link: the header's shows from 1280 px only.
      await page.getByRole('contentinfo').getByRole('link', { name: 'About', exact: true }).click();

      await expect(page).toHaveURL(/about$/u);
      await expect(page.getByRole('link', { name: 'Next.js Boilerplate' })).toBeVisible();
    });

    test('shows the not-found page for an unknown path', async ({ page }) => {
      const response = await page.goto('/no-such-page');

      expect(response?.status()).toBe(404);
      await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
      // Aureon's public page: the ink-violet bar with the wordmark, one card, no stamp on it.
      const bar = page.getByRole('banner');
      await expect(bar).toHaveCSS('background-color', 'rgb(29, 26, 46)');
      await expect(bar.getByRole('link', { name: 'Aureon CRM home' })).toBeVisible();
      await expect(page.getByText("We can't find that page.", { exact: false })).toBeVisible();
      const home = page.getByRole('link', { name: 'Back to home' });
      await expect(home).toHaveCSS('height', '32px');

      await home.click();
      await expect(page).toHaveURL(/\/$/u);
    });
  });
});
