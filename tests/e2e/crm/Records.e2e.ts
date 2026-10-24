import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { PASSWORD, signIn } from '../helpers';
import { COMPANIES, CONTACTS, DEALS, MORE_COMPANIES, MORE_LEADS, PEOPLE } from '../mockData';
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
    await expect(page.getByRole('main').getByText(/^C-\d{4,}$/u)).toBeVisible();

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
    const activity = page.getByRole('region', { name: /^Activity/u });
    await waitForHydration(activity.getByRole('button', { name: 'Log activity' }));
    await activity.getByRole('button', { name: 'Log activity' }).click();
    await expect(page.getByLabel('Subject')).toBeFocused();
    // Another type first, so choosing Call is a real change.
    await page.getByRole('radio', { name: 'Email' }).click();
    const type = page.getByRole('radio', { name: 'Call' });
    await type.click();
    await expect(type).toBeChecked();
    await page.getByLabel('Subject').fill('Intro call');
    await page.getByRole('textbox', { name: 'Details' }).fill('Wants a quote for 40 seats.');
    await activity.getByRole('button', { name: 'Log activity' }).click();
    await expect(page.getByText('Activity logged')).toBeVisible();
    const call = page.getByRole('listitem').filter({ hasText: 'Intro call' });
    await expect(call).toContainText('Call');
    // Logged, it closes again.
    await expect(page.getByLabel('Subject')).toBeHidden();

    // And again: it opens empty every time, not only the first.
    await activity.getByRole('button', { name: 'Log activity' }).click();
    await expect(page.getByLabel('Subject')).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'Details' })).toHaveValue('');
    await page.getByLabel('Subject').fill('Follow-up call');
    await activity.getByRole('button', { name: 'Log activity' }).click();
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
    await expect(page.getByRole('main').getByText(/^L-\d{4,}$/u)).toBeVisible();

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
    await expect(page.getByRole('heading', { name: '1 deal', exact: true })).toBeVisible();
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
    // The Due chip opens its field.
    await dialog.getByRole('button', { name: 'Due', exact: true }).click();
    await page.getByRole('button', { name: 'Due Pick a date' }).click();
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

    // The tasks by when they are due: tomorrow is in the next 7 days, with the due time in the
    // workspace's zone.
    await page.goto(`${owner.path}/tasks`);
    const week = page.getByRole('button', { name: 'Due: Next 7 days 1 task' });
    await expect(week).toHaveAttribute('aria-expanded', 'true');
    const row = page.getByRole('row', { name: /Send proposal/u });
    await expect(row).toContainText(`${inParis({ dateStyle: 'medium' })}, 9:00 AM`);
    // The linked records on one line: the company, then the deal behind "+1", named in full.
    await expect(row.getByRole('link', { name: COMPANIES.brightwater.name })).toBeVisible();
    await expect(row.getByRole('link', { name: `1 more: ${DEALS.tablets}` })).toHaveText('+1');
    await expectNoA11yViolations(page);

    // Completed, it leaves the open sections for Completed, which starts folded.
    await page.getByRole('checkbox', { name: 'Complete Send proposal' }).click();
    await expect(week).toHaveCount(0);
    const completed = page.getByRole('button', { name: 'Status: Completed 1 task' });
    await expect(completed).toHaveAttribute('aria-expanded', 'false');
    await completed.click();
    await expect(page.getByRole('row', { name: /Send proposal/u })).toContainText('Completed');

    // Reopened from its pill, it goes back to its due section, and its new pill keeps the focus.
    const donePill = page.getByRole('button', { name: 'Status: Completed', exact: true });
    await waitForHydration(donePill);
    await donePill.click();
    await page.getByRole('menuitem', { name: 'Open' }).click();
    await expect(page.getByText('“Send proposal” reopened')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Status: Open', exact: true })).toBeFocused();
    // Completed again, for the Due chip below: its section is back, folded.
    await page.getByRole('checkbox', { name: 'Complete Send proposal' }).click();
    await expect(completed).toHaveAttribute('aria-expanded', 'false');
    await completed.click();
    await expect(page.getByRole('row', { name: /Send proposal/u })).toContainText('Completed');

    // The old Completed tab is the Due chip's.
    await waitForHydration(page.getByRole('button', { name: 'Due', exact: true }));
    await page.getByRole('button', { name: 'Due', exact: true }).click();
    await page.getByRole('option', { name: 'Completed' }).click();
    await expect(page).toHaveURL(/view=completed/u);
    await expect(page.getByRole('heading', { name: '1 task', exact: true })).toBeVisible();
    await expect(page.getByRole('row', { name: /Send proposal/u })).toContainText('Completed');
  });

  test('sorts tasks into due sections, filters them to the caller, and adds one inline', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const mia = await addMember(request, owner, 'MANAGER', PEOPLE.manager);
    const day = 24 * 60 * 60 * 1000;
    await Promise.all([
      seed(request, owner, 'tasks', {
        title: 'Chase the invoice',
        dueAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      }),
      seed(request, owner, 'tasks', {
        title: 'Plan the quarter',
        dueAt: new Date(Date.now() + 10 * day).toISOString(),
      }),
      seed(request, owner, 'tasks', { title: 'Tidy the pipeline' }),
      seed(request, mia, 'tasks', {
        title: 'Send the samples',
        dueAt: new Date(Date.now() + 3 * day).toISOString(),
      }),
    ]);
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/tasks`);
    await expect(page.getByRole('heading', { name: '4 tasks', exact: true })).toBeVisible();
    // Each in its section, under the pill that heads it; empty sections are left out, but for
    // Today, kept for its add row.
    await expect(page.getByRole('heading', { level: 3 })).toHaveText([
      /Overdue\s*1/u,
      /Today\s*0/u,
      /Next 7 days\s*1/u,
      /Later\s*1/u,
      /No due date\s*1/u,
    ]);
    await expect(page.getByRole('row', { name: /Chase the invoice/u })).toContainText('Overdue');
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'light' });

    // "Me": the caller's tasks only (the old My tasks tab).
    const me = page.getByRole('button', { name: 'Me', exact: true });
    await waitForHydration(me);
    await me.click();
    await expect(page).toHaveURL(new RegExp(`assigneeId=${owner.userId}`, 'u'));
    await expect(page.getByRole('heading', { name: '3 tasks', exact: true })).toBeVisible();
    await expect(page.getByRole('row', { name: /Send the samples/u })).toHaveCount(0);

    // Added from the No due date section: the caller's, without a due time.
    const add = page.getByRole('textbox', { name: 'Add task without a due date' });
    await add.fill('Call Mia back');
    await add.press('Enter');
    await expect(page.getByText('Call Mia back added')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Due: No due date 2 tasks' })).toBeVisible();
    await expect(page.getByRole('row', { name: /Call Mia back/u })).toContainText(PEOPLE.owner);
    await expect(add).toHaveValue('');

    // Added from Today: due at the day's last minute, in the workspace's zone.
    const today = page.getByRole('textbox', { name: 'Add task due today' });
    await today.fill('Confirm the delivery');
    await today.press('Enter');
    await expect(page.getByRole('button', { name: 'Due: Today 1 task' })).toBeVisible();
    await expect(page.getByRole('row', { name: /Confirm the delivery/u })).toContainText(
      '11:59 PM',
    );

    // An old My tasks link lands on "Me".
    await page.goto(`${owner.path}/tasks?view=mine`);
    await expect(page).toHaveURL(new RegExp(`/tasks\\?assigneeId=${owner.userId}$`, 'u'));
    await expect(page.getByRole('button', { name: 'Me', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // "+ New → Task" from the rail opens the task dialog at once.
    const rail = page.getByRole('navigation', { name: 'Quick access' });
    await waitForHydration(rail.getByRole('button', { name: 'New', exact: true }));
    await rail.getByRole('button', { name: 'New', exact: true }).click();
    await page.getByRole('menu', { name: 'New' }).getByRole('menuitem', { name: 'Task' }).click();
    await expect(page).toHaveURL(/\/tasks\?new=1$/u);
    await expect(page.getByRole('dialog', { name: 'New task' })).toBeVisible();
  });

  test('groups leads by status, moves one from its pill, keeps one a refusal names, and adds two inline', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const [amara, bruno] = await Promise.all(
      MORE_LEADS.slice(0, 3).map(async (lead) => await seed(request, owner, 'leads', lead)),
    );
    const leads = `/workspaces/${owner.workspaceId}/leads`;
    await apiSend(request, owner, 'POST', `${leads}/${bruno?.id}/status`, {
      status: 'CONTACTED',
      version: bruno?.version,
    });
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/leads`);
    await expect(page.getByRole('heading', { name: '3 leads', exact: true })).toBeVisible();
    // A section per status that has leads, headed by the status's own pill.
    await expect(page.getByRole('heading', { level: 3 })).toHaveText([
      /New\s*2/u,
      /Contacted\s*1/u,
    ]);
    const section = (status: string) =>
      page.locator('[data-slot=collapsible]').filter({
        has: page.getByRole('button', { name: new RegExp(`^Status: ${status} \\d`, 'u') }),
      });
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'light' });

    // Amara's pill moves her to Qualified once the server says so.
    const amaraRow = page.getByRole('row', { name: /Amara Diallo/u });
    const amaraPill = amaraRow.getByRole('button', { name: 'Status: New' });
    await waitForHydration(amaraPill);
    await amaraPill.click();
    await expect(page.getByRole('menuitem')).toHaveText(['Contacted', 'Qualified', 'Unqualified']);
    await page.getByRole('menuitem', { name: 'Qualified', exact: true }).click();
    await expect(page.getByText('Status changed to Qualified')).toBeVisible();
    const moved = section('Qualified').getByRole('row', { name: /Amara Diallo/u });
    await expect(moved).toBeVisible();
    // Her row is drawn anew in its section, and its pill keeps the focus.
    await expect(moved.getByRole('button', { name: 'Status: Qualified' })).toBeFocused();
    const saved = await apiCall<{ status: string }>(request, owner, 'GET', `${leads}/${amara?.id}`);
    expect(saved.status).toBe('QUALIFIED');

    // Someone else moves Bruno meanwhile: his pill keeps Contacted and says why.
    const current = await apiCall<{ version: number }>(
      request,
      owner,
      'GET',
      `${leads}/${bruno?.id}`,
    );
    await apiSend(request, owner, 'POST', `${leads}/${bruno?.id}/status`, {
      status: 'QUALIFIED',
      version: current.version,
    });
    const brunoRow = page.getByRole('row', { name: /Bruno Ferreira/u });
    await brunoRow.getByRole('button', { name: 'Status: Contacted' }).click();
    await page.getByRole('menuitem', { name: 'New', exact: true }).click();
    await expect(brunoRow.getByRole('alert')).toContainText('Someone else changed this');
    await expect(brunoRow.getByRole('button', { name: 'Reload' })).toBeVisible();
    await expect(brunoRow.getByRole('button', { name: 'Status: Contacted' })).toBeVisible();
    await expectNoA11yViolations(page);

    // Added inline with its company: in New at once, in Qualified through its move.
    const addNew = page.getByRole('textbox', { name: 'Add lead to New' });
    await addNew.fill('Dmitri Volkov');
    await page.getByRole('textbox', { name: 'Company' }).first().fill(COMPANIES.kestrel.name);
    await addNew.press('Enter');
    await expect(page.getByText('Dmitri Volkov added')).toBeVisible();
    await expect(section('New').getByRole('row', { name: /Dmitri Volkov/u })).toContainText(
      COMPANIES.kestrel.name,
    );
    const addQualified = page.getByRole('textbox', { name: 'Add lead to Qualified' });
    await addQualified.fill('Elena Garcia');
    await addQualified.press('Enter');
    await expect(section('Qualified').getByRole('row', { name: /Elena Garcia/u })).toBeVisible();
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

    // The industry chip takes a name, and shows it once on.
    await page.getByRole('button', { name: 'Industry', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Industry' }).fill('Retail');
    await expect(page.getByRole('heading', { name: '4 companies' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Industry: Retail' })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Industry' }).fill('');
    await expect(page.getByRole('heading', { name: '25 companies' })).toBeVisible();
    await page.keyboard.press('Escape');

    // Mia's three, then none once she has left, and the three show as unassigned.
    await page.getByRole('button', { name: 'Owner', exact: true }).click();
    await page.getByRole('option', { name: PEOPLE.manager }).click();
    await expect(page.getByRole('heading', { name: '3 companies' })).toBeVisible();
    await apiSend(
      request,
      owner,
      'DELETE',
      `/workspaces/${owner.workspaceId}/members/${mia.userId}`,
    );
    await page.reload();
    await expect(page.getByRole('button', { name: 'Owner: Former member' })).toBeVisible();
    await expect(page.getByText('Nothing matches', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Owner: Former member' }).click();
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
      `${owner.path}/companies?page=-1&size=1000&sort=DROP&direction=up&ownerId=abc&industry=&group=stage`,
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
    // Ungrouped: the menu says so.
    await expect(page.getByRole('button', { name: 'Group', exact: true })).toBeVisible();
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

  test('groups companies by owner, 50 rows a group with a link to all, and adds one inline', async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const mia = await addMember(request, owner, 'MANAGER', PEOPLE.manager);
    // 51 of the owner's: one more than a group shows.
    await Promise.all(
      Array.from(
        { length: 51 },
        async (_, index) =>
          await seed(request, owner, 'companies', {
            name: `${MORE_COMPANIES[index % MORE_COMPANIES.length]} ${Math.floor(index / MORE_COMPANIES.length) + 1}`,
          }),
      ),
    );
    await seed(request, mia, 'companies', { name: COMPANIES.kestrel.name });
    // Nobody's: saved without an owner.
    const zephyr = await seed(request, owner, 'companies', { name: COMPANIES.zephyr.name });
    await apiCall(
      request,
      owner,
      'PUT',
      `/workspaces/${owner.workspaceId}/companies/${zephyr.id}`,
      {
        name: COMPANIES.zephyr.name,
        version: zephyr.version,
      },
    );
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/companies?sort=UPDATED_AT`);
    await waitForHydration(page.getByRole('button', { name: 'Group', exact: true }));
    await page.getByRole('button', { name: 'Group', exact: true }).click();
    await page.getByRole('menuitemradio', { name: 'Owner' }).click();
    await expect(page).toHaveURL(/group=owner/u);
    // The sort holds within the groups.
    await expect(page).toHaveURL(/sort=UPDATED_AT/u);
    await expect(page.getByRole('heading', { name: '53 companies' })).toBeVisible();

    const group = (name: string) =>
      page
        .locator('[data-slot=collapsible]')
        .filter({ has: page.getByRole('heading', { level: 3, name }) });
    // The caller first: 50 of their 51, the API's total in the heading, and a link to all.
    const mine = page.getByRole('button', { name: `${PEOPLE.owner} 51 companies` });
    await expect(mine).toHaveAttribute('aria-expanded', 'true');
    await expect(group(PEOPLE.owner).getByRole('row')).toHaveCount(51);
    await expect(group(PEOPLE.manager).getByRole('row')).toHaveCount(2);
    await expect(
      group('Unassigned').getByRole('row', { name: COMPANIES.zephyr.name }),
    ).toBeVisible();
    // A new company is always someone's: Unassigned has no row to add one.
    await expect(group('Unassigned').getByRole('textbox')).toHaveCount(0);

    // A group folds away, and opens again.
    const mias = page.getByRole('button', { name: `${PEOPLE.manager} 1 company` });
    await mias.click();
    await expect(mias).toHaveAttribute('aria-expanded', 'false');
    await expect(group(PEOPLE.manager).getByRole('row')).toHaveCount(0);
    await mias.click();
    await expect(group(PEOPLE.manager).getByRole('row')).toHaveCount(2);

    // Added from Mia's group: hers, with the list refreshed (no row before the server says so).
    const add = page.getByRole('textbox', { name: `Add company owned by ${PEOPLE.manager}` });
    await add.press('Enter');
    await expect(page.getByText('Type a name, then press Enter.')).toBeVisible();
    await add.fill(COMPANIES.brightwater.name);
    await add.press('Enter');
    await expect(page.getByRole('button', { name: `${PEOPLE.manager} 2 companies` })).toBeVisible();
    await expect(
      group(PEOPLE.manager).getByRole('row', { name: COMPANIES.brightwater.name }),
    ).toContainText(PEOPLE.manager);
    await expect(add).toHaveValue('');
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectNoA11yViolations(page);
    await page.emulateMedia({ colorScheme: 'light' });

    // "View all" is the owner's whole list, ungrouped.
    await group(PEOPLE.owner).getByRole('link', { name: 'View all 51' }).click();
    await expect(page).toHaveURL(new RegExp(`ownerId=${owner.userId}`, 'u'));
    await expect(page).not.toHaveURL(/group=/u);
    await expect(page.getByRole('heading', { name: '51 companies' })).toBeVisible();
    await expect(page.getByText('1–20 of 51')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Me', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('archives a company from its row menu, and restores it from the archive', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request);
    await seed(request, owner, 'companies', { name: COMPANIES.fernhill.name });
    await seed(request, owner, 'companies', { name: COMPANIES.maple.name });
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/companies`);
    const menu = page.getByRole('button', { name: `Actions for ${COMPANIES.fernhill.name}` });
    await waitForHydration(menu);
    await menu.click();
    await page.getByRole('menuitem', { name: 'Archive' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Archive' }).click();
    await expect(page.getByText(`${COMPANIES.fernhill.name} archived`)).toBeVisible();
    await expect(page.getByRole('heading', { name: '1 company' })).toBeVisible();
    await expect(page.getByRole('row', { name: COMPANIES.fernhill.name })).toHaveCount(0);

    await page
      .getByRole('navigation', { name: 'Show' })
      .getByRole('link', { name: 'Archived' })
      .click();
    await expect(page.getByRole('heading', { name: '1 archived company' })).toBeVisible();
    // The archive adds nothing.
    await expect(page.getByRole('textbox', { name: 'Add company' })).toHaveCount(0);
    await page.getByRole('button', { name: `Actions for ${COMPANIES.fernhill.name}` }).click();
    await page.getByRole('menuitem', { name: 'Restore' }).click();
    await expect(page.getByText(`${COMPANIES.fernhill.name} restored`)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No archived companies' })).toBeVisible();
  });

  test('filters contacts by company, groups them by owner, and adds one there, filled in', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const mia = await addMember(request, owner, 'MANAGER', PEOPLE.manager);
    const brightwater = await seed(request, owner, 'companies', {
      name: COMPANIES.brightwater.name,
    });
    const kestrel = await seed(request, owner, 'companies', { name: COMPANIES.kestrel.name });
    await Promise.all([
      seed(request, owner, 'contacts', {
        ...CONTACTS.buyer,
        companyId: brightwater.id,
        tags: ['vip'],
      }),
      seed(request, mia, 'contacts', { ...MORE_LEADS[0], companyId: brightwater.id }),
      seed(request, owner, 'contacts', { ...MORE_LEADS[1], companyId: kestrel.id, tags: ['vip'] }),
    ]);
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/contacts`);
    await expect(page.getByRole('heading', { name: '3 contacts' })).toBeVisible();
    // The tag chip lists the workspace's tags.
    await waitForHydration(page.getByRole('button', { name: 'Tag', exact: true }));
    await page.getByRole('button', { name: 'Tag', exact: true }).click();
    await page.getByRole('option', { name: 'vip' }).click();
    await expect(page.getByRole('heading', { name: '2 contacts' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear the Tag filter' }).click();
    await expect(page.getByRole('heading', { name: '3 contacts' })).toBeVisible();

    // The company chip holds the record picker.
    await page.getByRole('button', { name: 'Company', exact: true }).click();
    await page.getByRole('combobox', { name: 'Company' }).click();
    await page.getByRole('option', { name: COMPANIES.brightwater.name }).click();
    await expect(page).toHaveURL(new RegExp(`companyId=${brightwater.id}`, 'u'));
    await expect(page.getByRole('heading', { name: '2 contacts' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: `Company: ${COMPANIES.brightwater.name}` }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Group', exact: true }).click();
    await page.getByRole('menuitemradio', { name: 'Owner' }).click();
    await expect(page.getByRole('button', { name: `${PEOPLE.owner} 1 contact` })).toBeVisible();
    await expect(page.getByRole('button', { name: `${PEOPLE.manager} 1 contact` })).toBeVisible();
    await expectNoA11yViolations(page);

    // Mia's group adds a contact of hers at the company the list is filtered by.
    await page.getByRole('link', { name: `Add contact owned by ${PEOPLE.manager}` }).click();
    await expect(page).toHaveURL(
      `${owner.path}/contacts/new?companyId=${brightwater.id}&ownerId=${mia.userId}`,
    );
    // The form opens in the panel over the list, its chips filled in.
    const form = page.getByRole('dialog', { name: 'New contact' });
    await expect(
      form.getByRole('button', { name: `Company: ${COMPANIES.brightwater.name}` }),
    ).toBeVisible();
    await expect(form.getByRole('button', { name: `Owner: ${PEOPLE.manager}` })).toBeVisible();
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 640 } });

    test('keeps the search and moves the filters into a sheet', async ({ page, request }) => {
      const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
      const mia = await addMember(request, owner, 'MANAGER', PEOPLE.manager);
      await seed(request, owner, 'companies', { name: COMPANIES.fernhill.name });
      await seed(request, mia, 'companies', { name: COMPANIES.maple.name });
      await signIn(page, { email: owner.email, password: PASSWORD });

      await page.goto(`${owner.path}/companies`);
      await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Group', exact: true })).toBeHidden();
      const filters = page.getByRole('button', { name: 'Filters', exact: true });
      await waitForHydration(filters);
      await filters.click();
      const sheet = page.getByRole('dialog', { name: 'Filters' });
      await expect(sheet.getByRole('button', { name: 'Owner', exact: true })).toBeVisible();
      await expectNoA11yViolations(page);

      await sheet.getByRole('button', { name: 'Me', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`ownerId=${owner.userId}`, 'u'));
      // The sheet stays for the next filter, and the button counts the one on.
      await expect(sheet.getByRole('button', { name: 'Me', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await sheet.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('heading', { name: '1 company' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Filters 1 filter on' })).toBeVisible();
      await expectNoSidewaysScroll(page, `${owner.path}/companies?group=owner`);
    });

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
      await waitForHydration(page.getByRole('button', { name: 'Status: New' }));
      await expectReachable(
        async () => {
          await page.getByRole('button', { name: 'Status: New' }).click();
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
