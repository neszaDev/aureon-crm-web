import { expect, test } from '@playwright/test';
import { signUp } from './helpers';

test.describe('Account', () => {
  test('shows the signed-in user from the backend', async ({ page }) => {
    const email = await signUp(page);

    await page.getByRole('link', { name: 'Account' }).click();

    await expect(page.getByRole('heading', { name: 'Account', level: 1 })).toBeVisible();
    await expect(page.getByRole('main').getByText(email)).toBeVisible();
    await expect(page.getByText('User', { exact: true })).toBeVisible();
  });
});
