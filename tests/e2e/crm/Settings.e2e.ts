import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { PASSWORD, signUp } from '../helpers';
import { emailFor, PEOPLE, TEAMS } from '../mockData';
import { createWorkspace, expectNoA11yViolations } from './helpers';

const NEW_PASSWORD = 'another-secure-password';

/**
 * Signs up, creates the default team's workspace and returns its URL.
 * @param page Playwright page.
 * @returns The new account's email and the workspace URL.
 */
const startWorkspace = async (page: Page) => {
  const email = await signUp(page);
  const workspace = await createWorkspace(page, TEAMS.default.name);

  return { email, workspace };
};

/**
 * Reads the stage names in the order the pipeline shows them.
 * @param page Playwright page.
 * @returns The names.
 */
const stageOrder = async (page: Page) => await page.locator('[data-stage-name]').allTextContents();

/**
 * Opens a page and checks that nothing is wider than the viewport (no sideways scrolling) and
 * that its forms post.
 * @param page Playwright page, 390 px wide.
 * @param url The page.
 */
const expectFits = async (page: Page, url: string) => {
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(
    390,
  );
  // A submit before hydration must post: a GET would put what was typed in the URL.
  await expect(page.locator('form:not([method="post"])'), url).toHaveCount(0);
};

/**
 * The colours the page gives the browser's bar (`theme-color`), one per OS scheme.
 * @param page Playwright page.
 * @returns The tags' colours.
 */
const barColours = async (page: Page) =>
  await page
    .locator('meta[name="theme-color"]')
    .evaluateAll((tags) => tags.map((tag) => tag.getAttribute('content')));

