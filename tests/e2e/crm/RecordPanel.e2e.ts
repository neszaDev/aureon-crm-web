import { expect, test } from '@playwright/test';
import { PASSWORD, signIn } from '../helpers';
import { COMPANIES, CONTACTS, MORE_LEADS, PEOPLE } from '../mockData';
import { expectNoA11yViolations, seed, seedWorkspace, waitForHydration } from './helpers';

const AMARA = `${MORE_LEADS[0]?.firstName} ${MORE_LEADS[0]?.lastName}`;
const BRUNO = `${MORE_LEADS[1]?.firstName} ${MORE_LEADS[1]?.lastName}`;
const BUYER = `${CONTACTS.buyer.firstName} ${CONTACTS.buyer.lastName}`;

test.describe('Record panel', () => {
  test('opens a lead from its list, moves it and logs a call there, and closes back to its row', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const amara = await seed(request, owner, 'leads', { ...MORE_LEADS[0] });
    await seed(request, owner, 'leads', { ...MORE_LEADS[1] });
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/leads`);
    const row = page.getByRole('link', { name: AMARA });
    await waitForHydration(row);
    await row.click();

    // At the lead's own address, over the list, which stays where it was.
    await expect(page).toHaveURL(`${owner.path}/leads/${amara.id}`);
    const panel = page.getByRole('dialog', { name: AMARA });
    await expect(panel.getByRole('heading', { level: 1, name: AMARA })).toBeVisible();
    await expect(panel.getByRole('list', { name: 'Lead lifecycle' })).toBeVisible();
    await expect(page.locator('#crm-main')).toContainText(BRUNO);
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'light' });

    // Its pill moves it: the panel stays open, and the list behind it has the lead in Contacted.
    const pill = panel.getByRole('button', { name: 'Status: New' });
    await waitForHydration(pill);
    await pill.click();
    await page.getByRole('menuitem', { name: 'Contacted', exact: true }).click();
    await expect(page.getByText('Status changed to Contacted')).toBeVisible();
    await expect(panel.getByText('Contacted: current', { exact: true })).toBeAttached();
    await expect(page).toHaveURL(`${owner.path}/leads/${amara.id}`);
    const contacted = page
      .locator('#crm-main [data-slot=collapsible]')
      .filter({ has: page.locator('h3', { hasText: 'Contacted' }) });
    await expect(contacted).toContainText(AMARA);

    // While the record is one column, the header's "Log activity" opens the composer (from
    // 1024 px the activity's own button is in view instead); Escape there closes the composer only.
    const logButtons = panel.getByRole('button', { name: 'Log activity' });
    await expect(logButtons).toHaveCount(1);
    await page.setViewportSize({ width: 900, height: 720 });
    await expect(logButtons).toHaveCount(2);
    await logButtons.first().click();
    await expect(panel.getByLabel('Subject')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel.getByLabel('Subject')).toBeHidden();
    await expect(panel).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 720 });
    const activity = panel.getByRole('region', { name: /^Activity/u });
    await activity.getByRole('button', { name: 'Log activity' }).click();
    await panel.getByLabel('Subject').fill('Intro call');
    await activity.getByRole('button', { name: 'Log activity' }).click();
    await expect(page.getByText('Activity logged')).toBeVisible();
    await expect(activity.getByRole('listitem').filter({ hasText: 'Intro call' })).toBeVisible();

    // Escape closes it: the list's address again, the lead in its new section, its link focused.
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(page).toHaveURL(`${owner.path}/leads`);
    await expect(page.getByRole('link', { name: AMARA })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Status: Contacted 1 lead' })).toBeVisible();
  });

  test('renders the full page at its address, and opens a linked record in the panel over it', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const company = await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
    const buyer = await seed(request, owner, 'contacts', {
      ...CONTACTS.buyer,
      companyId: company.id,
    });
    await signIn(page, { email: owner.email, password: PASSWORD });

    // Loaded and reloaded, a record's address is its full page, with no panel.
    const companyPath = `${owner.path}/companies/${company.id}`;
    await page.goto(companyPath);
    const heading = page.getByRole('heading', { level: 1, name: COMPANIES.brightwater.name });
    await expect(heading).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.reload();
    await expect(heading).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Its contact opens in the panel over it; × goes back to it, to the contact's link.
    const link = page.getByRole('link', { name: BUYER });
    await waitForHydration(link);
    await link.click();
    const panel = page.getByRole('dialog', { name: BUYER });
    await expect(panel.getByRole('heading', { level: 1, name: BUYER })).toBeVisible();
    await expect(page).toHaveURL(`${owner.path}/contacts/${buyer.id}`);
    await panel.getByRole('button', { name: 'Close' }).click();
    await expect(panel).toHaveCount(0);
    await expect(page).toHaveURL(companyPath);
    await expect(link).toBeFocused();

    // From the panel, the full page is a link away.
    await link.click();
    await panel.getByRole('link', { name: 'Open as a full page' }).click();
    await expect(page).toHaveURL(`${owner.path}/contacts/${buyer.id}`);
    await expect(page.getByRole('heading', { level: 1, name: BUYER })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('opens a record from another in the panel, its name focused, and × goes back one at a time', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const company = await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
    const buyer = await seed(request, owner, 'contacts', {
      ...CONTACTS.buyer,
      companyId: company.id,
    });
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(`${owner.path}/companies`);
    const row = page.getByRole('link', { name: COMPANIES.brightwater.name });
    await waitForHydration(row);
    await row.click();
    const first = page.getByRole('dialog', { name: COMPANIES.brightwater.name });
    await expect(first.getByRole('heading', { level: 1 })).toBeFocused();

    // The company's contact: the link that had the focus went with the company, and the
    // contact's name has it.
    await first.getByRole('link', { name: BUYER }).click();
    await expect(page).toHaveURL(`${owner.path}/contacts/${buyer.id}`);
    const second = page.getByRole('dialog', { name: BUYER });
    await expect(second.getByRole('heading', { level: 1, name: BUYER })).toBeFocused();

    // × is back: to the company, then to the list, its row focused.
    await second.getByRole('button', { name: 'Close' }).click();
    await expect(page).toHaveURL(`${owner.path}/companies/${company.id}`);
    await expect(first.getByRole('heading', { level: 1 })).toBeVisible();
    await first.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(`${owner.path}/companies`);
    await expect(row).toBeFocused();
  });

  test('shows an edit made in the panel on the list behind it, and closes from the backdrop', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    await seed(request, owner, 'tasks', {
      title: 'Send the quote',
      dueAt: new Date(Date.now() + 3_600_000).toISOString(),
    });
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/tasks`);
    const link = page.getByRole('link', { name: 'Send the quote' });
    await waitForHydration(link);
    await link.click();
    const panel = page.getByRole('dialog', { name: 'Send the quote' });
    await panel.getByRole('button', { name: 'Edit' }).click();
    const edit = page.getByRole('dialog', { name: 'Edit task' });
    await edit.getByLabel('Title').fill('Send the signed quote');
    await edit.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Task saved')).toBeVisible();

    // The panel stays, renamed, and the list behind it has the new title.
    const renamed = page.getByRole('dialog', { name: 'Send the signed quote' });
    await expect(renamed.getByRole('heading', { level: 1 })).toHaveText('Send the signed quote');
    await expect(page.locator('#crm-main')).toContainText('Send the signed quote');

    // A click beside the panel closes it, back to the list and the task's link.
    await page.mouse.click(40, 400);
    await expect(renamed).toHaveCount(0);
    await expect(page).toHaveURL(`${owner.path}/tasks`);
    await expect(page.getByRole('link', { name: 'Send the signed quote' })).toBeFocused();
  });

  test('leaves an edit page opened from the panel for the full page, not the panel over the form', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const company = await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/companies`);
    const link = page.getByRole('link', { name: COMPANIES.brightwater.name });
    await waitForHydration(link);
    await link.click();
    const panel = page.getByRole('dialog', { name: COMPANIES.brightwater.name });
    await panel.getByRole('link', { name: 'Edit', exact: true }).click();
    await expect(page).toHaveURL(`${owner.path}/companies/${company.id}/edit`);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await waitForHydration(page.locator('form'));
    await page.getByRole('link', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(`${owner.path}/companies/${company.id}`);
    await expect(
      page.getByRole('heading', { level: 1, name: COMPANIES.brightwater.name }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('form')).toHaveCount(0);
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('fits the panel to the screen and closes it from its ×', async ({ page, request }) => {
      const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
      const company = await seed(request, owner, 'companies', {
        name: COMPANIES.brightwater.name,
      });
      await seed(request, owner, 'contacts', { ...CONTACTS.buyer, companyId: company.id });
      await signIn(page, { email: owner.email, password: PASSWORD });

      await page.goto(`${owner.path}/companies`);
      const link = page.getByRole('link', { name: COMPANIES.brightwater.name });
      await waitForHydration(link);
      await link.click();
      const panel = page.getByRole('dialog', { name: COMPANIES.brightwater.name });
      await expect(panel.getByRole('link', { name: BUYER })).toBeVisible();
      const box = await panel.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(390 * 0.92 + 1);
      // Nothing in it is wider than it: it never scrolls sideways.
      expect(
        await panel.evaluate((node) =>
          [...node.querySelectorAll('*')].every(
            (child) =>
              child.getBoundingClientRect().right <= node.getBoundingClientRect().right + 1,
          ),
        ),
      ).toBe(true);

      await panel.getByRole('button', { name: 'Close' }).click();
      await expect(panel).toHaveCount(0);
      await expect(page).toHaveURL(`${owner.path}/companies`);
      await expect(link).toBeFocused();
    });
  });
});
