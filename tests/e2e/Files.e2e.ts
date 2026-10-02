import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { signUp } from './helpers';

test.describe('Files', () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page);
    await page.goto('/dashboard/files');
  });

  test('uploads, downloads and deletes a file', async ({ page }) => {
    await expect(page.getByText('No files yet.')).toBeVisible();

    await page.getByLabel('File', { exact: true }).setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Blood pressure: 120/80'),
    });
    await page.getByRole('button', { name: 'Upload' }).click();
    await expect(page.getByRole('status')).toHaveText('Uploaded notes.txt');

    const link = page.getByRole('link', { name: 'notes.txt' });
    await expect(link).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
    expect(download.suggestedFilename()).toBe('notes.txt');
    expect(await readFile(await download.path(), 'utf-8')).toBe('Blood pressure: 120/80');

    await page.getByRole('button', { name: 'Delete notes.txt' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('No files yet.')).toBeVisible();
  });

  test('refuses a file whose content does not match its type', async ({ page }) => {
    await page.getByLabel('File', { exact: true }).setInputFiles({
      name: 'picture.png',
      mimeType: 'image/png',
      buffer: Buffer.from('<script>alert(1)</script>'),
    });
    await page.getByRole('button', { name: 'Upload' }).click();

    await expect(page.locator('form').getByRole('alert')).toContainText(
      "This kind of file isn't allowed",
    );
    await expect(page.getByText('No files yet.')).toBeVisible();
  });

  test('refuses a file over 10 MB before uploading it', async ({ page }) => {
    await page.getByLabel('File', { exact: true }).setInputFiles({
      name: 'big.txt',
      mimeType: 'text/plain',
      buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 'a'),
    });
    await page.getByRole('button', { name: 'Upload' }).click();

    await expect(page.locator('form').getByRole('alert')).toHaveText(
      'The file is larger than 10 MB',
    );
  });

  test("doesn't serve another user's file", async ({ page }) => {
    const response = await page.request.get('/dashboard/files/999999999/content');

    expect(response.status()).toBe(404);
  });
});
