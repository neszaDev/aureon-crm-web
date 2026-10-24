import { expect, test } from '@playwright/test';

test.describe('Sanity', () => {
  test.describe('Static pages', () => {
    test('displays the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(
        page.getByRole('heading', {
          level: 1,
          name: 'See where every deal stands, and who owns it.',
        }),
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
      // Aureon's public page: the wordmark with its violet mark over the canvas, one card.
      const wordmark = page.getByRole('banner').getByRole('link', { name: 'Aureon CRM home' });
      await expect(wordmark).toBeVisible();
      await expect(wordmark.locator('[data-slot="aureon-mark"]')).toHaveCSS(
        'color',
        'rgb(90, 69, 224)',
      );
      await expect(page.getByText("We can't find that page.", { exact: false })).toBeVisible();
      const home = page.getByRole('link', { name: 'Back to home' });
      await expect(home).toHaveCSS('height', '32px');

      await home.click();
      await expect(page).toHaveURL(/\/$/u);
    });
  });
});
