import { expect, test } from '@playwright/test';

test.describe('Sanity', () => {
  test.describe('Static pages', () => {
    test('displays the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(
        page.getByRole('heading', { name: 'Frontend starter for the Spring Boot API' }),
      ).toBeVisible();
    });

    test('navigates to the about page', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('link', { name: 'About' }).click();

      await expect(page).toHaveURL(/about$/u);
      await expect(page.getByRole('link', { name: 'Next.js Boilerplate' })).toBeVisible();
    });
  });
});
