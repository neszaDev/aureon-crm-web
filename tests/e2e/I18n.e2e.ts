import { expect, test } from '@playwright/test';

test.describe('I18n', () => {
  test.describe('Language switching', () => {
    test('switches the homepage from English to French with the dropdown', async ({ page }) => {
      await page.goto('/');

      // By role: the footer copy of the picker (phones only) is hidden on desktop.
      await page.getByRole('combobox', { name: 'Change language' }).selectOption('fr');

      await expect(
        page.getByRole('heading', { name: 'Chaque test, noté sur un seul bulletin.' }),
      ).toBeVisible();
    });

    test('shows the French sign-in form under /fr', async ({ page }) => {
      await page.goto('/fr/sign-in');

      await expect(page.getByLabel('Adresse e-mail')).toBeVisible();
    });
  });
});
