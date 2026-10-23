import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { PASSWORD, signIn } from '../helpers';
import { COMPANIES, CONTACTS, DEALS, MORE_COMPANIES, PEOPLE } from '../mockData';
import {
  addMember,
  apiCall,
  apiSend,
  changeStatus,
  createCompany,
  createContact,
  createLead,
  expectNoA11yViolations,
  expectNoSidewaysScroll,
  seed,
  seedWorkspace,
  waitForHydration,
} from './helpers';

// The contact and the lead, as their pages name them.
const BUYER = `${CONTACTS.buyer.firstName} ${CONTACTS.buyer.lastName}`;
const LEAD = `${CONTACTS.lead.firstName} ${CONTACTS.lead.lastName}`;

test.describe('Records', () => {
  test('creates a company and a contact, and logs a call that shows on both timelines', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    await signIn(page, { email: owner.email, password: PASSWORD });

    const brightwater = await createCompany(page, owner.path, { name: COMPANIES.brightwater.name });
    await expect(page).toHaveTitle(COMPANIES.brightwater.name);
    await expect(page.getByRole('main').getByText(/^C-\d{4}$/u)).toBeVisible();

    // The same name in lower case warns about the first, and links to it in a new tab.
    await page.goto(`${owner.path}/companies/new`);
    await waitForHydration(page.locator('form'));
    await page.getByLabel('Company name').fill(COMPANIES.brightwater.name.toLowerCase());
    await page.getByLabel('Website').focus();
    const lookAlike = page.getByRole('link', {
      name: `${COMPANIES.brightwater.name} (opens in a new tab)`,
    });
    await expect(lookAlike).toBeVisible();
    await expect(lookAlike).toHaveAttribute('href', `${owner.path}/companies/${brightwater}`);
    await expect(page.getByText('Saving stays possible.')).toBeVisible();
    await expectNoA11yViolations(page);

    const buyer = await createContact(page, owner.path, {
      firstName: CONTACTS.buyer.firstName,
      lastName: CONTACTS.buyer.lastName,
      company: COMPANIES.brightwater.name,
    });
    await expect(page.getByRole('link', { name: COMPANIES.brightwater.name })).toBeVisible();
    await page.goto(`${owner.path}/companies/${brightwater}`);
    await expect(page.getByRole('link', { name: BUYER })).toBeVisible();

    // A call logged on the buyer.
    await page.goto(`${owner.path}/contacts/${buyer}`);
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
    await page.goto(`${owner.path}/companies/${brightwater}`);
    await expect(page.getByText('Intro call')).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'Intro call' })).toContainText(
      `Logged by ${PEOPLE.owner}`,
    );
    await expectNoA11yViolations(page);
  });

  test('qualifies a lead and converts it into a contact and a deal, once even when double-clicked', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    await signIn(page, { email: owner.email, password: PASSWORD });
    await createCompany(page, owner.path, { name: COMPANIES.brightwater.name });
    await createLead(page, owner.path, {
      firstName: CONTACTS.lead.firstName,
      lastName: CONTACTS.lead.lastName,
      companyName: COMPANIES.brightwater.name,
    });
    await expect(page.getByRole('main').getByText(/^L-\d{4}$/u)).toBeVisible();

    // New, then Contacted, then Qualified: each from the status menu.
    await changeStatus(page, 'Contacted');
    await changeStatus(page, 'Qualified');

    await page.getByRole('button', { name: 'Convert lead' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: `Convert ${LEAD}` })).toBeVisible();
    // It links the company that exists rather than making a second one.
    await dialog.getByRole('radio', { name: 'Link an existing company' }).click();
    await dialog.getByRole('combobox', { name: 'Company' }).click();
    await page.getByRole('option', { name: COMPANIES.brightwater.name }).click();
    await dialog.getByLabel('Deal name').fill(DEALS.tablets);
    await dialog.getByLabel('Amount').fill('1250.00');
    await expect(dialog.getByLabel('Currency')).toHaveValue('EUR');
    await expectNoA11yViolations(page);

    await dialog.getByRole('button', { name: 'Convert', exact: true }).dblclick();
    await expect(dialog.getByRole('heading', { name: 'Lead converted' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: COMPANIES.brightwater.name })).toBeVisible();
    await expect(dialog.getByRole('link', { name: LEAD })).toBeVisible();
    await expect(dialog.getByRole('link', { name: DEALS.tablets })).toBeVisible();
    await dialog.getByRole('button', { name: 'Done' }).click();

    // The lead now reads as converted and links what it became.
    await expect(page.getByText('Converted: reached', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Convert lead' })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: LEAD })).toBeFocused();

    // One deal, of 1,250.00 euros, on the company that was there.
    await page.goto(`${owner.path}/deals?view=list`);
    await expect(page.getByRole('heading', { name: '1 deal' })).toBeVisible();
    await expect(page.getByRole('link', { name: DEALS.tablets })).toBeVisible();
    await expect(page.getByText('€1,250.00')).toBeVisible();
    await page.goto(`${owner.path}/companies`);
    await expect(page.getByRole('heading', { name: '1 company' })).toBeVisible();
  });

  test('adds a task due tomorrow to a deal, completes it from the task list, and finds it under completed', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const company = await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
    const deal = await seed(request, owner, 'deals', {
      name: DEALS.tablets,
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
    await expect(dialog.getByText(`On ${DEALS.tablets}.`)).toBeVisible();
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
    await expect(row).toContainText(DEALS.tablets);
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
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const mia = await addMember(request, owner, 'MANAGER', PEOPLE.manager);
    // 25 companies: the 24 of MORE_COMPANIES, A to Z (Retail for four, Mia's for two), and Zephyr
    // Couriers after them (Mia's).
    const retail = new Set([2, 6, 10, 14]);
    const seeded = MORE_COMPANIES.map(
      async (name, index) =>
        await seed(request, index === 4 || index === 5 ? mia : owner, 'companies', {
          name,
          industry: retail.has(index) ? 'Retail' : 'Services',
        }),
    );
    await Promise.all([
      ...seeded,
      seed(request, mia, 'companies', {
        name: COMPANIES.zephyr.name,
        industry: COMPANIES.zephyr.industry,
      }),
    ]);
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/companies`);
    await expect(page.getByRole('heading', { name: '25 companies' })).toBeVisible();
    const rows = page.getByRole('row');
    // The header row, then a page of 20.
    await expect(rows).toHaveCount(21);
    await expect(rows.nth(1)).toContainText(MORE_COMPANIES[0]);
    await expect(page.getByText('1–20 of 25')).toBeVisible();

    await page.getByRole('link', { name: 'Next' }).click();
    await expect(page).toHaveURL(/[?&]page=1(?:&|$)/u);
    await expect(page.getByText('21–25 of 25')).toBeVisible();
    await expect(rows).toHaveCount(6);
    await expect(rows.last()).toContainText(COMPANIES.zephyr.name);
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

    // Name, descending: Zephyr first, and back on page one.
    await page.getByRole('link', { name: 'Name', exact: true }).click();
    await expect(page).toHaveURL(/sort=NAME&direction=DESC/u);
    await expect(page.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    await expect(rows.nth(1)).toContainText(COMPANIES.zephyr.name);
    await expect(page.getByText('1–20 of 25')).toBeVisible();

    // Search narrows it and keeps the sort.
    await waitForHydration(page.getByRole('searchbox', { name: 'Search' }));
    await page.getByRole('searchbox', { name: 'Search' }).fill('zephyr');
    await expect(page.getByRole('heading', { name: '1 company' })).toBeVisible();
    await expect(rows).toHaveCount(2);
    await expect(page).toHaveURL(/q=zephyr/u);
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
    await page.getByRole('option', { name: PEOPLE.manager }).click();
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
    await expect(page.getByRole('row', { name: COMPANIES.zephyr.name })).toContainText(
      'Unassigned',
    );
    await expectNoA11yViolations(page);
  });

  test('renders the defaults for a hand-edited URL', async ({ page, request }) => {
    const owner = await seedWorkspace(request);
    await Promise.all(
      [MORE_COMPANIES[1], MORE_COMPANIES[0], MORE_COMPANIES[2]].map(
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
    await expect(page.getByRole('row').nth(1)).toContainText(MORE_COMPANIES[0]);
    await expect(page.getByText('1–3 of 3')).toBeVisible();
    await expect(page.getByLabel('Per page')).toHaveValue('20');
  });

  test('offers a reset, not an error page, when the backend refuses the search', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request);
    await seed(request, owner, 'companies', { name: MORE_COMPANIES[0] });
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
    const company = await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
    await signIn(page, { email: owner.email, password: PASSWORD });
    const edit = `${owner.path}/companies/${company.id}/edit`;
    await page.goto(edit);
    const other = await page.context().newPage();
    await other.goto(edit);

    // The other tab saves first; its fields show what was saved (the website with its scheme).
    await waitForHydration(other.locator('form'));
    await other.getByLabel('Company name').fill(`${COMPANIES.brightwater.name} Ltd`);
    await other.getByLabel('Website').fill(new URL(COMPANIES.brightwater.website).host);
    await other.getByRole('button', { name: 'Save changes' }).click();
    await expect(other.getByText('Saved', { exact: true })).toBeVisible();
    await expect(other.getByLabel('Website')).toHaveValue(COMPANIES.brightwater.website);

    await waitForHydration(page.locator('form'));
    await page.getByLabel('Company name').fill(`${COMPANIES.brightwater.name} GmbH`);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(
      page.getByText('Someone else changed this. Reload to see their version.'),
    ).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.getByLabel('Company name')).toHaveValue(`${COMPANIES.brightwater.name} Ltd`);

    // Nothing was overwritten: the company is the other tab's.
    await page.goto(`${owner.path}/companies/${company.id}`);
    await expect(
      page.getByRole('heading', { level: 1, name: `${COMPANIES.brightwater.name} Ltd` }),
    ).toBeVisible();
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
      const fields = { ...CONTACTS.lead, companyName: COMPANIES.brightwater.name };
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
          document
            .getAnimations()
            .every(
              (animation) =>
                animation.playState !== 'running' ||
                !(animation.timeline instanceof DocumentTimeline),
            ),
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
      // The fact itself: the History section below repeats it as a change.
      await expect(page.getByText('Budget gone', { exact: true })).toBeVisible();

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
