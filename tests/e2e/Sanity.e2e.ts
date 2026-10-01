import { expect, test } from '@playwright/test';

test.describe('Sanity', () => {
  test.describe('Static pages', () => {
    test('displays the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(
        page.getByRole('heading', { name: 'Every test, graded on one card.' }),
      ).toBeVisible();
    });

    test('navigates to the about page', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('link', { name: 'About' }).click();

      await expect(page).toHaveURL(/about$/u);
      await expect(page.getByRole('link', { name: 'Next.js Boilerplate' })).toBeVisible();
    });

    test('shows the not-found page for an unknown path', async ({ page }) => {
      const response = await page.goto('/no-such-page');

      expect(response?.status()).toBe(404);
      await expect(page.getByRole('heading', { name: 'This page is absent.' })).toBeVisible();
    });
  });
});
