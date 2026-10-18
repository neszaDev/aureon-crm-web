import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { PASSWORD, signIn } from '../helpers';
import {
  addMember,
  apiCall,
  apiSend,
  createCompany,
  createContact,
  createLead,
  expectNoA11yViolations,
  expectNoSidewaysScroll,
  seed,
  seedWorkspace,
  waitForHydration,
} from './helpers';

/**
 * Moves the lead on the page to a status from its menu and waits for the page to show it.
 * @param page Playwright page, on a lead.
 * @param status The status's name.
 */
const changeStatus = async (page: Page, status: string) => {
  await page.getByRole('button', { name: 'Change status' }).click();
  await page.getByRole('menuitem', { name: status, exact: true }).click();
  await expect(page.getByText(`Status changed to ${status}`)).toBeVisible();
  await expect(page.getByText(`${status}: current`, { exact: true })).toBeVisible();
};

test.describe('Records', () => {
  test('creates a company and a contact, and logs a call that shows on both timelines', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: 'Olivia Owner' });
    await signIn(page, { email: owner.email, password: PASSWORD });

    const acme = await createCompany(page, owner.path, { name: 'Acme Trading' });
    await expect(page).toHaveTitle('Acme Trading');
    await expect(page.getByText(/^C-\d{4}$/u)).toBeVisible();

    // A second "acme trading" warns about the first, and links to it in a new tab.
    await page.goto(`${owner.path}/companies/new`);
    await waitForHydration(page.locator('form'));
    await page.getByLabel('Company name').fill('acme trading');
    await page.getByLabel('Website').focus();
    const lookAlike = page.getByRole('link', { name: 'Acme Trading (opens in a new tab)' });
    await expect(lookAlike).toBeVisible();
    await expect(lookAlike).toHaveAttribute('href', `${owner.path}/companies/${acme}`);
    await expect(page.getByText('Saving stays possible.')).toBeVisible();
    await expectNoA11yViolations(page);

    const ada = await createContact(page, owner.path, {
      firstName: 'Ada',
      lastName: 'Lovelace',
      company: 'Acme Trading',
    });
    await expect(page.getByRole('link', { name: 'Acme Trading' })).toBeVisible();
    await page.goto(`${owner.path}/companies/${acme}`);
    await expect(page.getByRole('link', { name: 'Ada Lovelace' })).toBeVisible();

    // A call logged on Ada.
    await page.goto(`${owner.path}/contacts/${ada}`);
    // The composer is behind a button, which opens it on the Subject.
    await expect(page.getByLabel('Subject')).toBeHidden();
    await waitForHydration(page.getByRole('button', { name: 'Log activity' }));
    await page.getByRole('button', { name: 'Log activity' }).click();
    await expect(page.getByLabel('Subject')).toBeFocused();
    // Another type first, so choosing Call is a real change.
    await page.getByRole('radio', { name: 'Email' }).click();
    const type = page.getByRole('radio', { name: 'Call' });
    await type.click();
    await expect(type).toBeChecked();
    await page.getByLabel('Subject').fill('Intro call');
    await page.getByRole('textbox', { name: 'Details' }).fill('Wants a quote for 40 seats.');
    await page.getByRole('button', { name: 'Log activity' }).click();
    await expect(page.getByText('Activity logged')).toBeVisible();
    const call = page.getByRole('listitem').filter({ hasText: 'Intro call' });
    await expect(call).toContainText('Call');
    // Logged, it closes again.
    await expect(page.getByLabel('Subject')).toBeHidden();

    // And again: it opens empty every time, not only the first.
    await page.getByRole('button', { name: 'Log activity' }).click();
    await expect(page.getByLabel('Subject')).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'Details' })).toHaveValue('');
    await page.getByLabel('Subject').fill('Follow-up call');
    await page.getByRole('button', { name: 'Log activity' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Follow-up call' })).toBeVisible();
    await expect(page.getByLabel('Subject')).toBeHidden();

    // The company's timeline holds its contacts' activities.
    await page.goto(`${owner.path}/companies/${acme}`);
    await expect(page.getByText('Intro call')).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'Intro call' })).toContainText(
      'Logged by Olivia Owner',
    );
    await expectNoA11yViolations(page);
  });

  test('qualifies a lead and converts it into a contact and a deal, once even when double-clicked', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: 'Olivia Owner' });
    await signIn(page, { email: owner.email, password: PASSWORD });
    await createCompany(page, owner.path, { name: 'Acme Trading' });
    await createLead(page, owner.path, {
      firstName: 'Grace',
      lastName: 'Hopper',
      companyName: 'Acme Trading',
    });
    await expect(page.getByText(/^L-\d{4}$/u)).toBeVisible();

    // New, then Contacted, then Qualified: each from the status menu.
    await changeStatus(page, 'Contacted');
    await changeStatus(page, 'Qualified');

    await page.getByRole('button', { name: 'Convert lead' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Convert Grace Hopper' })).toBeVisible();
    // It links the company that exists rather than making a second one.
    await dialog.getByRole('radio', { name: 'Link an existing company' }).click();
    await dialog.getByRole('combobox', { name: 'Company' }).click();
    await page.getByRole('option', { name: 'Acme Trading' }).click();
    await dialog.getByLabel('Deal name').fill('Acme seats');
    await dialog.getByLabel('Amount').fill('1250.00');
    await expect(dialog.getByLabel('Currency')).toHaveValue('EUR');
    await expectNoA11yViolations(page);

    await dialog.getByRole('button', { name: 'Convert', exact: true }).dblclick();
    await expect(dialog.getByRole('heading', { name: 'Lead converted' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Acme Trading' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Grace Hopper' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Acme seats' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Done' }).click();

    // The lead now reads as converted and links what it became.
    await expect(page.getByText('Converted: reached', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Convert lead' })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Grace Hopper' })).toBeFocused();

    // One deal, of 1,250.00 euros, on the company that was there.
    await page.goto(`${owner.path}/deals?view=list`);
    await expect(page.getByRole('heading', { name: '1 deal' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Acme seats' })).toBeVisible();
    await expect(page.getByText('€1,250.00')).toBeVisible();
    await page.goto(`${owner.path}/companies`);
    await expect(page.getByRole('heading', { name: '1 company' })).toBeVisible();
  });

  test('adds a task due tomorrow to a deal, completes it from the task list, and finds it under completed', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: 'Olivia Owner' });
    const company = await seed(request, owner, 'companies', { name: 'Acme Trading' });
    const deal = await seed(request, owner, 'deals', {
      name: 'Acme seats',
      amount: '1250.00',
      companyId: company.id,
    });
    await signIn(page, { email: owner.email, password: PASSWORD });

    // Tomorrow in the workspace's time zone, which is not the browser's.
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const inParis = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', ...options }).format(tomorrow);

    await page.goto(`${owner.path}/deals/${deal.id}`);
    await page.getByRole('button', { name: 'Add task' }).click();
    const dialog = page.getByRole('dialog', { name: 'New task' });
    await expect(dialog.getByText('On Acme seats.')).toBeVisible();
    await dialog.getByLabel('Title').fill('Send proposal');
    await dialog.getByRole('button', { name: 'Due Pick a date' }).click();
    const calendar = page.getByRole('dialog', { name: 'Due' });
    if (inParis({ day: 'numeric' }) === '1') {
      await calendar.getByRole('button', { name: /next month/iu }).click();
    }
    await calendar
      .locator(`[data-day="${inParis({ dateStyle: 'short' }).replace(/\/(\d\d)$/u, '/20$1')}"]`)
      .click();
    await dialog.getByRole('button', { name: 'Add task' }).click();
    await expect(page.getByText('Task added')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Send proposal' })).toBeVisible();

    // Mine: the open tasks assigned to the caller, with the due time in the workspace's zone.
    await page.goto(`${owner.path}/tasks`);
    const row = page.getByRole('row', { name: /Send proposal/u });
    await expect(row).toContainText(`${inParis({ dateStyle: 'medium' })}, 9:00 AM`);
    await expect(row).toContainText('Acme seats');
    await expectNoA11yViolations(page);

    await page.getByRole('checkbox', { name: 'Complete Send proposal' }).click();
    await expect(page.getByText('Nothing on your list')).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Task views' })
      .getByRole('link', { name: 'Completed' })
      .click();
    await expect(page.getByRole('heading', { name: '1 task' })).toBeVisible();
    await expect(page.getByRole('row', { name: /Send proposal/u })).toContainText('Completed');
  });

  test('searches, sorts, filters and pages 25 companies, and finds those of a member who left', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: 'Olivia Owner' });
    const mia = await addMember(request, owner, 'MANAGER', 'Mia Manager');
    // 25 companies: 24 "Seed Co" (Retail for four, Mia's for two) and "Zeta Logistics" (Mia's).
    const retail = new Set([3, 7, 11, 15]);
    const seeded = Array.from({ length: 24 }, (_, index) => index + 1).map(
      async (number) =>
        await seed(request, number === 5 || number === 6 ? mia : owner, 'companies', {
          name: `Seed Co ${String(number).padStart(2, '0')}`,
          industry: retail.has(number) ? 'Retail' : 'Services',
        }),
    );
    await Promise.all([
      ...seeded,
      seed(request, mia, 'companies', { name: 'Zeta Logistics', industry: 'Logistics' }),
    ]);
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/companies`);
    await expect(page.getByRole('heading', { name: '25 companies' })).toBeVisible();
    const rows = page.getByRole('row');
    // The header row, then a page of 20.
    await expect(rows).toHaveCount(21);
    await expect(rows.nth(1)).toContainText('Seed Co 01');
    await expect(page.getByText('1–20 of 25')).toBeVisible();

    await page.getByRole('link', { name: 'Next' }).click();
    await expect(page).toHaveURL(/[?&]page=1(?:&|$)/u);
    await expect(page.getByText('21–25 of 25')).toBeVisible();
    await expect(rows).toHaveCount(6);
    await expect(rows.last()).toContainText('Zeta Logistics');
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

    // Name, descending: Zeta first, and back on page one.
    await page.getByRole('link', { name: 'Name', exact: true }).click();
    await expect(page).toHaveURL(/sort=NAME&direction=DESC/u);
    await expect(page.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    await expect(rows.nth(1)).toContainText('Zeta Logistics');
    await expect(page.getByText('1–20 of 25')).toBeVisible();

    // Search narrows it and keeps the sort.
    await waitForHydration(page.getByRole('searchbox', { name: 'Search' }));
    await page.getByRole('searchbox', { name: 'Search' }).fill('zeta');
    await expect(page.getByRole('heading', { name: '1 company' })).toBeVisible();
    await expect(rows).toHaveCount(2);
    await expect(page).toHaveURL(/q=zeta/u);
    // NAME is the default sort, so the URL keeps only the direction.
    await expect(page).toHaveURL(/direction=DESC/u);
    await expect(page.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    await page.getByRole('searchbox', { name: 'Search' }).fill('nothing like this');
    await expect(page.getByText('Nothing matches', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Clear filters' }).click();
    await expect(page.getByRole('heading', { name: '25 companies' })).toBeVisible();

    // The industry filter takes a name.
    await page.getByRole('searchbox', { name: 'Industry' }).fill('Retail');
    await expect(page.getByRole('heading', { name: '4 companies' })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Industry' }).fill('');
    await expect(page.getByRole('heading', { name: '25 companies' })).toBeVisible();

    // Mia's three, then none once she has left, and the three show as unassigned.
    await page.getByRole('combobox', { name: 'Owner' }).click();
    await page.getByRole('option', { name: 'Mia Manager' }).click();
    await expect(page.getByRole('heading', { name: '3 companies' })).toBeVisible();
    await apiSend(
      request,
      owner,
      'DELETE',
      `/workspaces/${owner.workspaceId}/members/${mia.userId}`,
    );
    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Owner' })).toHaveText('Former member');
    await expect(page.getByText('Nothing matches', { exact: true })).toBeVisible();
    await page.getByRole('combobox', { name: 'Owner' }).click();
    await page.getByRole('option', { name: 'Unassigned' }).click();
    await expect(page.getByRole('heading', { name: '3 companies' })).toBeVisible();
    await expect(page.getByRole('row', { name: /Zeta Logistics/u })).toContainText('Unassigned');
    await expectNoA11yViolations(page);
  });

  test('renders the defaults for a hand-edited URL', async ({ page, request }) => {
    const owner = await seedWorkspace(request);
    await Promise.all(
      ['Bravo', 'Alpha', 'Charlie'].map(
        async (name) => await seed(request, owner, 'companies', { name }),
      ),
    );
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(
      `${owner.path}/companies?page=-1&size=1000&sort=DROP&direction=up&ownerId=abc&industry=`,
    );

    await expect(page.getByRole('heading', { name: '3 companies' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    // A to Z, the first page, 20 to a page.
    await expect(page.getByRole('row').nth(1)).toContainText('Alpha');
    await expect(page.getByText('1–3 of 3')).toBeVisible();
    await expect(page.getByLabel('Per page')).toHaveValue('20');
  });

  test('offers a reset, not an error page, when the backend refuses the search', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request);
    await seed(request, owner, 'companies', { name: 'Alpha' });
    await signIn(page, { email: owner.email, password: PASSWORD });

    // The API takes at most 200 characters of search.
    await page.goto(`${owner.path}/companies?q=${'a'.repeat(201)}`);

    await expect(
      page.getByRole('heading', { name: "These filters can't be used together" }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Companies' })).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByRole('link', { name: 'Reset the list' }).click();
    await expect(page).toHaveURL(`${owner.path}/companies`);
    await expect(page.getByRole('heading', { name: '1 company' })).toBeVisible();
  });

  test('shows the reload message when a second tab saved the company first', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request);
    const acme = await seed(request, owner, 'companies', { name: 'Acme Trading' });
    await signIn(page, { email: owner.email, password: PASSWORD });
    const edit = `${owner.path}/companies/${acme.id}/edit`;
    await page.goto(edit);
    const other = await page.context().newPage();
    await other.goto(edit);

    // The other tab saves first; its fields show what was saved (the website with its scheme).
    await waitForHydration(other.locator('form'));
    await other.getByLabel('Company name').fill('Acme Trading Ltd');
    await other.getByLabel('Website').fill('acme.example');
    await other.getByRole('button', { name: 'Save changes' }).click();
    await expect(other.getByText('Saved', { exact: true })).toBeVisible();
    await expect(other.getByLabel('Website')).toHaveValue('https://acme.example');

    await waitForHydration(page.locator('form'));
    await page.getByLabel('Company name').fill('Acme Trading GmbH');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(
      page.getByText('Someone else changed this. Reload to see their version.'),
    ).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.getByLabel('Company name')).toHaveValue('Acme Trading Ltd');

    // Nothing was overwritten: the company is the other tab's.
    await page.goto(`${owner.path}/companies/${acme.id}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Acme Trading Ltd' })).toBeVisible();
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 640 } });

    test('scrolls the Unqualify and Convert dialogs to their buttons', async ({
      page,
      request,
    }) => {
      const owner = await seedWorkspace(request);
      const status = async (id: number, version: number, body: Record<string, unknown>) =>
        await apiCall<{ version: number }>(
          request,
          owner,
          'POST',
          `/workspaces/${owner.workspaceId}/leads/${id}/status`,
          { version, ...body },
        );
      const fields = { firstName: 'Grace', lastName: 'Hopper', companyName: 'Acme Trading' };
      const unqualify = await seed(request, owner, 'leads', fields);
      const convert = await seed(request, owner, 'leads', fields);
      await status(convert.id, convert.version, { status: 'QUALIFIED' });
      await signIn(page, { email: owner.email, password: PASSWORD });

      /**
       * Opens a dialog that doesn't fit the screen and checks that it stays on it, scrolls, and
       * has its button within reach.
       * @param open Opens the dialog.
       * @param button Its submit button.
       */
      const expectReachable = async (open: () => Promise<void>, button: Locator) => {
        await open();
        const dialog = page.getByRole('dialog');
        const height = page.viewportSize()?.height ?? 0;
        // Measured once it has finished opening: it zooms in, so its box changes until then.
        await page.waitForFunction(() =>
          document.getAnimations().every((animation) => animation.playState !== 'running'),
        );
        const box = await dialog.boundingBox();
        expect(box && box.y >= 0 && box.y + box.height <= height).toBe(true);
        expect(await dialog.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
        // The footer sticks to the bottom, so the button is in reach before any scrolling.
        await expect(button).toBeInViewport({ ratio: 1 });
        await dialog.evaluate((node) => {
          node.scrollTo({ top: node.scrollHeight });
        });
        await expect(button).toBeInViewport({ ratio: 1 });
      };

      // A short phone, as with the keyboard open: even the reason's dialog scrolls.
      await page.setViewportSize({ width: 390, height: 300 });
      await page.goto(`${owner.path}/leads/${unqualify.id}`);
      await waitForHydration(page.getByRole('button', { name: 'Change status' }));
      await expectReachable(
        async () => {
          await page.getByRole('button', { name: 'Change status' }).click();
          await page.getByRole('menuitem', { name: 'Unqualified' }).click();
        },
        page.getByRole('button', { name: 'Mark as unqualified' }),
      );
      await page.getByLabel('Reason').fill('Budget gone');
      await page.getByRole('button', { name: 'Mark as unqualified' }).click();
      await expect(page.getByText('Lead marked as unqualified')).toBeVisible();
      await expect(page.getByText('Budget gone')).toBeVisible();

      await page.setViewportSize({ width: 390, height: 640 });
      await page.goto(`${owner.path}/leads/${convert.id}`);
      await waitForHydration(page.getByRole('button', { name: 'Convert lead' }));
      await expectReachable(
        async () => {
          await page.getByRole('button', { name: 'Convert lead' }).click();
        },
        page.getByRole('button', { name: 'Convert', exact: true }),
      );
      await page.getByLabel('Amount').fill('500');
      await page.getByRole('button', { name: 'Convert', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Lead converted' })).toBeVisible();
    });
  });

  test.describe('on a phone, in Thai', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('fits the company, contact, lead and deal pages, with long names', async ({
      page,
      request,
    }) => {
      const owner = await seedWorkspace(request);
      // Thai is written without spaces: the browser finds the breaks. The email and the web
      // address have none at all.
      const company = 'บริษัทการค้าระหว่างประเทศและการขนส่งสินค้าครบวงจรแห่งประเทศไทยจำกัดมหาชน';
      const person = { firstName: 'สมชายสมหญิงสมศักดิ์', lastName: 'เจริญรุ่งเรืองวัฒนาพานิช' };
      const email = 'a.very.long.name.indeed@subsidiary.of.a.company.example.com';
      const { id: companyId } = await seed(request, owner, 'companies', {
        name: company,
        website: `https://www.${'long-domain-name.'.repeat(4)}example.com/with/a/path`,
        industry: 'การขนส่งและโลจิสติกส์ระหว่างประเทศ',
        notes: company.repeat(3),
      });
      const contact = await seed(request, owner, 'contacts', { ...person, email, companyId });
      const lead = await seed(request, owner, 'leads', { ...person, email, companyName: company });
      const deal = await seed(request, owner, 'deals', {
        name: company,
        amount: '1250.00',
        companyId,
      });
      await seed(request, owner, 'tasks', { title: company, dealId: deal.id, companyId });
      await seed(request, owner, 'activities', {
        type: 'NOTE',
        subject: company,
        body: company.repeat(3),
        dealId: deal.id,
      });
      await signIn(page, { email: owner.email, password: PASSWORD });
      const thai = owner.path.replace('/app/', '/th/app/');

      await expectNoSidewaysScroll(page, `${thai}/companies/${companyId}`);
      await expectNoSidewaysScroll(page, `${thai}/contacts/${contact.id}`);
      await expectNoSidewaysScroll(page, `${thai}/leads/${lead.id}`);
      await expectNoSidewaysScroll(page, `${thai}/deals/${deal.id}`);
      await expectNoSidewaysScroll(page, `${thai}/companies`);
      await expectNoSidewaysScroll(page, `${thai}/tasks`);
    });
  });
});
