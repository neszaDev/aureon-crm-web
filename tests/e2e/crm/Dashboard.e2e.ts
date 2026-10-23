import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { PASSWORD, signIn } from '../helpers';
import { COMPANIES, CONTACTS, DEALS, PEOPLE, TASKS } from '../mockData';
import type { Member } from './helpers';
import {
  addMember,
  apiCall,
  apiSend,
  expectNoA11yViolations,
  expectNoSidewaysScroll,
  money,
  periodLabel,
  seed,
  seedWorkspace,
  stagesOf,
  waitForHydration,
} from './helpers';

// What the page is checked against of the API's answer.
type Totals = { amount: string; currency: string }[];
type Dashboard = {
  period: { from: string; to: string };
  counts: Record<'companies' | 'contacts' | 'openLeads' | 'openDeals' | 'overdueTasks', number>;
  openPipeline: { currency: string; amount: string; weightedAmount: string }[];
  won: { count: number; totals: Totals };
  lost: { count: number };
  byStage: { stage: { name: string }; count: number; totals: Totals }[];
};

const HOUR = 60 * 60 * 1000;

// The API's own answer, which the page must show as it is.
const dashboardOf = async (request: APIRequestContext, as: Member, query = '') =>
  await apiCall<Dashboard>(request, as, 'GET', `/workspaces/${as.workspaceId}/dashboard${query}`);

// The create actions that are links; the task one opens a dialog.
const LINKS = ['New company', 'New contact', 'New lead', 'New deal'];

const totals = (page: Page) => page.getByRole('region', { name: 'Workspace totals' });

// Insights › Dashboard: the workspace's pulse; the workspace's own path is the caller's home.
const dashboard = (path: string, query = '') => `${path}/dashboard${query}`;

/**
 * Through the API: moves a deal to the first stage of a kind, or the named open one.
 * @param request Playwright API client.
 * @param as A member who may move it.
 * @param deal The deal's id and version.
 * @param deal.id The deal's id.
 * @param deal.version The deal's version.
 * @param kind The kind of stage to move it to.
 */
const closeDeal = async (
  request: APIRequestContext,
  as: Member,
  deal: { id: number; version: number },
  kind: 'WON' | 'LOST',
) => {
  const stages = await stagesOf(request, as);
  const stage = stages.find((item) => item.kind === kind);
  await apiSend(request, as, 'POST', `/workspaces/${as.workspaceId}/deals/${deal.id}/move`, {
    stageId: stage?.id,
    version: deal.version,
    ...(kind === 'LOST' && { lostReason: 'Chose another supplier' }),
  });
};

