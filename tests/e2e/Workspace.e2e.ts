import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { createWorkspace, expectHome, expectNoA11yViolations, invite } from './crm/helpers';
import { PASSWORD, signUp, uniqueEmail } from './helpers';
import { TEAMS } from './mockData';

/**
 * Registers through an invitation link and waits for the workspace it opens.
 * @param page Playwright page, signed out.
 * @param path The link.
 * @param workspaceId The invitation's workspace.
 */
const joinThrough = async (page: Page, path: string, workspaceId: number) => {
  await page.goto(path);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account and join' }).click();
  await expect(page).toHaveURL(new RegExp(`/app/${workspaceId}$`, 'u'));
};

test.describe('Workspaces', () => {
  test('creates the first workspace and opens it in the shell', async ({ page }) => {
    await signUp(page);
    await expect(page.getByRole('heading', { name: 'Create your first workspace' })).toBeVisible();
    await expect(page.getByLabel('Default currency')).toHaveValue('USD');
    // Next streams the title after a client-side navigation: wait for it before axe looks.
    await expect(page).toHaveTitle('Your workspaces');
    await expectNoA11yViolations(page);

    await createWorkspace(page, TEAMS.default.name);

    // It opens on its home; a workspace with nothing in it starts with its first records.
    await expectHome(page, TEAMS.default.name);
    await expect(
      page.getByRole('heading', { name: 'Start with your first records' }),
    ).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Workspace navigation' });
    await expect(
      page.getByRole('navigation', { name: 'Quick access' }).getByRole('link', { name: 'Home' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    await expect(page).toHaveTitle('Home');
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

    // The time zone chosen in the form is the workspace's: Settings shows it.
    await nav.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings\/workspace$/u);
    await expect(page.getByLabel('Time zone')).toHaveValue('Europe/Paris');
  });

  test.describe('in another time zone', () => {
    test.use({ timezoneId: 'America/Sao_Paulo' });

    test("defaults the time zone to the browser's", async ({ page }) => {
      await signUp(page);

      await expect(page.getByLabel('Time zone')).toHaveValue('America/Sao_Paulo');
    });
  });

  test('switches between workspaces from the sidebar', async ({ page }) => {
    await signUp(page);
    await createWorkspace(page, TEAMS.default.name);

    await page.getByRole('button', { name: /^Switch workspace/u }).click();
    await page.getByRole('menuitem', { name: 'Create workspace' }).click();
    await expect(page.getByRole('heading', { name: 'Create a workspace' })).toBeVisible();
    await createWorkspace(page, TEAMS.other.name);
    await expectHome(page, TEAMS.other.name);

    await page
      .getByRole('button', {
        name: `Switch workspace. Current: ${TEAMS.other.name}`,
      })
      .click();
    await page.getByRole('menuitem', { name: TEAMS.default.name }).click();
    await expectHome(page, TEAMS.default.name);

    await page.goto('/app');
    await expect(page.getByRole('heading', { name: 'Your workspaces' })).toBeVisible();
    await expect(page.getByRole('link', { name: TEAMS.other.name })).toBeVisible();
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

  test('shows the pipeline read-only to an invited manager', async ({ page, request }) => {
    const { path, workspaceId } = await invite(request, uniqueEmail());
    await joinThrough(page, path, workspaceId);

    await page
      .getByRole('navigation', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'Settings' })
      .click();
    await page.getByRole('link', { name: 'Pipeline', exact: true }).click();
    await expect(page).toHaveURL(/\/settings\/pipeline$/u);

    await expect(page.getByText('Only owners and admins can change the pipeline.')).toBeVisible();
    await expect(page.locator('[data-stage-name]')).toHaveCount(6);
    await expect(page.getByRole('button', { name: /^(Drag|Move|Edit|Delete) /u })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Add stage' })).toHaveCount(0);
    await expect(page.getByLabel('Stage name')).toHaveCount(0);
    await expect(page).toHaveTitle('Pipeline');
    await expectNoA11yViolations(page);
  });

  test("ends a removed member's access at their next page", async ({
    page,
    browser,
    request,
    baseURL,
  }) => {
    const email = uniqueEmail();
    const { path, workspaceId, ownerEmail } = await invite(request, email);
    await joinThrough(page, path, workspaceId);

    // The owner, in a browser of their own, removes the manager.
    const ownerContext = await browser.newContext({ baseURL });
    const owner = await ownerContext.newPage();
    await owner.goto('/sign-in');
    await owner.getByLabel('Email address').fill(ownerEmail);
    await owner.getByLabel('Password').fill(PASSWORD);
    await owner.getByRole('button', { name: 'Sign in' }).click();
    await expect(owner).toHaveURL(new RegExp(`/app/${workspaceId}$`, 'u'));
    await owner.goto(`/app/${workspaceId}/settings/members`);
    await expect(owner.getByRole('heading', { name: '2 members' })).toBeVisible();
    await owner.getByRole('button', { name: `Remove ${email}` }).click();
    await owner.getByRole('alertdialog').getByRole('button', { name: 'Remove' }).click();
    await expect(owner.getByRole('heading', { name: '1 member' })).toBeVisible();
    await ownerContext.close();

    // The manager's next navigation inside the workspace.
    await page
      .getByRole('navigation', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'Settings' })
      .click();
    await expect(
      page.getByRole('heading', { name: "Workspace not found or you're not a member" }),
    ).toBeVisible();
  });

  test('opens the rail as a drawer on a phone, in Thai', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signUp(page);
    await createWorkspace(page, 'บริษัท ตัวอย่าง จำกัด');

    await page.goto(page.url().replace('/app/', '/th/app/'));
    await page.getByRole('button', { name: 'เปิดเมนู' }).click();
    const nav = page.getByRole('navigation', { name: 'เมนูพื้นที่ทำงาน' });
    await expect(nav.getByRole('link', { name: 'แดชบอร์ด' })).toBeVisible();
    await expect(page).toHaveTitle('หน้าแรก');
    await expectNoA11yViolations(page);
  });
});
