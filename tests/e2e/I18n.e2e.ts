import { expect, test } from '@playwright/test';

test.describe('I18n', () => {
  test.describe('Language switching', () => {
    test('switches the homepage from English to French with the dropdown', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('combobox', { name: 'Change language' }).selectOption('fr');

      await expect(
        page.getByRole('heading', { level: 1, name: "Chaque étape d'une relation est signée." }),
      ).toBeVisible();
    });

    test('shows the French sign-in form under /fr', async ({ page }) => {
      await page.goto('/fr/sign-in');

      await expect(page.getByLabel('Adresse e-mail')).toBeVisible();
    });

    test('shows the Thai homepage under /th', async ({ page }) => {
      await page.goto('/th');

      await expect(
        page.getByRole('heading', { level: 1, name: 'ทุกก้าวของความสัมพันธ์มีตราประทับกำกับ' }),
      ).toBeVisible();
    });
  });
});
