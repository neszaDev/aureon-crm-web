import { readFile } from 'node:fs/promises';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { PASSWORD, signIn, signOut } from '../helpers';
import { COMPANIES, CONTACTS, DEALS, MORE_COMPANIES, PEOPLE, TEAMS } from '../mockData';
import type { Member } from './helpers';
import {
  addMember,
  apiCall,
  BACKEND_URL,
  changeStatus,
  column,
  COMPANY_COLUMNS,
  createCompany,
  createContact,
  createLead,
  createWorkspace,
  dragAndSave,
  expectDashboard,
  handleOf,
  money,
  monthLabel,
  periodLabel,
  registerUser,
  seed,
  seedWorkspace,
  stageOf,
  waitForHydration,
} from './helpers';

// What the pages are checked against of the API's answers.
type Period = { from: string; to: string };
type Totals = { amount: string; currency: string }[];
type Dashboard = {
  period: Period;
  counts: Record<'companies' | 'contacts' | 'openLeads' | 'openDeals' | 'overdueTasks', number>;
  won: { count: number; totals: Totals };
  lost: { count: number };
};
type WonLost = {
  period: Period;
  months: { month: string; won: number; lost: number; wonTotals: Totals }[];
};
type Funnel = { created: number; stages: { stage: { name: string }; reached: number }[] };
type Reminders = Record<'overdueTasks' | 'dueSoonTasks' | 'followUpLeads', unknown[]>;

// The board's four open stages and the Won and Lost strips fit a 1440 px screen beside the rail
// and the expanded sidebar (296 px), so every drop target is in view.
test.use({ viewport: { width: 1440, height: 900 } });

/**
 * The id at the end of a link to a record.
 * @param scope Where the link is.
 * @param name The link's name.
 * @returns The record's id.
 */
const linkedId = async (scope: Locator, name: string) => {
  const href = await scope.getByRole('link', { name, exact: true }).getAttribute('href');

  return Number(href?.split('/').at(-1));
};

const bell = (page: Page, count: number) =>
  page.getByRole('button', { name: `Reminders: ${count}` });

const rail = (page: Page) => page.getByRole('navigation', { name: 'Workspace navigation' });

const reportTab = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Reports' }).getByRole('link', { name });

const heading = (page: Page, name: string) => page.getByRole('heading', { name, exact: true });

// The contact and the lead, as their pages name them.
const BUYER = `${CONTACTS.buyer.firstName} ${CONTACTS.buyer.lastName}`;
const LEAD = `${CONTACTS.lead.firstName} ${CONTACTS.lead.lastName}`;

/**
 * Drags the fleet tablets deal on the board into a stage, then reloads: the server's board has it
 * there.
 * @param page Playwright page, on the board.
 * @param stage The stage's name.
 */
const moveOnBoard = async (page: Page, stage: string) => {
  await waitForHydration(page.getByRole('main'));
  await dragAndSave(page, handleOf(page, DEALS.tablets), column(page, stage));
  await page.reload();
  await expect(column(page, stage)).toContainText('1 deal');
};

/**
 * Opens a page of the journey's workspace as someone who isn't a member: it is not found, and
 * nothing of the workspace shows.
 * @param page Playwright page, signed in as the outsider.
 * @param url The page.
 */
const expectNotFound = async (page: Page, url: string) => {
  await page.goto(url);
  await expect(
    page.getByRole('heading', { name: "Workspace not found or you're not a member" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      new RegExp(
        [COMPANIES.brightwater.name, DEALS.tablets, LEAD, BUYER, TEAMS.default.name].join('|'),
        'u',
      ),
    ),
  ).toHaveCount(0);
};

/**
 * Opens one of the owner's records as a sales rep: it reads, with nothing to edit, archive or move.
 * @param page Playwright page, signed in as the rep.
 * @param url The record's page.
 * @param name The record's name.
 */
const expectReadOnly = async (page: Page, url: string, name: string) => {
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Archive', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Move', exact: true })).toHaveCount(0);
};

/**
 * Opens a list as a sales rep: it has no export.
 * @param page Playwright page, signed in as the rep.
 * @param url The list.
 * @param count Its heading, which counts its rows.
 */