test.describe('Home and dashboard', () => {
  test('starts an empty workspace with its first records', async ({ page, request }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(dashboard(owner.path));

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Start with your first records' }),
    ).toBeVisible();
    // No counts or panels: there is nothing to count yet.
    await expect(totals(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Period: /u })).toHaveCount(0);

    // Home too starts with them, in place of the caller's work.
    await page.goto(owner.path);
    await expect(
      page.getByRole('heading', { level: 1, name: /^Good (?:morning|afternoon|evening), /u }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Start with your first records' }),
    ).toBeVisible();
    await expect(page.getByRole('region', { name: 'My work' })).toHaveCount(0);
    await Promise.all(
      LINKS.map(async (name) => {
        await expect(page.getByRole('link', { name })).toBeVisible();
      }),
    );
    await expect(page.getByRole('button', { name: 'New task' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Invite your team' })).toHaveAttribute(
      'href',
      `${owner.path}/settings/members`,
    );
    await expectNoA11yViolations(page);

    await page.getByRole('link', { name: 'New company' }).click();
    await expect(page).toHaveURL(`${owner.path}/companies/new`);
  });

  test('shows the numbers and the period the API answered with', async ({ page, request }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const company = await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
    await seed(request, owner, 'contacts', {
      firstName: CONTACTS.buyer.firstName,
      lastName: CONTACTS.buyer.lastName,
    });
    // Its follow-up day passed yesterday: a lead to follow up, on Home.
    await seed(request, owner, 'leads', {
      firstName: 'Noa',
      lastName: 'Park',
      followUpDate: new Date(Date.now() - 24 * HOUR).toISOString().slice(0, 10),
    });
    await seed(request, owner, 'leads', { firstName: 'Kit', lastName: 'Lee' });
    await seed(request, owner, 'deals', {
      name: DEALS.tablets,
      amount: '1000.00',
      companyId: company.id,
    });
    await seed(request, owner, 'deals', { name: DEALS.rollout, amount: '2500.50' });
    await seed(request, owner, 'deals', {
      name: DEALS.usExpansion,
      amount: '400.00',
      currency: 'USD',
    });
    await closeDeal(
      request,
      owner,
      await seed(request, owner, 'deals', { name: DEALS.won, amount: '1234.56' }),
      'WON',
    );
    await closeDeal(
      request,
      owner,
      await seed(request, owner, 'deals', { name: DEALS.lost, amount: '99.00' }),
      'LOST',
    );
    await seed(request, owner, 'tasks', {
      title: 'Send the proposal',
      dueAt: new Date(Date.now() - 48 * HOUR).toISOString(),
      assigneeId: owner.userId,
    });
    await signIn(page, { email: owner.email, password: PASSWORD });
    const api = await dashboardOf(request, owner);

    await page.goto(dashboard(owner.path));

    // Every figure is the API's.
    const { counts } = api;
    expect(counts).toMatchObject({
      companies: 1,
      contacts: 1,
      openLeads: 2,
      openDeals: 3,
      overdueTasks: 1,
    });
    await expect(
      totals(page).getByRole('link', { name: `Companies ${counts.companies}` }),
    ).toBeVisible();
    await expect(
      totals(page).getByRole('link', { name: `Contacts ${counts.contacts}` }),
    ).toBeVisible();
    await expect(
      totals(page).getByRole('link', { name: `Open leads ${counts.openLeads}` }),
    ).toBeVisible();
    await expect(
      totals(page).getByRole('link', { name: `Open deals ${counts.openDeals}` }),
    ).toBeVisible();
    await expect(
      totals(page).getByRole('link', { name: `All overdue tasks ${counts.overdueTasks}` }),
    ).toBeVisible();
    // Each currency apart: the open pipeline and the won total, never added.
    expect(api.openPipeline.map((entry) => entry.currency).toSorted()).toStrictEqual([
      'EUR',
      'USD',
    ]);
    const pipeline = page.getByRole('region', { name: 'Open pipeline' });
    await Promise.all(
      api.openPipeline.flatMap((entry) => {
        const row = pipeline.getByRole('listitem').filter({
          has: page.getByRole('heading', { name: entry.currency, exact: true }),
        });

        return [
          expect(row).toContainText(money(entry.amount, entry.currency)),
          expect(row).toContainText(money(entry.weightedAmount, entry.currency)),
        ];
      }),
    );
    const wonLost = page.getByRole('region', { name: 'Won and lost' });
    await expect(wonLost).toContainText(`${api.won.count} deal`);
    await Promise.all(
      api.won.totals.map(async (total) => {
        await expect(wonLost).toContainText(money(total.amount, total.currency));
      }),
    );
    await expect(wonLost).toContainText(`${api.lost.count} deal`);
    // The stages, in the API's order, each with the count it sent.
    const stages = page.getByRole('region', { name: 'Open deals by stage' });
    await Promise.all(
      api.byStage.flatMap((bucket) => {
        const row = stages.getByRole('row', { name: new RegExp(`^${bucket.stage.name}`, 'u') });

        return [
          expect(row).toContainText(String(bucket.count)),
          ...bucket.totals.map(async (total) => {
            await expect(row).toContainText(money(total.amount, total.currency));
          }),
        ];
      }),
    );
    // The period is the one the API answered with, though the URL named none.
    await expect(
      page.getByRole('button', { name: `Period: ${periodLabel(api.period)}` }),
    ).toBeVisible();
    await expect(page.getByRole('region', { name: 'Recent changes' })).toContainText(
      `${PEOPLE.owner} created`,
    );
    await expectNoA11yViolations(page);

    // What is the caller's is on Home: their deals, their overdue task and their lead to follow up.
    await page
      .getByRole('navigation', { name: 'Quick access' })
      .getByRole('link', { name: 'Home' })
      .click();
    await expect(page.getByRole('region', { name: 'My deals' })).toContainText(DEALS.tablets);
    const work = page.getByRole('region', { name: 'My work' });
    await expect(work).toContainText('Send the proposal');
    await expect(work.getByRole('link', { name: 'Noa Park' })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  // Not a date, a month 13, from after to, more than 366 days, a from in the future: the default
  // period and the dashboard, never an error page.
  for (const query of [
    '?from=2026-13-01&to=x',
    '?from=x&to=y',
    '?from=2026-10-18&to=2026-10-01',
    '?from=2020-01-01&to=2026-10-18',
    '?from=2999-01-01',
  ]) {
    test(`shows the default period for ${query}, not an error`, async ({ page, request }) => {
      const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
      await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
      await signIn(page, { email: owner.email, password: PASSWORD });
      const defaults = await dashboardOf(request, owner);

      await page.goto(dashboard(owner.path, query));

      await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Period: ${periodLabel(defaults.period)}` }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Something went wrong' })).toHaveCount(0);
    });
  }

  test('shows the asked period, as the API answered for it', async ({ page, request }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
    await signIn(page, { email: owner.email, password: PASSWORD });
    const asked = await dashboardOf(request, owner, '?from=2026-01-01&to=2026-01-31');
    expect(asked.period).toStrictEqual({ from: '2026-01-01', to: '2026-01-31' });

    // At the dashboard's own address, and at the workspace's, where it was before Home.
    await page.goto(`${owner.path}?from=2026-01-01&to=2026-01-31`);
    await expect(page).toHaveURL(dashboard(owner.path, '?from=2026-01-01&to=2026-01-31'));

    await expect(
      page.getByRole('button', { name: `Period: ${periodLabel(asked.period)}` }),
    ).toBeVisible();
    await expect(
      totals(page).getByRole('link', { name: `Companies ${asked.counts.companies}` }),
    ).toBeVisible();
  });

  test('changes the period from the picker: a preset, and a custom range', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
    await signIn(page, { email: owner.email, password: PASSWORD });
    const defaults = await dashboardOf(request, owner);
    await page.goto(dashboard(owner.path));
    const trigger = (period: { from: string; to: string }) =>
      page.getByRole('button', { name: `Period: ${periodLabel(period)}` });
    await expect(trigger(defaults.period)).toBeVisible();
    await waitForHydration(trigger(defaults.period));

    await trigger(defaults.period).click();
    await expect(page.getByRole('link', { name: 'Last 30 days' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expectNoA11yViolations(page);
    await page.getByRole('link', { name: 'Last 7 days' }).click();

    // The URL names the days, and the label is what the API answered for them.
    await expect(page).toHaveURL(/\/dashboard\?from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}$/u);
    const url = new URL(page.url());
    const asked = await dashboardOf(
      request,
      owner,
      `?from=${url.searchParams.get('from')}&to=${url.searchParams.get('to')}`,
    );
    await expect(trigger(asked.period)).toBeVisible();
    expect((Date.parse(asked.period.to) - Date.parse(asked.period.from)) / (24 * HOUR)).toBe(6);

    // A custom range: the first of the month to its fifth.
    await trigger(asked.period).click();
    await page.locator('#period-from').click();
    await page
      .getByRole('dialog', { name: 'From' })
      .getByRole('button', { name: /\b1st/u })
      .click();
    await page.locator('#period-to').click();
    await page.getByRole('dialog', { name: 'To' }).getByRole('button', { name: /\b5th/u }).click();
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page).toHaveURL(/\?from=\d{4}-\d{2}-01&to=\d{4}-\d{2}-05$/u);
    const custom = new URL(page.url());
    const range = {
      from: custom.searchParams.get('from') ?? '',
      to: custom.searchParams.get('to') ?? '',
    };
    const answered = await dashboardOf(request, owner, `?from=${range.from}&to=${range.to}`);
    expect(answered.period).toStrictEqual(range);
    await expect(trigger(range)).toBeVisible();
  });

  test('completes an overdue task from Home, and the counts follow', async ({ page, request }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
    const overdue = async (title: string) =>
      await seed(request, owner, 'tasks', {
        title,
        dueAt: new Date(Date.now() - 48 * HOUR).toISOString(),
        assigneeId: owner.userId,
      });
    await overdue('Send the proposal');
    await overdue(TASKS.call);
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(dashboard(owner.path));
    await expect(totals(page).getByRole('link', { name: 'All overdue tasks 2' })).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Quick access' })
      .getByRole('link', { name: 'Home' })
      .click();
    const work = page.getByRole('region', { name: 'My work' });
    await expect(work.getByRole('heading', { name: /^Due: Overdue/u })).toContainText('2 tasks');
    await expect(page.getByRole('button', { name: 'Inbox: 2' })).toBeVisible();
    const checkbox = page.getByRole('checkbox', { name: 'Complete Send the proposal' });
    await waitForHydration(checkbox);

    await checkbox.click();

    // The task leaves the list, the section and the inbox count one, the API agrees, and so does
    // the dashboard's line.
    await expect(page.getByRole('checkbox', { name: 'Complete Send the proposal' })).toHaveCount(0);
    await expect(work.getByRole('heading', { name: /^Due: Overdue/u })).toContainText('1 task');
    await expect(page.getByRole('button', { name: 'Inbox: 1' })).toBeVisible();
    const after = await dashboardOf(request, owner);
    expect(after.counts.overdueTasks).toBe(1);
    await page
      .getByRole('navigation', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'Dashboard' })
      .click();
    await expect(totals(page).getByRole('link', { name: 'All overdue tasks 1' })).toBeVisible();
    await page.getByRole('link', { name: 'Companies' }).first().click();
    await expect(page).toHaveURL(/\/companies$/u);
    await expect(page.getByRole('button', { name: 'Inbox: 1' })).toBeVisible();
  });

  test('shows a rep only their own deals and tasks, with the create actions', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    const riley = await addMember(request, owner, 'SALES_REP', PEOPLE.rep);
    await seed(request, owner, 'deals', { name: 'Olivia deal', amount: '900.00' });
    await seed(request, riley, 'deals', { name: 'Riley deal', amount: '300.00' });
    await seed(request, owner, 'tasks', {
      title: 'Olivia task',
      dueAt: new Date(Date.now() + 2 * HOUR).toISOString(),
      assigneeId: owner.userId,
    });
    await seed(request, riley, 'tasks', {
      title: 'Riley task',
      dueAt: new Date(Date.now() + 2 * HOUR).toISOString(),
      assigneeId: riley.userId,
    });
    await signIn(page, { email: riley.email, password: PASSWORD });
    await page.goto(riley.path);

    const mine = page.getByRole('region', { name: 'My deals' });
    await expect(mine).toContainText('Riley deal');
    await expect(mine).not.toContainText('Olivia deal');
    // The status track names Riley, who created and so entered the deal's first stage.
    const track = mine.getByRole('list', { name: 'Stage 1 of 4: Qualification' });
    await expect(track.getByText(`moved here by ${PEOPLE.rep} on `)).toBeVisible();
    const work = page.getByRole('region', { name: 'My work' });
    await expect(work).toContainText('Riley task');
    await expect(work).not.toContainText('Olivia task');
    await expectNoA11yViolations(page);
    // Everyone may create all five, from the rail's "+ New".
    const rail = page.getByRole('navigation', { name: 'Quick access' });
    await waitForHydration(rail.getByRole('button', { name: 'New', exact: true }));
    await rail.getByRole('button', { name: 'New', exact: true }).click();
    await expect(page.getByRole('menu', { name: 'New' }).getByRole('menuitem')).toHaveText([
      'Company',
      'Contact',
      'Lead',
      'Deal',
      'Task',
    ]);
    await page.keyboard.press('Escape');
    // The counts are the workspace's: two deals.
    await page.goto(dashboard(riley.path));
    await expect(totals(page).getByRole('link', { name: 'Open deals 2' })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('keeps its title whole beside the period chip at 1024 px', async ({ page, request }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    await seed(request, owner, 'companies', { name: COMPANIES.kestrel.name });
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(dashboard(owner.path));

    const title = page.getByRole('heading', { level: 1, name: 'Dashboard' });
    await expect(page.getByRole('button', { name: /^Period: /u })).toBeVisible();
    // One line: the chip wraps rather than squeeze the word apart.
    const { height, lineHeight } = await title.evaluate((h1) => ({
      height: h1.getBoundingClientRect().height,
      lineHeight: Number(getComputedStyle(h1).lineHeight.replace(/px$/u, '')),
    }));
    expect(height).toBeLessThanOrEqual(lineHeight + 1);
  });

  test("writes each open stage's name on one line beside its bar, a Thai one too", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    await apiSend(request, owner, 'POST', `/workspaces/${owner.workspaceId}/pipeline-stages`, {
      name: 'วิเคราะห์ความต้องการ',
      probability: 30,
    });
    await seed(request, owner, 'deals', { name: 'Renewal', amount: '100.00' });
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(dashboard(owner.path));

    // The chart's stage names, as drawn: a name the axis can't hold is broken into lines (one
    // tspan each), or runs past the chart's left edge.
    const names = page.locator(
      'section[aria-labelledby="stages-heading"] text.recharts-cartesian-axis-tick-value',
    );
    await expect(names).toHaveCount(5);
    const drawn = await names.evaluateAll((texts) =>
      texts.map((text) => ({
        name: text.textContent,
        lines: text.querySelectorAll('tspan').length,
        inside: text instanceof SVGGraphicsElement && text.getBBox().x >= 0,
      })),
    );
    expect(drawn).toStrictEqual(
      ['Qualification', 'Needs analysis', 'Proposal', 'Negotiation', 'วิเคราะห์ความต้องการ'].map(
        (name) => ({ name, lines: 1, inside: true }),
      ),
    );
  });

  test.describe('on a phone, in Thai', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('fits the width, with long Thai names wrapping', async ({ page, request }) => {
      const name = 'บริษัทการค้าระหว่างประเทศและการขนส่งสินค้าครบวงจรแห่งประเทศไทยจำกัดมหาชน';
      const owner = await seedWorkspace(request, { workspace: name, owner: PEOPLE.owner });
      const company = await seed(request, owner, 'companies', { name });
      await seed(request, owner, 'deals', {
        name,
        amount: '9999999999.99',
        currency: 'THB',
        companyId: company.id,
      });
      await seed(request, owner, 'tasks', {
        title: name,
        dueAt: new Date(Date.now() - 48 * HOUR).toISOString(),
        assigneeId: owner.userId,
      });
      await signIn(page, { email: owner.email, password: PASSWORD });

      const home = owner.path.replace('/app/', '/th/app/');
      await expectNoSidewaysScroll(page, home);
      await expect(page.getByRole('heading', { level: 1, name: /^สวัสดี/u })).toBeVisible();
      await expectNoA11yViolations(page);
      await expectNoSidewaysScroll(page, dashboard(home));
      await expect(page.getByRole('heading', { level: 1, name: 'แดชบอร์ด' })).toBeVisible();
      await expectNoA11yViolations(page);
    });
  });
});
