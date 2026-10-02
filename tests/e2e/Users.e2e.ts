import { expect, test } from '@playwright/test';
import { ADMIN, signIn, signUp } from './helpers';

test.describe('User management', () => {
  test('is hidden from regular users', async ({ page }) => {
    await signUp(page);

    const nav = page.getByRole('navigation', { name: 'App navigation' });
    await expect(nav.getByRole('link', { name: 'Files' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Users', exact: true })).toHaveCount(0);

    await page.goto('/dashboard/users');
    await expect(page.getByText('Only admins manage users')).toBeVisible();
    await expect(page.getByRole('search')).toHaveCount(0);
  });

  test('lets an admin find, promote and delete a user', async ({ page, browser }) => {
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    const email = await signUp(otherPage);

    await signIn(page, ADMIN);
    await page
      .getByRole('navigation', { name: 'App navigation' })
      .getByRole('link', { name: 'Users', exact: true })
      .click();
    await page.getByLabel('Search by email').fill(email.slice(4, 20).toUpperCase());
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('link', { name: email }).click();

    await expect(page.getByRole('heading', { level: 1, name: email })).toBeVisible();
    await page.getByLabel('Role').selectOption('ADMIN');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status')).toHaveText('Saved');

    // Saving signed them out everywhere; signing in again carries the new role.
    await otherPage.context().clearCookies({ name: 'access_token' });
    await otherPage.goto('/dashboard');
    await expect(otherPage).toHaveURL(/\/sign-in$/u);

    await page.getByRole('button', { name: 'Delete account' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveURL(/\/dashboard\/users\/?$/u);
    await page.getByLabel('Search by email').fill(email);
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('No users match this search.')).toBeVisible();

    await other.close();
  });

  test('does not let an admin change their own account', async ({ page }) => {
    await signIn(page, ADMIN);
    await page.goto(`/dashboard/users?q=${encodeURIComponent(ADMIN.email)}`);
    await page.getByRole('link', { name: ADMIN.email }).click();

    await expect(page.getByText('This is your own account.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete account' })).toHaveCount(0);
  });
});
