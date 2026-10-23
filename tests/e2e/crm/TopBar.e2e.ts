import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { PASSWORD, signIn } from '../helpers';
import { COMPANIES, CONTACTS, DEALS, PEOPLE, TASKS, TEAMS } from '../mockData';
import {
  apiCall,
  expectNoA11yViolations,
  expectNoSidewaysScroll,
  seed,
  seedWorkspace,
  waitForHydration,
} from './helpers';

const HOUR = 60 * 60 * 1000;

const sidebarWidth = async (page: Page) =>
  await page.locator('#crm-sidebar').evaluate((sidebar) => sidebar.getBoundingClientRect().width);

test.describe('Shell', () => {
  test('goes home, creates and climbs the location from the rail and the top bar, in both themes', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const company = await seed(request, owner, 'companies', { name: COMPANIES.kestrel.name });
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(`${owner.path}/companies/${company.id}`);

    // Where you are: the workspace, the section, the record by its number.
    const location = page.getByRole('navigation', { name: 'Location' });
    await expect(location.getByRole('link', { name: TEAMS.default.name })).toBeVisible();
    await expect(location.getByText(/^C-\d{4,}$/u)).toHaveAttribute('aria-current', 'page');
    const nav = page.getByRole('navigation', { name: 'Workspace navigation' });
    await expect(nav.getByRole('link', { name: 'Companies' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'light' });

    await location.getByRole('link', { name: 'Companies' }).click();
    await expect(page).toHaveURL(new RegExp(`${owner.path}/companies$`, 'u'));
    await expect(location.getByText('Companies')).toHaveAttribute('aria-current', 'page');

    // Each icon on the rail is named in a tooltip.
    const rail = page.getByRole('navigation', { name: 'Quick access' });
    const home = rail.getByRole('link', { name: 'Home' });
    await waitForHydration(home);
    await home.hover();
    await expect(page.getByRole('tooltip', { name: 'Home' })).toBeVisible();
    await home.click();
    await expect(page).toHaveURL(new RegExp(`${owner.path}$`, 'u'));
    await expect(home).toHaveAttribute('aria-current', 'page');

    // "+ New" offers the five kinds, each to its form.
    await rail.getByRole('button', { name: 'New', exact: true }).click();
    const menu = page.getByRole('menu', { name: 'New' });
    await expect(menu.getByRole('menuitem')).toHaveText([
      'Company',
      'Contact',
      'Lead',
      'Deal',
      'Task',
    ]);
    await menu.getByRole('menuitem', { name: 'Deal' }).click();
    await expect(page).toHaveURL(new RegExp(`${owner.path}/deals/new$`, 'u'));
    // The form opens in the record panel over the page (which hides the rest from assistive
    // technology); the location under it names the form.
    await expect(page.getByRole('dialog', { name: 'New deal' })).toBeVisible();
    await expect(
      page.locator('nav[aria-label="Location"]').getByText('New', { exact: true }),
    ).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('collapses the sidebar to its icon strip, keeps it on reload, and expands it again', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request);
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(owner.path);
    const collapse = page.getByRole('button', { name: 'Collapse sidebar' });
    const expand = page.getByRole('button', { name: 'Expand sidebar' });
    await waitForHydration(collapse);
    expect(await sidebarWidth(page)).toBe(240);

    await collapse.click();
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(async () => await sidebarWidth(page)).toBe(56);
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'light' });

    // The width it is drawn at from the first frame the sidebar is on screen: no jump.
    await page.addInitScript(() => {
      const widths: number[] = [];
      Reflect.set(window, 'sidebarWidths', widths);
      const look = () => {
        const sidebar = document.querySelector('#crm-sidebar');
        if (sidebar) {
          widths.push(sidebar.getBoundingClientRect().width);
        }
        if (widths.length < 3) {
          requestAnimationFrame(look);
        }
      };
      requestAnimationFrame(look);
    });
    await page.reload();
    await expect(expand).toBeVisible();
    expect(await page.evaluate((): unknown => Reflect.get(window, 'sidebarWidths'))).toStrictEqual([
      56, 56, 56,
    ]);

    // A strip icon is named in its tooltip and goes to its section.
    const contacts = page
      .getByRole('navigation', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'Contacts' });
    await waitForHydration(contacts);
    await contacts.hover();
    await expect(page.getByRole('tooltip', { name: 'Contacts' })).toBeVisible();
    await contacts.click();
    await expect(page).toHaveURL(new RegExp(`${owner.path}/contacts$`, 'u'));
    await expect(contacts).toHaveAttribute('aria-current', 'page');

    // Ctrl+\ expands it, outside a field.
    await page.getByRole('main').focus();
    await page.keyboard.press('Control+Backslash');
    await expect(collapse).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(async () => await sidebarWidth(page)).toBe(240);
    await page.reload();
    await expect(collapse).toBeVisible();
    expect(await sidebarWidth(page)).toBe(240);
  });
});

