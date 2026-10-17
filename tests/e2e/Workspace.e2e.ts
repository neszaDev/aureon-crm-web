import { expect, test } from '@playwright/test';
import { createWorkspace, expectNoA11yViolations } from './crm/helpers';
import { signUp } from './helpers';

test.describe('Workspaces', () => {
  test('creates the first workspace and opens it in the shell', async ({ page }) => {
    await signUp(page);
    await expect(page.getByRole('heading', { name: 'Create your first workspace' })).toBeVisible();
    await expect(page.getByLabel('Default currency')).toHaveValue('USD');
    // Next streams the title after a client-side navigation: wait for it before axe looks.
    await expect(page).toHaveTitle('Your workspaces');
    await expectNoA11yViolations(page);

    await createWorkspace(page, 'Acme');

    await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Acme' })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Workspace navigation' });
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByText('Europe/Paris')).toBeVisible();
    await expect(page).toHaveTitle('Dashboard');
    await expectNoA11yViolations(page);

    // With one workspace, the CRM home opens it.
    const workspaceUrl = page.url();
    await page.goto('/app');
    await expect(page).toHaveURL(workspaceUrl);

    // A skip link comes first in the tab order and jumps past the rail.
    const skip = page.getByRole('link', { name: 'Skip to content' });
    expect(await page.evaluate(() => document.querySelector('a[href], button')?.textContent)).toBe(
      'Skip to content',
    );
    await skip.focus();
    await expect(skip).toBeVisible();
    await skip.press('Enter');
    await expect(page).toHaveURL(/#crm-main$/u);
  });

  test.describe('in another time zone', () => {
    test.use({ timezoneId: 'America/Sao_Paulo' });

    test("defaults the time zone to the browser's", async ({ page }) => {
      await signUp(page);

      await expect(page.getByLabel('Time zone')).toHaveValue('America/Sao_Paulo');
    });
  });

  test('switches between workspaces from the rail', async ({ page }) => {
    await signUp(page);
    await createWorkspace(page, 'Acme');

    await page.getByRole('button', { name: /^Switch workspace/u }).click();
    await page.getByRole('menuitem', { name: 'Create workspace' }).click();
    await expect(page.getByRole('heading', { name: 'Create a workspace' })).toBeVisible();
    await createWorkspace(page, 'Beta');
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Beta' })).toBeVisible();

    await page.getByRole('button', { name: 'Switch workspace. Current: Beta' }).click();
    await page.getByRole('menuitem', { name: /Acme/u }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Acme' })).toBeVisible();

    await page.goto('/app');
    await expect(page.getByRole('heading', { name: 'Your workspaces' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Beta/u })).toBeVisible();
    await expect(page).toHaveTitle('Your workspaces');
    await expectNoA11yViolations(page);
  });

  test('says a workspace is not found to someone who is not a member', async ({ page }) => {
    await signUp(page);

    const notFound = page.getByRole('heading', {
      name: "Workspace not found or you're not a member",
    });
    await page.goto('/app/999999999');
    await expect(notFound).toBeVisible();
    await page.goto('/app/not-a-number');
    await expect(notFound).toBeVisible();
    await page.getByRole('link', { name: 'Go to your workspaces' }).click();
    await expect(page).toHaveURL(/\/app$/u);
  });

  test('opens the rail as a drawer on a phone, in Thai', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signUp(page);
    await createWorkspace(page, 'บริษัท ตัวอย่าง จำกัด');

    await page.goto(page.url().replace('/app/', '/th/app/'));
    await page.getByRole('button', { name: 'เปิดเมนู' }).click();
    const nav = page.getByRole('navigation', { name: 'เมนูพื้นที่ทำงาน' });
    await expect(nav.getByRole('link', { name: 'แดชบอร์ด' })).toBeVisible();
    await expect(page).toHaveTitle('แดชบอร์ด');
    await expectNoA11yViolations(page);
  });
});
