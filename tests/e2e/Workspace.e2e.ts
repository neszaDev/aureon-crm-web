import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { signUp } from './helpers';

// WCAG 2.1 A + AA, as checked by axe-core.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const expectNoA11yViolations = async (page: Page) => {
  // Measure colours once menus and drawers have finished fading in.
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== 'running'),
  );
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  expect(
    violations.map((violation) => ({
      rule: violation.id,
      targets: violation.nodes.map((node) => `${node.target.join(' ')}: ${node.failureSummary}`),
    })),
  ).toEqual([]);
};

/**
 * Fills and sends the workspace form.
 * @param page Playwright page.
 * @param name Workspace name.
 */
const createWorkspace = async (page: Page, name: string) => {
  await page.getByLabel('Workspace name').fill(name);
  await page.getByLabel('Default currency').selectOption('EUR');
  await page.getByLabel('Time zone').selectOption('Europe/Paris');
  await page.getByRole('button', { name: 'Create workspace' }).click();
  await expect(page).toHaveURL(/\/app\/\d+$/u);
};

test.describe('Workspaces', () => {
  test('creates the first workspace and opens it in the shell', async ({ page }) => {
    await signUp(page);
    await expect(page.getByRole('heading', { name: 'Create your first workspace' })).toBeVisible();
    await expect(page.getByLabel('Default currency')).toHaveValue('USD');
    await expectNoA11yViolations(page);

    await createWorkspace(page, 'Acme');

    await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Acme' })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Workspace navigation' });
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByText('Europe/Paris')).toBeVisible();
    await expectNoA11yViolations(page);

    // With one workspace, the CRM home opens it.
    const workspaceUrl = page.url();
    await page.goto('/app');
    await expect(page).toHaveURL(workspaceUrl);
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
    await expectNoA11yViolations(page);
  });
});
