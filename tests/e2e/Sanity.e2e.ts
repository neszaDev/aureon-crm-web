import { expect, test } from '@playwright/test';

test.describe('Sanity', () => {
  test.describe('Static pages', () => {
    test('displays the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(
        page.getByRole('heading', { level: 1, name: 'Every step of a relationship is signed.' }),
      ).toBeVisible();
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
      await expect(
        page.getByRole('heading', { level: 1, name: 'This page is absent.' }),
      ).toBeVisible();
      // Aureon's public page: the vermilion bar with the wordmark, one card, no stamp on it.
      const bar = page.getByRole('banner');
      await expect(bar).toHaveCSS('background-color', 'rgb(200, 54, 28)');
      await expect(bar.getByRole('link', { name: 'Aureon CRM home' })).toBeVisible();
      await expect(page.getByText('Absent', { exact: true })).toHaveCount(0);
      const home = page.getByRole('link', { name: 'Back to home' });
      await expect(home).toHaveCSS('height', '36px');

      await home.click();
      await expect(page).toHaveURL(/\/$/u);
    });
  });
});
