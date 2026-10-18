import { expect, test } from '@playwright/test';
import { PASSWORD, signIn } from '../helpers';
import {
  apiCall,
  expectNoA11yViolations,
  expectNoSidewaysScroll,
  seed,
  seedWorkspace,
  waitForHydration,
} from './helpers';

const HOUR = 60 * 60 * 1000;

test.describe('Top bar', () => {
  test('finds a record by what you type from ⌘K, and opens it on Enter', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: 'Olivia Owner' });
    const company = await seed(request, owner, 'companies', { name: 'Acme Trading' });
    await seed(request, owner, 'contacts', {
      firstName: 'Ada',
      lastName: 'Lovelace',
      companyId: company.id,
    });
    await seed(request, owner, 'leads', {
      firstName: 'Noa',
      lastName: 'Park',
      companyName: 'Acme',
    });
    const deal = await seed(request, owner, 'deals', {
      name: 'Acme seats',
      amount: '1250.00',
      companyId: company.id,
    });
    // Archived records are not searched.
    const archived = await seed(request, owner, 'companies', { name: 'Acme Archive' });
    await apiCall(
      request,
      owner,
      'POST',
      `/workspaces/${owner.workspaceId}/companies/${archived.id}/archive`,
      {
        version: archived.version,
      },
    );
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(owner.path);
    await waitForHydration(page.getByRole('button', { name: 'Search records' }));

    await page.keyboard.press('Control+K');
    const field = page.getByRole('combobox', { name: 'Search records' });
    await expect(field).toBeFocused();
    await field.fill('a');
    await expect(page.getByText('Type at least 2 characters.')).toBeVisible();

    await field.fill('acme');
    const palette = page.getByRole('dialog', { name: 'Search records' });
    await expect(palette.getByRole('group', { name: 'Companies' })).toBeVisible();
    await expect(palette.getByRole('group', { name: 'Leads' })).toBeVisible();
    await expect(palette.getByRole('group', { name: 'Deals' })).toBeVisible();
    await expect(palette.getByRole('option', { name: /^C-\d{4} Acme Trading/u })).toBeVisible();
    await expect(palette.getByRole('option', { name: /^D-\d{4} Acme seats/u })).toBeVisible();
    await expect(palette.getByRole('option', { name: /Acme Archive/u })).toHaveCount(0);
    await expectNoA11yViolations(page);

    await field.fill('zzzzzz');
    await expect(palette.getByText('No records match')).toBeVisible();

    // The company, first of the groups, is highlighted.
    await field.fill('acme tra');
    await expect(palette.getByRole('option', { name: /^C-\d{4} Acme Trading/u })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${owner.path}/companies/${company.id}$`, 'u'));
    await expect(page.getByRole('heading', { level: 1, name: 'Acme Trading' })).toBeVisible();
    await expect(palette).toHaveCount(0);

    // Anywhere in the CRM, and by clicking: the deal opens.
    await page.getByRole('button', { name: 'Search records' }).click();
    await page.getByRole('combobox', { name: 'Search records' }).fill('seats');
    await page.getByRole('option', { name: /Acme seats/u }).click();
    await expect(page).toHaveURL(new RegExp(`${owner.path}/deals/${deal.id}$`, 'u'));
  });

  test('counts the reminders, and the count follows a task completed from the popover or the list', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: 'Olivia Owner' });
    const now = Date.now();
    const task = async (title: string, dueAt: number) =>
      await seed(request, owner, 'tasks', {
        title,
        dueAt: new Date(dueAt).toISOString(),
        assigneeId: owner.userId,
      });
    await task('Send the proposal', now - 48 * HOUR);
    await task('Call Globex', now + 2 * HOUR);
    // Due in three days: not a reminder yet.
    await task('Plan the quarter', now + 72 * HOUR);
    await seed(request, owner, 'leads', {
      firstName: 'Noa',
      lastName: 'Park',
      companyName: 'Initech',
      followUpDate: new Date(now - 24 * HOUR).toISOString().slice(0, 10),
    });
    const remindersOf = async () =>
      await apiCall<Record<'overdueTasks' | 'dueSoonTasks' | 'followUpLeads', unknown[]>>(
        request,
        owner,
        'GET',
        `/workspaces/${owner.workspaceId}/reminders`,
      );
    const count = async () => {
      const reminders = await remindersOf();
      return (
        reminders.overdueTasks.length +
        reminders.dueSoonTasks.length +
        reminders.followUpLeads.length
      );
    };
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(owner.path);

    // The badge is what the API counts.
    expect(await count()).toBe(3);
    const bell = (n: number) => page.getByRole('button', { name: `Reminders: ${n}` });
    await expect(bell(3)).toBeVisible();
    await waitForHydration(bell(3));
    await bell(3).click();
    const popover = page.getByRole('dialog', { name: 'Reminders' });
    await expect(popover.getByRole('region', { name: /Overdue tasks/u })).toContainText(
      'Send the proposal',
    );
    await expect(popover.getByRole('region', { name: /Overdue tasks/u })).toContainText('Overdue');
    await expect(popover.getByRole('region', { name: /Due in the next 24 hours/u })).toContainText(
      'Call Globex',
    );
    await expect(popover.getByRole('region', { name: /Leads to follow up/u })).toContainText(
      'Noa Park',
    );
    await expect(popover).not.toContainText('Plan the quarter');
    await expect(popover.getByText('Reminders appear here in the app.')).toBeVisible();
    await expectNoA11yViolations(page);

    // Completed from the popover: the count drops without a reload.
    await popover.getByRole('checkbox', { name: 'Complete Send the proposal' }).click();
    await expect(bell(2)).toBeVisible();
    await expect(popover).not.toContainText('Send the proposal');
    expect(await count()).toBe(2);

    // On the next navigation it is still right, and it follows a task completed from the list.
    await popover.getByRole('link', { name: 'All tasks' }).click();
    await expect(page).toHaveURL(/\/tasks\?view=mine$/u);
    await expect(popover).toHaveCount(0);
    await expect(bell(2)).toBeVisible();
    await page.getByRole('checkbox', { name: 'Complete Call Globex' }).click();
    await expect(bell(1)).toBeVisible();
    await page.getByRole('link', { name: 'Companies' }).first().click();
    await expect(page).toHaveURL(/\/companies$/u);
    await expect(bell(1)).toBeVisible();
    expect(await count()).toBe(1);

    // Down to the lead: the popover has one group, and no badge-less claim.
    await bell(1).click();
    await expect(popover.getByRole('link', { name: 'Noa Park' })).toBeVisible();
    await expect(popover.getByRole('region')).toHaveCount(1);
  });

  test('says there is nothing to do, with no badge, when there are no reminders', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request);
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(owner.path);

    const bell = page.getByRole('button', { name: 'Reminders: 0' });
    await expect(bell).toBeVisible();
    await expect(bell).toHaveText('');
    await bell.click();
    await expect(page.getByText('Nothing needs your attention.')).toBeVisible();
    await expect(page.getByText('Reminders appear here in the app.')).toBeVisible();
  });

  test.describe('on a phone, in Thai', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('fits the bar with search as an icon, and wraps long Thai names in the palette and the bell', async ({
      page,
      request,
    }) => {
      const owner = await seedWorkspace(request, {
        workspace: 'บริษัทการค้าระหว่างประเทศและการขนส่งสินค้าครบวงจรแห่งประเทศไทยจำกัดมหาชน',
      });
      const name = 'บริษัทการค้าระหว่างประเทศและการขนส่งสินค้าครบวงจรแห่งประเทศไทยจำกัดมหาชน';
      await seed(request, owner, 'companies', {
        name,
        website: `https://www.${'long-domain-name.'.repeat(4)}example.com`,
      });
      await seed(request, owner, 'tasks', {
        title: name,
        dueAt: new Date(Date.now() - 48 * HOUR).toISOString(),
        assigneeId: owner.userId,
      });
      await signIn(page, { email: owner.email, password: PASSWORD });
      const thai = owner.path.replace('/app/', '/th/app/');

      await expectNoSidewaysScroll(page, thai);
      // Below md, search is an icon: no visible words, the name is for assistive technology.
      const search = page.getByRole('button', { name: 'ค้นหาระเบียน' });
      await expect(search).toBeVisible();
      await expect(search).toHaveJSProperty('offsetWidth', 36);
      await waitForHydration(search);
      await search.click();
      await page.getByRole('combobox', { name: 'ค้นหาระเบียน' }).fill('บริษัท');
      await expect(page.getByRole('option', { name: /C-\d{4}/u })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await page.keyboard.press('Escape');

      await page.getByRole('button', { name: /^เตือนความจำ: 1/u }).click();
      await expect(page.getByRole('dialog', { name: 'เตือนความจำ' })).toContainText(name);
      const box = await page.getByRole('dialog', { name: 'เตือนความจำ' }).boundingBox();
      expect(box).not.toBeNull();
      expect((box?.x ?? -1) >= 0 && (box?.x ?? 0) + (box?.width ?? 0) <= 390).toBe(true);
    });
  });
});