const expectNoExport = async (page: Page, url: string, count: string) => {
  await page.goto(url);
  await expect(page.getByRole('heading', { name: count, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export CSV' })).toHaveCount(0);
};

// The brief's end-to-end list (CRM-BRIEF.md §8), in its order: one owner works through the UI;
// the other people and the bulk data come from the API helpers.
test('the CRM journey: from signing in to the reports, the permissions and the lists', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const user = await registerUser(request, PEOPLE.owner);
  let owner: Member = { ...user, workspaceId: 0, path: '' };
  let rep: Member = owner;
  const ids = { company: 0, contact: 0, lead: 0, convertedContact: 0, deal: 0, task: 0 };

  await test.step('1. Sign in', async () => {
    await signIn(page, { email: user.email, password: PASSWORD });
    await expect(page.getByRole('heading', { name: 'Create your first workspace' })).toBeVisible();
  });

  await test.step('2. Create a workspace', async () => {
    const url = await createWorkspace(page, TEAMS.default.name);
    const workspaceId = Number(new URL(url).pathname.split('/').at(-1));
    owner = { ...user, workspaceId, path: `/app/${workspaceId}` };
    await expectDashboard(page, TEAMS.default.name);
  });

  await test.step('3. Create a company and a contact at it', async () => {
    // From the empty list, whose header offers it.
    await page.goto(`${owner.path}/companies`);
    await expect(page.getByText('No companies yet')).toBeVisible();
    await page.getByRole('main').getByRole('link', { name: 'Add company' }).first().click();
    await expect(page).toHaveURL(`${owner.path}/companies/new`);
    ids.company = await createCompany(page, owner.path, {
      name: COMPANIES.brightwater.name,
      industry: COMPANIES.brightwater.industry,
    });
    ids.contact = await createContact(page, owner.path, {
      ...CONTACTS.buyer,
      company: COMPANIES.brightwater.name,
    });
    await expect(page.getByRole('link', { name: COMPANIES.brightwater.name })).toBeVisible();
    await page.goto(`${owner.path}/companies/${ids.company}`);
    await expect(page.getByRole('link', { name: BUYER })).toBeVisible();
  });

  await test.step('4. Create a lead, mark it contacted, qualify it', async () => {
    ids.lead = await createLead(page, owner.path, {
      ...CONTACTS.lead,
      companyName: COMPANIES.brightwater.name,
    });
    await expect(page.getByText('New: current', { exact: true })).toBeVisible();
    await changeStatus(page, 'Contacted');
    await changeStatus(page, 'Qualified');
  });

  await test.step('5. Convert it: the company linked, a contact and a 1,250.00 deal', async () => {
    await page.getByRole('button', { name: 'Convert lead' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: `Convert ${LEAD}` })).toBeVisible();
    await dialog.getByRole('radio', { name: 'Link an existing company' }).click();
    await dialog.getByRole('combobox', { name: 'Company' }).click();
    await page.getByRole('option', { name: COMPANIES.brightwater.name }).click();
    await dialog.getByLabel('Deal name').fill(DEALS.tablets);
    await dialog.getByLabel('Amount').fill('1250.00');
    await expect(dialog.getByLabel('Currency')).toHaveValue('EUR');
    await dialog.getByRole('button', { name: 'Convert', exact: true }).click();

    // The company that was there, a new contact and the deal.
    await expect(dialog.getByRole('heading', { name: 'Lead converted' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: COMPANIES.brightwater.name })).toHaveAttribute(
      'href',
      `${owner.path}/companies/${ids.company}`,
    );
    ids.convertedContact = await linkedId(dialog, LEAD);
    ids.deal = await linkedId(dialog, DEALS.tablets);
    expect(ids.convertedContact).not.toBe(ids.contact);
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText('Converted: reached', { exact: true })).toBeVisible();

    await page.goto(`${owner.path}/deals/${ids.deal}`);
    await expect(page.getByRole('heading', { level: 1, name: DEALS.tablets })).toBeVisible();
    await expect(page.getByText('€1,250.00').first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: COMPANIES.brightwater.name }).first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: LEAD }).first()).toBeVisible();
  });

  await test.step('6. Move the deal through every open stage on the board to Won', async () => {
    await page.goto(`${owner.path}/deals`);
    await expect(
      column(page, 'Qualification').getByRole('link', { name: DEALS.tablets }),
    ).toBeVisible();
    await moveOnBoard(page, 'Needs analysis');
    await moveOnBoard(page, 'Proposal');
    await moveOnBoard(page, 'Negotiation');
    await moveOnBoard(page, 'Won');
    // Won closes it: the card leaves the board, and the Won strip counts it.
    await expect(page.getByRole('link', { name: DEALS.tablets, exact: true })).toHaveCount(0);
    await expect(column(page, 'Won')).toContainText('€1,250.00');

    // Each step is in the history, newest first, and named on the status track.
    await page.goto(`${owner.path}/deals/${ids.deal}`);
    const steps = page.getByRole('region', { name: 'Stage history' }).getByRole('listitem');
    await expect(steps).toHaveCount(5);
    await Promise.all(
      [
        ['Negotiation', 'Won'],
        ['Proposal', 'Negotiation'],
        ['Needs analysis', 'Proposal'],
        ['Qualification', 'Needs analysis'],
        ['Created in Qualification'],
      ].map(async (names, index) => {
        await Promise.all(
          [...names, PEOPLE.owner].map(async (text) => {
            await expect(steps.nth(index)).toContainText(text);
          }),
        );
      }),
    );
    const row = page.getByRole('list', { name: 'Won: closed as won' });
    await Promise.all(
      ['Qualification', 'Needs analysis', 'Proposal', 'Negotiation'].map(async (stage) => {
        await expect(
          row.getByText(`${stage}: reached, moved here by ${PEOPLE.owner} on `),
        ).toBeVisible();
      }),
    );
    await expect(
      row.getByText(`Won: closed as won, moved here by ${PEOPLE.owner} on `),
    ).toBeVisible();
  });

  await test.step('7. Create a follow-up task on the deal and complete it', async () => {
    const remindersOf = async () => {
      const reminders = await apiCall<Reminders>(
        request,
        owner,
        'GET',
        `/workspaces/${owner.workspaceId}/reminders`,
      );

      return reminders.overdueTasks.length + reminders.dueSoonTasks.length;
    };
    await waitForHydration(page.getByRole('button', { name: 'Add task' }));
    await page.getByRole('button', { name: 'Add task' }).click();
    const dialog = page.getByRole('dialog', { name: 'New task' });
    await expect(dialog.getByText(`On ${DEALS.tablets}.`)).toBeVisible();
    await dialog.getByLabel('Title').fill('Send the contract');
    // A time without a day is today's in the workspace's zone: 9:00 there is overdue or due
    // within the next 24 hours, a reminder either way.
    await dialog.getByRole('textbox', { name: 'Due time' }).fill('09:00');
    await dialog.getByRole('button', { name: 'Add task' }).click();
    await expect(page.getByText('Task added')).toBeVisible();
    ids.task = await linkedId(page.getByRole('region', { name: /^Tasks/u }), 'Send the contract');

    // The next page counts it, as the API does.
    await page.reload();
    await expect(bell(page, 1)).toBeVisible();
    expect(await remindersOf()).toBe(1);

    const checkbox = page.getByRole('checkbox', { name: 'Complete Send the contract' });
    await waitForHydration(checkbox);
    await checkbox.click();
    // Ticked, it leaves the deal's open tasks.
    await expect(page.getByText('No open tasks.')).toBeVisible();

    // The bell has dropped on the next page, and the API agrees.
    await rail(page).getByRole('link', { name: 'Dashboard' }).click();
    await expectDashboard(page, TEAMS.default.name);
    await expect(bell(page, 0)).toBeVisible();
    expect(await remindersOf()).toBe(0);
  });

  await test.step('8. The dashboard and the reports show what the API counts', async () => {
    const api = await apiCall<Dashboard>(
      request,
      owner,
      'GET',
      `/workspaces/${owner.workspaceId}/dashboard`,
    );
    // What the journey made: one company, two contacts (the buyer, and the lead's), no open
    // lead or deal, nothing overdue, and the won deal in the default period.
    expect(api.counts).toStrictEqual({
      companies: 1,
      contacts: 2,
      openLeads: 0,
      openDeals: 0,
      overdueTasks: 0,
    });
    expect(api.won).toStrictEqual({ count: 1, totals: [{ amount: '1250.00', currency: 'EUR' }] });
    expect(api.lost.count).toBe(0);

    await page.reload();
    await expect(
      page.getByRole('button', { name: `Period: ${periodLabel(api.period)}` }),
    ).toBeVisible();
    const totals = page.getByRole('region', { name: 'Workspace totals' });
    await Promise.all(
      [
        `Companies ${api.counts.companies}`,
        `Contacts ${api.counts.contacts}`,
        `Open leads ${api.counts.openLeads}`,
        `Open deals ${api.counts.openDeals}`,
        `All overdue tasks ${api.counts.overdueTasks}`,
      ].map(async (name) => {
        await expect(totals.getByRole('link', { name })).toBeVisible();
      }),
    );
    const wonLost = page.getByRole('region', { name: 'Won and lost' });
    await expect(wonLost).toContainText('1 deal');
    await expect(wonLost).toContainText(money('1250.00', 'EUR'));
    await expect(wonLost).toContainText('0 deals');

    // Won and lost by month: every month the API sent, the won deal in one of them.
    const report = await apiCall<WonLost>(
      request,
      owner,
      'GET',
      `/workspaces/${owner.workspaceId}/reports/won-lost`,
    );
    expect(report.period).toStrictEqual(api.period);
    const months = report.months.filter((item) => item.won > 0);
    expect(months).toHaveLength(1);
    expect(months[0]?.wonTotals).toStrictEqual([{ amount: '1250.00', currency: 'EUR' }]);
    await rail(page).getByRole('link', { name: 'Reports' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Reports' })).toBeVisible();
    await reportTab(page, 'Won and lost').click();
    await expect(page).toHaveURL(`${owner.path}/reports?tab=won-lost`);
    await expect(
      page.getByRole('button', { name: `Period: ${periodLabel(report.period)}` }),
    ).toBeVisible();
    const panel = page.getByRole('region', { name: 'Won and lost by month' });
    await expect(panel.getByRole('row')).toHaveCount(report.months.length + 1);
    await Promise.all(
      report.months.map(async (item, index) => {
        const row = panel.getByRole('row').nth(index + 1);
        await expect(row.getByRole('rowheader')).toHaveText(monthLabel(item.month));
        await expect(row.getByRole('cell').nth(0)).toHaveText(String(item.won));
        await expect(row.getByRole('cell').nth(1)).toHaveText(String(item.lost));
        await Promise.all(
          item.wonTotals.map(async (total) => {
            await expect(row.getByRole('cell').nth(2)).toContainText(
              money(total.amount, total.currency),
            );
          }),
        );
      }),
    );

    // The funnel: the one deal created, and it reached every stage up to Won.
    const funnel = await apiCall<Funnel>(
      request,
      owner,
      'GET',
      `/workspaces/${owner.workspaceId}/reports/funnel`,
    );
    expect(funnel.created).toBe(1);
    expect(funnel.stages.find((step) => step.stage.name === 'Won')?.reached).toBe(1);
    await reportTab(page, 'Funnel').click();
    await expect(page.getByText('1 deal created in this period')).toBeVisible();
    const steps = page.getByRole('region', { name: 'Funnel' });
    await expect(steps.getByRole('row')).toHaveCount(funnel.stages.length + 1);
    await Promise.all(
      funnel.stages.map(async (step, index) => {
        const row = steps.getByRole('row').nth(index + 1);
        await expect(row.getByRole('rowheader')).toHaveText(step.stage.name);
        await expect(row.getByRole('cell')).toHaveText(`${step.reached} of ${funnel.created}`);
      }),
    );
    await expect(steps.getByRole('row', { name: /^Won/u }).getByRole('cell')).toHaveText('1 of 1');
  });

  await test.step('9. Nobody outside the workspace gets in, and a rep changes nothing of the owner', async () => {
    // A member of another workspace: every page of the journey is "not found", and the API
    // answers 404 to a read and to a change alike.
    const outsider = await seedWorkspace(request, {
      workspace: TEAMS.other.name,
      owner: PEOPLE.outsider,
    });
    await signOut(page);
    await signIn(page, { email: outsider.email, password: PASSWORD });
    await expectNotFound(page, owner.path);
    await expectNotFound(page, `${owner.path}/companies/${ids.company}`);
    await expectNotFound(page, `${owner.path}/contacts/${ids.contact}`);
    await expectNotFound(page, `${owner.path}/contacts/${ids.convertedContact}`);
    await expectNotFound(page, `${owner.path}/leads/${ids.lead}`);
    await expectNotFound(page, `${owner.path}/deals`);
    await expectNotFound(page, `${owner.path}/deals/${ids.deal}`);
    await expectNotFound(page, `${owner.path}/tasks/${ids.task}`);
    await expectNotFound(page, `${owner.path}/reports?tab=won-lost`);
    await expectNotFound(page, `${owner.path}/settings/audit`);
    const deal = `${BACKEND_URL}/api/v1/workspaces/${owner.workspaceId}/deals/${ids.deal}`;
    const read = await request.get(deal, { headers: outsider.headers });
    expect(read.status()).toBe(404);
    const archive = await request.post(`${deal}/archive`, {
      headers: outsider.headers,
      data: { version: 0 },
    });
    expect(archive.status()).toBe(404);

    // A sales rep here reads the owner's records, with no way to change or export them.
    rep = await addMember(request, owner, 'SALES_REP', PEOPLE.rep);
    const repDeal = await seed(request, rep, 'deals', { name: 'Riley deal', amount: '300.00' });
    const renewal = await seed(request, owner, 'deals', { name: DEALS.renewal, amount: '800.00' });
    await signOut(page);
    await signIn(page, { email: rep.email, password: PASSWORD });
    await expectReadOnly(
      page,
      `${owner.path}/companies/${ids.company}`,
      COMPANIES.brightwater.name,
    );
    await expectReadOnly(page, `${owner.path}/contacts/${ids.contact}`, BUYER);
    await expectReadOnly(page, `${owner.path}/deals/${ids.deal}`, DEALS.tablets);
    await expectNoExport(page, `${owner.path}/companies`, '1 company');
    await expectNoExport(page, `${owner.path}/deals?view=list`, '3 deals');
    // The export route refuses them too, in their language.
    const exported = await page.request.get(`/api/crm/${owner.workspaceId}/export/companies`);
    expect(exported.status()).toBe(403);
    expect(await exported.json()).toStrictEqual({ message: "Your role doesn't allow this." });
    // Nor the workspace's history: the page says so, and the settings don't offer it.
    await page.goto(`${owner.path}/settings/audit`);
    await expect(
      page.getByRole('heading', { level: 1, name: "You don't have access to this" }),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Settings' }).getByRole('link', { name: 'Audit' }),
    ).toHaveCount(0);

    // On the board only their own card has a handle and a menu.
    await page.goto(`${owner.path}/deals`);
    await expect(page.getByRole('link', { name: DEALS.renewal })).toBeVisible();
    await waitForHydration(page.getByRole('main'));
    await expect(handleOf(page, 'Riley deal')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Drag D-\d+ /u })).toHaveCount(1);
    await expect(page.getByRole('button', { name: /^Actions for /u })).toHaveCount(1);

    // A forged move: the rep drags their own card, and the request names the owner's deal, open
    // in the same stage at the same version as theirs: only the permission check can refuse it.
    expect(renewal.version).toBe(repDeal.version);
    const named: number[] = [];
    await page.route(/\/deals$/u, async (route) => {
      const sent = route.request();
      const body = sent.postData();
      if (sent.method() !== 'POST' || !sent.headers()['next-action'] || !body) {
        await route.continue();
        return;
      }
      const [workspaceId, dealId, input]: [number, number, unknown] = JSON.parse(body);
      named.push(dealId);
      await route.continue({ postData: JSON.stringify([workspaceId, renewal.id, input]) });
    });
    await dragAndSave(page, handleOf(page, 'Riley deal'), column(page, 'Needs analysis'));
    await expect(page.getByText("Your role doesn't allow this.")).toBeVisible();
    expect(named).toStrictEqual([repDeal.id]);
    await expect(
      column(page, 'Qualification').getByRole('link', { name: 'Riley deal' }),
    ).toBeVisible();
    await page.unroute(/\/deals$/u);
    // Nothing moved on the server.
    expect(await stageOf(request, owner, renewal.id)).toBe('Qualification');
    expect(await stageOf(request, owner, repDeal.id)).toBe('Qualification');
  });

  await test.step('10. Search, sort, filter and page API-seeded companies, and export them', async () => {
    // 24 more, A to Z: the rep's 5th to 8th, with the 6th and the 20th archived.
    const seeded = await Promise.all(
      MORE_COMPANIES.map(
        async (name, index) =>
          await seed(request, index >= 4 && index <= 7 ? rep : owner, 'companies', { name }),
      ),
    );
    await Promise.all(
      [seeded[5], seeded[19]].map(async (company) => {
        await apiCall(
          request,
          owner,
          'POST',
          `/workspaces/${owner.workspaceId}/companies/${company?.id}/archive`,
          { version: company?.version },
        );
      }),
    );
    await signOut(page);
    await signIn(page, { email: owner.email, password: PASSWORD });

    // Brightwater Logistics and the 22 active ones, A to Z, 20 to a page.
    await page.goto(`${owner.path}/companies`);
    const rows = page.getByRole('row');
    await expect(heading(page, '23 companies')).toBeVisible();
    await expect(rows).toHaveCount(21);
    await expect(rows.nth(1)).toContainText(COMPANIES.brightwater.name);
    await expect(page.getByText('1–20 of 23')).toBeVisible();
    await page.getByRole('link', { name: 'Next' }).click();
    await expect(page.getByText('21–23 of 23')).toBeVisible();
    await expect(rows).toHaveCount(4);
    await expect(rows.last()).toContainText(MORE_COMPANIES[23]);

    // Name, descending, from the first page again.
    await page.getByRole('link', { name: 'Name', exact: true }).click();
    await expect(page).toHaveURL(/sort=NAME&direction=DESC/u);
    await expect(page.getByText('1–20 of 23')).toBeVisible();
    await expect(rows.nth(1)).toContainText(MORE_COMPANIES[23]);

    // A search narrows it and keeps the sort.
    const search = page.getByRole('searchbox', { name: 'Search' });
    await waitForHydration(search);
    // The 10th to the 19th are the ones with "Foods" in their name.
    await search.fill('foods');
    await expect(heading(page, '10 companies')).toBeVisible();
    await expect(rows.nth(1)).toContainText(MORE_COMPANIES[18]);
    await search.fill('');
    await expect(heading(page, '23 companies')).toBeVisible();

    // The rep's: three active, and one archived.
    await page.getByRole('button', { name: 'Owner', exact: true }).click();
    await page.getByRole('option', { name: PEOPLE.rep }).click();
    await expect(heading(page, '3 companies')).toBeVisible();
    const show = page.getByRole('navigation', { name: 'Show' });
    await show.getByRole('link', { name: 'Archived' }).click();
    await expect(heading(page, '1 archived company')).toBeVisible();
    await expect(rows.nth(1)).toContainText(MORE_COMPANIES[5]);
    await show.getByRole('link', { name: 'Active' }).click();
    await expect(heading(page, '3 companies')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`ownerId=${rep.userId}`, 'u'));

    // The export is that filtered list, byte for byte what the backend answers for it.
    const direct = await request.get(
      `${BACKEND_URL}/api/v1/workspaces/${owner.workspaceId}/companies/export?ownerId=${rep.userId}`,
      { headers: owner.headers },
    );
    expect(direct.status()).toBe(200);
    const exportButton = page.getByRole('button', { name: 'Export CSV' });
    await waitForHydration(exportButton);
    const downloading = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloading;
    expect(download.suggestedFilename()).toMatch(/^companies-\d{4}-\d{2}-\d{2}\.csv$/u);
    const file = await readFile(await download.path());
    expect(file.equals(await direct.body())).toBe(true);
    const [header, ...lines] = file.toString('utf-8').replace(/^﻿/u, '').trimEnd().split('\r\n');
    expect(header).toBe(COMPANY_COLUMNS);
    const cells = lines.map((line) => line.split(','));
    expect(cells.map((cell) => cell[1])).toStrictEqual([
      MORE_COMPANIES[4],
      MORE_COMPANIES[6],
      MORE_COMPANIES[7],
    ]);
    expect(cells.map((cell) => cell[7])).toStrictEqual([PEOPLE.rep, PEOPLE.rep, PEOPLE.rep]);
  });
});