test.describe('Top bar', () => {
  test('finds a record by what you type from ⌘K, and opens it on Enter', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const company = await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
    await seed(request, owner, 'contacts', {
      firstName: CONTACTS.buyer.firstName,
      lastName: CONTACTS.buyer.lastName,
      companyId: company.id,
    });
    await seed(request, owner, 'leads', {
      firstName: 'Noa',
      lastName: 'Park',
      companyName: COMPANIES.brightwater.name,
    });
    const deal = await seed(request, owner, 'deals', {
      name: DEALS.tablets,
      amount: '1250.00',
      companyId: company.id,
    });
    // Archived records are not searched.
    const archived = await seed(request, owner, 'companies', {
      name: COMPANIES.brightwaterFreight.name,
    });
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
    const companyOption = new RegExp(`^C-\\d{4,} ${COMPANIES.brightwater.name}`, 'u');
    await expect(field).toBeFocused();
    await field.fill('a');
    await expect(page.getByText('Type at least 2 characters.')).toBeVisible();

    await field.fill('brightwater');
    const palette = page.getByRole('dialog', { name: 'Search records' });
    await expect(palette.getByRole('group', { name: 'Companies' })).toBeVisible();
    await expect(palette.getByRole('group', { name: 'Leads' })).toBeVisible();
    await expect(palette.getByRole('group', { name: 'Deals' })).toBeVisible();
    await expect(palette.getByRole('option', { name: companyOption })).toBeVisible();
    await expect(
      palette.getByRole('option', { name: new RegExp(`^D-\\d{4,} ${DEALS.tablets}`, 'u') }),
    ).toBeVisible();
    await expect(
      palette.getByRole('option', { name: COMPANIES.brightwaterFreight.name }),
    ).toHaveCount(0);
    await expectNoA11yViolations(page);

    await field.fill('zzzzzz');
    await expect(palette.getByText('No records match')).toBeVisible();

    // The company, first of the groups, is highlighted.
    await field.fill('brightwater log');
    await expect(palette.getByRole('option', { name: companyOption })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${owner.path}/companies/${company.id}$`, 'u'));
    // In the record panel, over the page it was found from.
    const panel = page.getByRole('dialog', { name: COMPANIES.brightwater.name });
    await expect(panel.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(palette).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(owner.path);
    await expect(panel).toHaveCount(0);

    // Anywhere in the CRM, and by clicking: the deal opens.
    await page.getByRole('button', { name: 'Search records' }).click();
    await page.getByRole('combobox', { name: 'Search records' }).fill('tablets');
    await page.getByRole('option', { name: DEALS.tablets }).click();
    await expect(page).toHaveURL(new RegExp(`${owner.path}/deals/${deal.id}$`, 'u'));
  });

  test('counts the reminders, and the count follows a task completed from the popover or the list', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const now = Date.now();
    const task = async (title: string, dueAt: number) =>
      await seed(request, owner, 'tasks', {
        title,
        dueAt: new Date(dueAt).toISOString(),
        assigneeId: owner.userId,
      });
    await task('Send the proposal', now - 48 * HOUR);
    await task(TASKS.call, now + 2 * HOUR);
    // Due in three days: not a reminder yet.
    await task('Plan the quarter', now + 72 * HOUR);
    await seed(request, owner, 'leads', {
      firstName: 'Noa',
      lastName: 'Park',
      companyName: COMPANIES.kestrel.name,
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
    const bell = (n: number) => page.getByRole('button', { name: `Inbox: ${n}` });
    await expect(bell(3)).toBeVisible();
    await waitForHydration(bell(3));
    await bell(3).click();
    const popover = page.getByRole('dialog', { name: 'Inbox' });
    // By when they are due: the overdue task and yesterday's follow-up, then the call within the
    // next 24 hours (today or tomorrow in Paris, by the time the test runs).
    const overdue = popover.getByRole('region', { name: /^Overdue/u });
    await expect(overdue).toContainText('Send the proposal');
    await expect(overdue.getByRole('link', { name: 'Noa Park' })).toBeVisible();
    // The group's pill, and each late item says so in words.
    await expect(overdue.getByText('Overdue', { exact: true })).toHaveCount(3);
    await expect(popover.getByRole('region', { name: /^(?:Today|Upcoming)/u })).toContainText(
      TASKS.call,
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
    // The old My tasks link: the list filtered to the caller ("Me").
    await expect(page).toHaveURL(/\/tasks\?assigneeId=\d+$/u);
    await expect(popover).toHaveCount(0);
    await expect(bell(2)).toBeVisible();
    await page.getByRole('checkbox', { name: `Complete ${TASKS.call}` }).click();
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

  test('picks up a reminder made meanwhile on the next navigation, without a reload', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const overdue = async (title: string) =>
      await seed(request, owner, 'tasks', {
        title,
        dueAt: new Date(Date.now() - 48 * HOUR).toISOString(),
        assigneeId: owner.userId,
      });
    await overdue('Send the proposal');
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(owner.path);
    await expect(page.getByRole('button', { name: 'Inbox: 1' })).toBeVisible();
    await waitForHydration(page.getByRole('button', { name: 'Inbox: 1' }));

    // Someone assigns a second task: the layout isn't rendered again by a click on a link.
    await overdue(TASKS.call);
    await page.getByRole('link', { name: 'Companies' }).first().click();
    await expect(page).toHaveURL(/\/companies$/u);

    await expect(page.getByRole('button', { name: 'Inbox: 2' })).toBeVisible();
    await page.getByRole('button', { name: 'Inbox: 2' }).click();
    await expect(page.getByRole('dialog', { name: 'Inbox' })).toContainText(TASKS.call);
  });

  test('says there is nothing to do, with no badge, when there are no reminders', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request);
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(owner.path);

    const bell = page.getByRole('button', { name: 'Inbox: 0' });
    await expect(bell).toBeVisible();
    await expect(bell).toHaveText('');
    await bell.click();
    await expect(page.getByText('Nothing needs your attention.')).toBeVisible();
    await expect(page.getByText('Reminders appear here in the app.')).toBeVisible();
  });

  test.describe('on a phone, in Thai', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('opens the rail and the sidebar as one drawer, which a navigation closes', async ({
      page,
      request,
    }) => {
      const owner = await seedWorkspace(request);
      await signIn(page, { email: owner.email, password: PASSWORD });
      await page.goto(owner.path.replace('/app/', '/th/app/'));
      const open = page.getByRole('button', { name: 'เปิดเมนู' });
      await waitForHydration(open);

      await open.click();
      const drawer = page.getByRole('dialog', { name: 'เมนูพื้นที่ทำงาน' });
      await expect(drawer.getByRole('link', { name: 'หน้าแรก' })).toBeVisible();
      await expect(drawer.getByRole('button', { name: 'สร้างใหม่', exact: true })).toBeVisible();
      await expect(drawer.getByRole('button', { name: 'บัญชีของคุณ' })).toBeVisible();
      await expect(drawer.getByRole('button', { name: /^สลับพื้นที่ทำงาน/u })).toBeVisible();
      await expectNoA11yViolations(page);

      await drawer.getByRole('link', { name: 'ดีล' }).click();
      await expect(page).toHaveURL(/\/th\/app\/\d+\/deals$/u);
      await expect(drawer).toHaveCount(0);
    });

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

      await page.getByRole('button', { name: /^กล่องข้อความ: 1/u }).click();
      await expect(page.getByRole('dialog', { name: 'กล่องข้อความ' })).toContainText(name);
      const box = await page.getByRole('dialog', { name: 'กล่องข้อความ' }).boundingBox();
      expect(box).not.toBeNull();
      expect((box?.x ?? -1) >= 0 && (box?.x ?? 0) + (box?.width ?? 0) <= 390).toBe(true);
    });
  });
});