test.describe('Settings', () => {
  test('renames the workspace and changes its currency', async ({ page }) => {
    const { workspace } = await startWorkspace(page);

    await page
      .getByRole('navigation', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'Settings' })
      .click();
    await expect(page).toHaveURL(`${workspace}/settings/workspace`);
    await expect(page).toHaveTitle('Workspace');
    await expectNoA11yViolations(page);

    await page.getByLabel('Workspace name').fill(TEAMS.renamed.name);
    await page.getByLabel('Default currency').selectOption('THB');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: `Switch workspace. Current: ${TEAMS.renamed.name}` }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Default currency')).toHaveValue('THB');
  });

  test('asks to reload when someone else saved the workspace first', async ({ page }) => {
    const { workspace } = await startWorkspace(page);
    await page.goto(`${workspace}/settings/workspace`);
    const other = await page.context().newPage();
    await other.goto(`${workspace}/settings/workspace`);
    // The form fills its fields once hydrated; typing earlier would be overwritten.
    await expect(other.getByLabel('Workspace name')).toHaveValue(TEAMS.default.name);
    await other.getByLabel('Workspace name').fill(`${TEAMS.default.name} by the other tab`);
    await other.getByRole('button', { name: 'Save changes' }).click();
    await expect(other.getByText('Saved', { exact: true })).toBeVisible();

    await expect(page.getByLabel('Workspace name')).toHaveValue(TEAMS.default.name);
    await page.getByLabel('Workspace name').fill(`${TEAMS.default.name} by this tab`);
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(
      page.getByText('Someone else changed this. Reload to see their version.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.getByLabel('Workspace name')).toHaveValue(
      `${TEAMS.default.name} by the other tab`,
    );
  });

  test('keeps the last owner, showing why', async ({ page }) => {
    const { email, workspace } = await startWorkspace(page);
    await page.goto(`${workspace}/settings/members`);
    await expect(page).toHaveTitle('Members');
    await expect(page.getByRole('heading', { name: '1 member' })).toBeVisible();
    await expectNoA11yViolations(page);
    // The translation of the backend's LAST_OWNER code.
    const message = 'A workspace needs an owner. Make someone else an owner first.';

    // Your own role asks first, then shows the backend's refusal.
    const role = page.getByLabel(`Role of ${email}`);
    await role.selectOption('ADMIN');
    const dialog = page.getByRole('alertdialog');
    await expect(
      dialog.getByRole('heading', { name: 'Change your own role to Admin?' }),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Change my role' }).click();
    await expect(dialog.getByText(message)).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(role).toHaveValue('OWNER');
    await expect(role).toBeFocused();

    await page.getByRole('button', { name: 'Leave workspace' }).click();
    await expect(
      dialog.getByText(
        'No one else owns this workspace. Make another member an owner before you leave.',
      ),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Leave workspace' }).click();
    await expect(dialog.getByText(message)).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: '1 member' })).toBeVisible();
  });

  test('keeps Invite member clear of the description at 640 px', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    const { workspace } = await startWorkspace(page);
    await page.goto(`${workspace}/settings/members`);

    const invite = page.getByRole('button', { name: 'Invite member' });
    const description = page.getByText('Who works in this workspace', { exact: false });
    await expect(invite).toBeVisible();
    const button = await invite.boundingBox();
    const text = await description.boundingBox();
    // Side by side, the button whole: never squeezed over the text.
    expect(button && text && button.x >= text.x + text.width).toBe(true);
    expect(await invite.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  });

  test('creates an invitation link in the inviter language, then revokes it', async ({
    page,
    baseURL,
  }) => {
    const { workspace } = await startWorkspace(page);
    await page.goto(`${workspace}/settings/members`);
    await expect(page.getByText('No pending invitations.')).toBeVisible();

    await page.getByRole('button', { name: 'Invite member' }).click();
    const colleague = emailFor(PEOPLE.admin);
    await page.getByLabel('Email address').fill(colleague);
    await page.getByLabel('Role', { exact: true }).selectOption('MANAGER');
    await page.getByRole('button', { name: 'Create invitation link' }).click();
    const link = page.getByLabel('Invitation link', { exact: true });
    await expect(link).toHaveValue(new RegExp(`^${baseURL}/invite/[^/]+$`, 'u'));
    await expect(page.getByRole('button', { name: 'Copy link' })).toBeFocused();
    await expectNoA11yViolations(page);
    // The link is shown once: Escape doesn't close it, Done does.
    await page.keyboard.press('Escape');
    await expect(link).toBeVisible();
    await page.getByRole('button', { name: 'Done' }).click();

    const pending = page.getByRole('region', { name: 'Pending invitations' });
    await expect(pending.getByText(colleague)).toBeVisible();
    await pending.getByRole('button', { name: `Revoke the invitation for ${colleague}` }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Revoke' }).click();
    await expect(page.getByText('No pending invitations.')).toBeVisible();
    // The row and its button are gone: the list's heading takes the focus.
    await expect(page.getByRole('heading', { name: 'Pending invitations' })).toBeFocused();

    // In French, the link opens the French page.
    await page.goto(`${workspace.replace('/app/', '/fr/app/')}/settings/members`);
    await page.getByRole('button', { name: 'Inviter un membre' }).click();
    await page.getByLabel('Adresse e-mail').fill(emailFor(PEOPLE.manager));
    await page.getByRole('button', { name: "Créer le lien d'invitation" }).click();
    await expect(page.getByLabel("Lien d'invitation", { exact: true })).toHaveValue(
      new RegExp(`^${baseURL}/fr/invite/[^/]+$`, 'u'),
    );
  });

  test('adds, re-orders, renames and deletes stages, keeping Won and Lost last', async ({
    page,
  }) => {
    const { workspace } = await startWorkspace(page);
    await page.goto(`${workspace}/settings/pipeline`);
    await expect(page).toHaveTitle('Pipeline');
    const defaults = ['Qualification', 'Needs analysis', 'Proposal', 'Negotiation'];
    expect(await stageOrder(page)).toEqual([...defaults, 'Won', 'Lost']);
    await expectNoA11yViolations(page);

    await page.getByLabel('Stage name').fill('Demo');
    await page.getByLabel('Win probability (%)').fill('40');
    await page.getByRole('button', { name: 'Add stage' }).click();
    await expect
      .poll(async () => await stageOrder(page))
      .toEqual([...defaults, 'Demo', 'Won', 'Lost']);
    // The form is ready for the next stage.
    await expect(page.getByLabel('Stage name')).toHaveValue('');

    // With the buttons: focus stays on the moved stage's button.
    const up = page.getByRole('button', { name: 'Move Demo up' });
    await up.click();
    await expect(page.getByText('Order saved')).toBeVisible();
    await expect
      .poll(async () => await stageOrder(page))
      .toEqual([
        'Qualification',
        'Needs analysis',
        'Proposal',
        'Demo',
        'Negotiation',
        'Won',
        'Lost',
      ]);
    await expect(up).toBeFocused();

    // With the drag handle, from the keyboard.
    // Each key waits for the screen reader announcement of the step before it.
    await page.getByRole('button', { name: 'Drag Demo' }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByText('Picked up Demo.')).toBeAttached();
    // dnd-kit listens for the arrows from a timer it sets as the drag starts, which can come after
    // the announcement: one more timer runs after it.
    await page.evaluate(async () => {
      // oxlint-disable-next-line promise/avoid-new -- a browser timer has no promise form
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });
    await page.keyboard.press('ArrowUp');
    await expect(page.getByText('Demo is over Proposal.')).toBeAttached();
    await page.keyboard.press('Space');
    await expect(
      page.getByText('Demo dropped in place of Proposal. Saving the order.'),
    ).toBeAttached();
    await expect
      .poll(async () => await stageOrder(page))
      .toEqual([
        'Qualification',
        'Needs analysis',
        'Demo',
        'Proposal',
        'Negotiation',
        'Won',
        'Lost',
      ]);
    await page.reload();
    await expect(page.locator('[data-stage-name]').nth(2)).toHaveText('Demo');

    // Rename.
    await page.getByRole('button', { name: 'Edit Demo' }).click();
    const list = page.getByRole('list', { name: 'Pipeline stages' });
    await list.getByLabel('Stage name').fill('Demo booked');
    await list.getByLabel('Win probability (%)').fill('45');
    await list.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('button', { name: 'Edit Demo booked' })).toBeFocused();
    await expect(list.getByText('45%')).toBeVisible();

    // Won and Lost can't move or go.
    await expect(page.getByRole('button', { name: /^(Drag|Move|Delete) (Won|Lost)/u })).toHaveCount(
      0,
    );

    await page.getByRole('button', { name: 'Delete Demo booked' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete stage' }).click();
    await expect.poll(async () => await stageOrder(page)).toEqual([...defaults, 'Won', 'Lost']);
    await expect(page.getByRole('heading', { name: 'Stages' })).toBeFocused();
  });

  test('asks to reload a pipeline that changed in another tab', async ({ page }) => {
    const { workspace } = await startWorkspace(page);
    await page.goto(`${workspace}/settings/pipeline`);
    await expect(page.getByRole('button', { name: 'Move Proposal up' })).toBeVisible();
    const other = await page.context().newPage();
    await other.goto(`${workspace}/settings/pipeline`);
    await other.getByLabel('Stage name').fill('Demo');
    await other.getByRole('button', { name: 'Add stage' }).click();
    await expect(other.locator('[data-stage-name]', { hasText: 'Demo' })).toBeVisible();

    // This tab still lists the stages without Demo.
    await page.getByRole('button', { name: 'Move Proposal up' }).click();

    await expect(
      page.getByText('The pipeline changed. Reload to see the current stages.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.locator('[data-stage-name]', { hasText: 'Demo' })).toBeVisible();
  });

  test('asks to reload a source that changed in another tab', async ({ page }) => {
    const { workspace } = await startWorkspace(page);
    await page.goto(`${workspace}/settings/sources`);
    await expect(page.getByRole('button', { name: 'Archive Website' })).toBeVisible();
    const other = await page.context().newPage();
    await other.goto(`${workspace}/settings/sources`);
    await other.getByRole('button', { name: 'Rename Website' }).click();
    await other.getByRole('list', { name: 'Lead sources' }).getByLabel('Source name').fill('Web');
    await other.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(other.getByRole('button', { name: 'Archive Web', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Archive Website' }).click();

    const toast = page.getByRole('listitem').filter({
      hasText: 'Someone else changed this. Reload to see their version.',
    });
    await expect(toast).toBeVisible();
    await toast.getByRole('button', { name: 'Reload' }).click();
    await expect(page.getByRole('button', { name: 'Archive Web', exact: true })).toBeVisible();
  });

  test('adds, archives and deletes a lead source', async ({ page }) => {
    const { workspace } = await startWorkspace(page);
    await page.goto(`${workspace}/settings/sources`);
    await expect(page).toHaveTitle('Lead sources');
    await expectNoA11yViolations(page);

    await page.getByLabel('Source name').fill('Website');
    await page.getByRole('button', { name: 'Add source' }).click();
    await expect(page.getByText('Another source already has this name')).toBeVisible();

    await page.getByLabel('Source name').fill('Trade show');
    await page.getByRole('button', { name: 'Add source' }).click();
    const list = page.getByRole('list', { name: 'Lead sources' });
    await expect(list.getByText('Trade show')).toBeVisible();

    await page.getByRole('button', { name: 'Archive Trade show' }).click();
    await expect(page.getByRole('button', { name: 'Restore Trade show' })).toBeVisible();
    await expect(list.getByRole('listitem').filter({ hasText: 'Trade show' })).toContainText(
      'Archived',
    );

    await page.getByRole('button', { name: 'Delete Trade show' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete source' }).click();
    await expect(list.getByText('Trade show')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: /sources$/u })).toBeFocused();
  });

  test('changes your display name and password', async ({ page }) => {
    const { email } = await startWorkspace(page);
    const account = page.getByRole('button', { name: 'Your account' });
    await account.click();
    await page.getByRole('menuitem', { name: 'Your profile' }).click();
    await expect(page).toHaveURL(/\/settings\/profile$/u);
    await expect(page).toHaveTitle('Your profile');
    await expectNoA11yViolations(page);

    await page.getByLabel('Display name').fill(PEOPLE.invitee);
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    // The initials of PEOPLE.invitee.
    await expect(account).toHaveText('AL');
    // An edit after saving takes the confirmation away.
    await page.getByLabel('Display name').press('End');
    await page.getByLabel('Display name').press('Backspace');
    await expect(page.getByText('Saved', { exact: true })).toHaveCount(0);
    await page.getByLabel('Display name').fill(PEOPLE.invitee);

    const current = page.getByLabel('Current password');
    await current.fill('not-my-password');
    await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel('Confirm the new password').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Change password' }).click();
    await expect(page.getByText("This isn't your current password")).toBeVisible();
    await expect(current).toHaveAttribute('aria-invalid', 'true');

    await current.fill(PASSWORD);
    await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel('Confirm the new password').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Change password' }).click();
    const changed = page.getByText('Password changed. Other devices are signed out.');
    await expect(changed).toBeVisible();
    await current.fill('x');
    await expect(changed).toHaveCount(0);

    // This browser stays signed in with the new session.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Your profile' })).toBeVisible();

    await account.click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/$/u);
    await page.goto('/sign-in');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/app\/\d+$/u);
  });

  test('sends an action with an expired session to sign in, then back to the CRM', async ({
    page,
    baseURL,
  }) => {
    const { email, workspace } = await startWorkspace(page);
    await page.goto(`${workspace}/settings/workspace`);
    await expect(page.getByLabel('Workspace name')).toHaveValue(TEAMS.default.name);
    // The backend no longer accepts the access token.
    await page.context().addCookies([{ name: 'access_token', value: 'expired', url: baseURL }]);

    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page).toHaveURL(/\/sign-in\?expired=1$/u);

    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(workspace);
  });

  test('sends an action to sign in when another tab signed out', async ({ page }) => {
    const { workspace } = await startWorkspace(page);
    await page.goto(`${workspace}/settings/workspace`);
    const other = await page.context().newPage();
    await other.goto(`${workspace}/settings/workspace`);
    await expect(other.getByLabel('Workspace name')).toHaveValue(TEAMS.default.name);

    await page.getByRole('button', { name: 'Your account' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/$/u);

    // No session cookie at all now: the action itself must end on sign-in.
    await other.getByLabel('Workspace name').fill(TEAMS.renamed.name);
    await other.getByRole('button', { name: 'Save changes' }).click();
    await expect(other).toHaveURL(/\/sign-in\?expired=1$/u);
    await expect(other.getByText('Your session has ended. Sign in again.')).toBeVisible();
  });

  test('switches to dark and to Thai from the account menu', async ({ page }) => {
    const { workspace } = await startWorkspace(page);
    await page.goto(`${workspace}/settings/pipeline`);
    const account = page.getByRole('button', { name: 'Your account' });

    await account.click();
    await page.getByRole('menuitem', { name: 'Theme' }).click();
    await page.getByRole('menuitemradio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/u);
    // The browser's bar takes the lacquer ground too, though the OS is light.
    await expect.poll(async () => await barColours(page)).toStrictEqual(['#17151f', '#17151f']);
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/u);
    await expect.poll(async () => await barColours(page)).toStrictEqual(['#17151f', '#17151f']);

    await account.click();
    await page.getByRole('menuitem', { name: 'Language' }).click();
    await page.getByRole('menuitemradio', { name: 'ไทย' }).click();
    await expect(page).toHaveURL(/\/th\/app\/\d+\/settings\/pipeline$/u);
    await expect(page).toHaveTitle('ไปป์ไลน์');
    // A navigation in the app keeps it.
    expect(await barColours(page)).toStrictEqual(['#17151f', '#17151f']);
    await expect(
      page.getByRole('navigation', { name: 'เมนูพื้นที่ทำงาน' }).getByRole('link', { name: 'การตั้งค่า' }),
    ).toHaveAttribute('aria-current', 'page');
    await expectNoA11yViolations(page);
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('stacks a pending invitation with its whole email', async ({ page }) => {
      const { workspace } = await startWorkspace(page);
      await page.goto(`${workspace}/settings/members`);
      const email = 'a.very.long.colleague.name@subsidiary.example.com';
      await page.getByRole('button', { name: 'Invite member' }).click();
      await page.getByLabel('Email address').fill(email);
      await page.getByRole('button', { name: 'Create invitation link' }).click();
      await page.getByRole('button', { name: 'Done' }).click();

      const pending = page.getByRole('region', { name: 'Pending invitations' });
      const shown = pending.getByText(email);
      await expect(shown).toBeVisible();
      // Wrapped, not cut off with an ellipsis; the revoke button sits under it.
      expect(await shown.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
      const revoke = await pending.getByRole('button', { name: /^Revoke/u }).boundingBox();
      const text = await shown.boundingBox();
      expect(revoke && text && revoke.y >= text.y + text.height).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390,
      );
    });
  });

  test.describe('on a phone, in Thai', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('fits every settings page without sideways scrolling', async ({ page }) => {
      const { workspace } = await startWorkspace(page);
      const thai = workspace.replace('/app/', '/th/app/');

      await expectFits(page, `${thai}/settings/workspace`);
      await expectFits(page, `${thai}/settings/members`);
      await expectFits(page, `${thai}/settings/roles`);
      await expectFits(page, `${thai}/settings/pipeline`);
      await expectFits(page, `${thai}/settings/sources`);
      await expectFits(page, `${thai}/settings/audit`);
      await expectFits(page, `${thai}/settings/profile`);
    });
  });
});
