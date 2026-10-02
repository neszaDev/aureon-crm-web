import { expect, test } from '@playwright/test';
import { signUp } from './helpers';

test.describe('Test results', () => {
  test('creates, lists, summarizes and deletes a result', async ({ page }) => {
    await signUp(page);
    await page.getByRole('link', { name: 'Test results' }).click();
    await expect(page.getByText('No test results yet')).toBeVisible();

    await page.getByLabel('Test name').fill('Blood pressure check');
    await page.getByLabel('Status').selectOption('PASSED');
    await page.getByLabel('Score').fill('92.5');
    await page.getByLabel('Tested at').fill('2026-08-25T10:30');
    await page.getByRole('button', { name: 'Add' }).click();

    const row = page.getByRole('row', { name: /Blood pressure check/u });
    await expect(row).toContainText('Passed');
    await expect(row).toContainText('92.5');
    await expect(page.getByTestId('summary-PASSED')).toContainText('1');

    await page.getByRole('button', { name: 'Delete Blood pressure check' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('No test results yet')).toBeVisible();
    await expect(page.getByTestId('summary-PASSED')).toContainText('0');
  });

  test('rejects a score outside 0-100 before calling the backend', async ({ page }) => {
    await signUp(page);
    await page.goto('/dashboard/test-results');

    await page.getByLabel('Test name').fill('Out of range');
    await page.getByLabel('Score').fill('150');
    await page.getByLabel('Tested at').fill('2026-08-25T10:30');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Score must be between 0 and 100')).toBeVisible();
  });
});
