import { expect, test } from '@playwright/test';

test.describe('I18n', () => {
  test.describe('Language switching', () => {
    test('switches the homepage from English to French with the dropdown', async ({ page }) => {
      await page.goto('/');

      await page.getByLabel('Change language').selectOption('fr');

      await expect(
        page.getByRole('heading', { name: "Point de départ frontend pour l'API Spring Boot" }),
      ).toBeVisible();
    });

    test('shows the French sign-in form under /fr', async ({ page }) => {
      await page.goto('/fr/sign-in');

      await expect(page.getByLabel('Adresse e-mail')).toBeVisible();
    });
  });
});
