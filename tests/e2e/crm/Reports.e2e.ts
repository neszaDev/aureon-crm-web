import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { PASSWORD, signIn } from '../helpers';
import { COMPANIES, DEALS, MORE_LEADS, PEOPLE } from '../mockData';
import type { Member } from './helpers';
import {
  addMember,
  apiCall,
  BACKEND_URL,
  apiSend,
  dayLabel,
  expectFits,
  expectNoA11yViolations,
  expectNoSidewaysScroll,
  money,
  monthLabel,
  periodLabel,
  seed,
  seedWorkspace,
  stagesOf,
  waitForHydration,
} from './helpers';

// What the page is checked against of the API's answers.
type Totals = { amount: string; currency: string }[];
type Period = { from: string; to: string };
type MemberRef = { displayName?: string; email: string };
type Pipeline = {
  byStage: { stage: { name: string }; count: number; totals: Totals }[];
  byOwner: { owner?: MemberRef; count: number; totals: Totals }[];
};
type WonLost = {
  period: Period;
  months: { month: string; won: number; lost: number; wonTotals: Totals }[];
};
type Funnel = {
  period: Period;
  created: number;
  historyFrom?: string;
  stages: { stage: { name: string }; reached: number }[];
};
type Activities = {
  period: Period;
  byUser: {
    user?: MemberRef;
    calls: number;
    emails: number;
    meetings: number;
    notes: number;
    tasksCompleted: number;
    total: number;
  }[];
};
type FollowUps = Record<
  'overdueTasks' | 'upcomingTasks' | 'dueLeads',
  { count: number; first: { id: number; title?: string; firstName?: string }[] }
>;

const HOUR = 60 * 60 * 1000;

// The API's own answer, which the page must show as it is.
const report = async <T>(request: APIRequestContext, as: Member, name: string, query = '') =>
  await apiCall<T>(request, as, 'GET', `/workspaces/${as.workspaceId}/reports/${name}${query}`);

// A member as the page names them.
const named = (member?: MemberRef) => (member ? (member.displayName ?? member.email) : undefined);

const reports = (path: string, query = '') => `${path}/reports${query}`;

const move = async (
  request: APIRequestContext,
  as: Member,
  deal: { id: number; version: number },
  stage: string,
  lostReason?: string,
) => {
  const stages = await stagesOf(request, as);
  const target = stages.find((item) => item.name === stage);
  await apiSend(request, as, 'POST', `/workspaces/${as.workspaceId}/deals/${deal.id}/move`, {
    stageId: target?.id,
    version: deal.version,
    ...(lostReason && { lostReason }),
  });
};

/**
 * Through the API: a workspace with something in every report. Deals open in two currencies for
 * the owner and the rep (one stage ahead), one won and one lost; calls, emails, meetings, notes
 * and a completed task; an overdue and an upcoming task; a lead due. A manager who made a deal and
 * activities then leaves, so there are an unassigned row and former members.
 * @param request Playwright API client.
 * @returns The owner, the rep and the manager who left.
 */
const seedReports = async (request: APIRequestContext) => {
  const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
  const riley = await addMember(request, owner, 'SALES_REP', PEOPLE.rep);
  const leaver = await addMember(request, owner, 'MANAGER', PEOPLE.leaver);
  const company = await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
  await seed(request, owner, 'deals', { name: DEALS.tablets, amount: '1000.00' });
  const ahead = await seed(request, owner, 'deals', { name: DEALS.rollout, amount: '2500.50' });
  await move(request, owner, ahead, 'Proposal');
  const won = await seed(request, owner, 'deals', { name: DEALS.won, amount: '1234.56' });
  await move(request, owner, won, 'Won');
  await seed(request, riley, 'deals', {
    name: DEALS.usExpansion,
    amount: '400.00',
    currency: 'USD',
  });
  const lost = await seed(request, riley, 'deals', { name: DEALS.lost, amount: '99.00' });
  await move(request, owner, lost, 'Lost', 'Chose another supplier');
  await seed(request, leaver, 'deals', { name: 'Lee deal', amount: '750.00' });
  const link = { companyId: company.id };
  await seed(request, owner, 'activities', { type: 'CALL', subject: 'Intro call', ...link });
  await seed(request, owner, 'activities', { type: 'CALL', subject: 'Follow-up call', ...link });
  await seed(request, owner, 'activities', { type: 'NOTE', subject: 'Notes', ...link });
  await seed(request, riley, 'activities', { type: 'EMAIL', subject: 'Quote sent', ...link });
  await seed(request, riley, 'activities', { type: 'MEETING', subject: 'On site', ...link });
  await seed(request, leaver, 'activities', { type: 'EMAIL', subject: 'Hello', ...link });
  const done = await seed(request, riley, 'tasks', {
    title: 'Prepare the quote',
    dueAt: new Date(Date.now() + 5 * HOUR).toISOString(),
    assigneeId: riley.userId,
  });
  await apiSend(
    request,
    riley,
    'POST',
    `/workspaces/${owner.workspaceId}/tasks/${done.id}/complete`,
    {
      version: done.version,
    },
  );
  await seed(request, owner, 'tasks', {
    title: 'Send the proposal',
    dueAt: new Date(Date.now() - 48 * HOUR).toISOString(),
    assigneeId: riley.userId,
  });
  await seed(request, owner, 'tasks', {
    title: 'Book the demo',
    dueAt: new Date(Date.now() + 24 * HOUR).toISOString(),
    assigneeId: owner.userId,
  });
  await seed(request, owner, 'leads', {
    firstName: 'Noa',
    lastName: 'Park',
    followUpDate: '2026-01-05',
  });
  await apiSend(
    request,
    owner,
    'DELETE',
    `/workspaces/${owner.workspaceId}/members/${leaver.userId}`,
  );

  return { owner, riley, leaver };
};

const tabsOf = (page: Page) => page.getByRole('navigation', { name: 'Reports' });

const TABS = ['pipeline', 'won-lost', 'funnel', 'activities', 'follow-ups'] as const;

// A table's rows, each a row header and the figures of its cells in order, as the page shows them.
const expectRows = async (table: Locator, expected: string[][]) => {
  await expect(table.getByRole('row')).toHaveCount(expected.length + 1);
  await Promise.all(
    expected.map(async (cells, index) => {
      const row = table.getByRole('row').nth(index + 1);
      const [name, ...figures] = cells;
      await expect(row.getByRole('rowheader')).toContainText(name ?? '');
      await Promise.all(
        figures.map(async (figure, column) => {
          await expect(row.getByRole('cell').nth(column)).toContainText(figure);
        }),
      );
    }),
  );
};

type Check = (page: Page, request: APIRequestContext, as: Member, query: string) => Promise<void>;

// Per report: its figures on the page, checked against the API's answer to the same params
// (`?ownerId=…&from=…`, as the page's URL has them beside the tab).
const FIGURES: Record<(typeof TABS)[number], Check> = {
  pipeline: async (page, request, as, query) => {
    const api = await report<Pipeline>(request, as, 'pipeline', query);
    await expectRows(
      page.getByRole('region', { name: 'Open deals by stage' }).getByRole('table'),
      api.byStage.map((bucket) => [bucket.stage.name, String(bucket.count)]),
    );
    await expectRows(
      page.getByRole('table', { name: 'Open deals by owner' }),
      api.byOwner.map((bucket) => [
        named(bucket.owner) ?? 'Unassigned',
        String(bucket.count),
        bucket.totals.map((total) => money(total.amount, total.currency)).join(''),
      ]),
    );
  },
  'won-lost': async (page, request, as, query) => {
    const api = await report<WonLost>(request, as, 'won-lost', query);
    await expectRows(
      page.getByRole('region', { name: 'Won and lost by month' }).getByRole('table'),
      api.months.map((item) => [monthLabel(item.month), String(item.won), String(item.lost)]),
    );
  },
  funnel: async (page, request, as, query) => {
    const api = await report<Funnel>(request, as, 'funnel', query);
    await expect(
      page.getByText(new RegExp(`^${api.created} deals? created in this period`, 'u')),
    ).toBeVisible();
    await expectRows(
      page.getByRole('region', { name: 'Funnel' }).getByRole('table'),
      api.stages.map((step) => [step.stage.name, `${step.reached} of ${api.created}`]),
    );
  },
  activities: async (page, request, as, query) => {
    const api = await report<Activities>(request, as, 'activities', query);
    await expectRows(
      page.getByRole('region', { name: 'Activity table' }),
      api.byUser.map((entry) => [
        named(entry.user) ?? 'Former members',
        ...[entry.calls, entry.emails, entry.meetings, entry.notes, entry.tasksCompleted].map(
          String,
        ),
        String(entry.total),
      ]),
    );
  },
  'follow-ups': async (page, request, as, query) => {
    const api = await report<FollowUps>(request, as, 'follow-ups', query);
    await Promise.all(
      (
        [
          ['Overdue tasks', api.overdueTasks],
          ['Upcoming tasks', api.upcomingTasks],
          ['Leads to follow up', api.dueLeads],
        ] as const
      ).map(async ([name, group]) => {
        const region = page.getByRole('region', { name });
        await expect(region.getByText(String(group.count), { exact: true })).toBeVisible();
        await expect(region.getByRole('listitem')).toHaveCount(group.first.length);
      }),
    );
  },
};

/**
 * Checks the figures of the report on the page against the API's answer to the same params.
 * @param page Playwright page, on the report.
 * @param request Playwright API client.
 * @param as The member the page is signed in as.
 * @param tab The report.
 * @param query The params beside the tab, as the page's URL has them.
 */
const expectFigures = async (
  page: Page,
  request: APIRequestContext,
  as: Member,
  tab: (typeof TABS)[number],
  query = '',
) => {
  await FIGURES[tab](page, request, as, query);
};

// The Owner chip, before and after a member is chosen.
const ownerChip = (page: Page, name?: string) =>
  page.getByRole('button', { name: name ? `Owner: ${name}` : 'Owner', exact: true });

test.describe('Reports', () => {
  test('opens the pipeline from the rail, and for a value that is no report', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(owner.path);
    await page.getByRole('link', { name: 'Reports' }).first().click();
    await expect(page).toHaveURL(reports(owner.path));
    await expect(page.getByRole('heading', { level: 1, name: 'Reports' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Reports' }).first()).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(tabsOf(page).getByRole('link', { name: 'Pipeline' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('heading', { name: 'Open deals by stage' })).toBeVisible();

    await page.goto(reports(owner.path, '?tab=nope'));
    await expect(tabsOf(page).getByRole('link', { name: 'Pipeline' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('heading', { name: 'Open deals by stage' })).toBeVisible();
  });

  for (const [tab, name, heading] of [
    ['pipeline', 'Pipeline', 'Open deals by stage'],
    ['won-lost', 'Won and lost', 'Won and lost by month'],
    ['funnel', 'Funnel', 'Funnel'],
    ['activities', 'Activities', 'Activity by member'],
    ['follow-ups', 'Follow-ups', 'Overdue tasks'],
  ]) {
    test(`opens ${tab} from its URL`, async ({ page, request }) => {
      const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
      await signIn(page, { email: owner.email, password: PASSWORD });

      await page.goto(reports(owner.path, `?tab=${tab}`));

      await expect(tabsOf(page).getByRole('link', { name })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    });
  }

  test('moves between the reports by keyboard', async ({ page, request }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(reports(owner.path));

    // Tab to the next tab and Enter opens it.
    await tabsOf(page).getByRole('link', { name: 'Pipeline' }).focus();
    await page.keyboard.press('Tab');
    await expect(tabsOf(page).getByRole('link', { name: 'Won and lost' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(reports(owner.path, '?tab=won-lost'));
    await expect(page.getByRole('heading', { name: 'Won and lost by month' })).toBeVisible();
    await expect(tabsOf(page).getByRole('link', { name: 'Won and lost' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('shows the pipeline as the API counted it, each currency apart', async ({
    page,
    request,
  }) => {
    const { owner } = await seedReports(request);
    await signIn(page, { email: owner.email, password: PASSWORD });
    const api = await report<Pipeline>(request, owner, 'pipeline');
    // Lee left, so the deal they made has no owner now.
    expect(api.byOwner.some((entry) => entry.owner === undefined)).toBe(true);

    await page.goto(reports(owner.path, '?tab=pipeline'));

    // The table under the bars is open at once; "Table" hides it and shows it again.
    const stages = page.getByRole('region', { name: 'Open deals by stage' });
    const toggle = stages.getByRole('button', { name: 'Table', exact: true });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await Promise.all(
      api.byStage.map(async (bucket, index) => {
        const row = stages.getByRole('row').nth(index + 1);
        await expect(row).toContainText(bucket.stage.name);
        await expect(row.getByRole('cell').first()).toHaveText(String(bucket.count));
        await Promise.all(
          bucket.totals.map(async (total) => {
            await expect(row).toContainText(money(total.amount, total.currency));
          }),
        );
      }),
    );
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(stages.getByRole('table')).toHaveCount(0);
    await toggle.click();
    await expect(stages.getByRole('table')).toBeVisible();
    // The owners in the API's order, the unassigned deals named as such.
    const owners = page.getByRole('table', { name: 'Open deals by owner' });
    await expect(owners.getByRole('row')).toHaveCount(api.byOwner.length + 1);
    await Promise.all(
      api.byOwner.map(async (bucket, index) => {
        const row = owners.getByRole('row').nth(index + 1);
        await expect(row.getByRole('rowheader')).toContainText(named(bucket.owner) ?? 'Unassigned');
        await expect(row.getByRole('cell').first()).toHaveText(String(bucket.count));
        await Promise.all(
          bucket.totals.map(async (total) => {
            await expect(row).toContainText(money(total.amount, total.currency));
          }),
        );
      }),
    );
    await expectNoA11yViolations(page);
  });

  test('shows every month of the period with the won and lost deals as the API counted them', async ({
    page,
    request,
  }) => {
    const { owner } = await seedReports(request);
    await signIn(page, { email: owner.email, password: PASSWORD });
    const api = await report<WonLost>(request, owner, 'won-lost');
    expect(api.months.length).toBeGreaterThanOrEqual(1);
    expect(api.months.reduce((sum, item) => sum + item.won, 0)).toBe(1);
    expect(api.months.reduce((sum, item) => sum + item.lost, 0)).toBe(1);

    await page.goto(reports(owner.path, '?tab=won-lost'));

    // The period is the one the API answered with, though the URL named none.
    await expect(
      page.getByRole('button', { name: `Period: ${periodLabel(api.period)}` }),
    ).toBeVisible();
    // The months and the won values are on the page without a click.
    const panel = page.getByRole('region', { name: 'Won and lost by month' });
    await expect(panel.getByRole('button', { name: 'Table', exact: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(panel.getByRole('row')).toHaveCount(api.months.length + 1);
    await Promise.all(
      api.months.map(async (item, index) => {
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
    // Won and lost both draw in the chart, and the lost bar carries a pattern, not only a colour.
    await expect(panel.locator('pattern')).toHaveCount(1);
    await expectNoA11yViolations(page);
  });

  test('shows the funnel as the API counted it, and says when the history starts late', async ({
    page,
    request,
  }) => {
    const { owner } = await seedReports(request);
    await signIn(page, { email: owner.email, password: PASSWORD });
    const api = await report<Funnel>(request, owner, 'funnel');
    expect(api.created).toBe(6);
    // The workspace is new: its stage history starts today, after the last 30 days began.
    expect(api.historyFrom).toBe(api.period.to);

    await page.goto(reports(owner.path, '?tab=funnel'));

    await expect(page.getByText(`${api.created} deals created in this period`)).toBeVisible();
    const panel = page.getByRole('region', { name: 'Funnel' });
    await expect(panel.getByRole('row')).toHaveCount(api.stages.length + 1);
    await Promise.all(
      api.stages.map(async (step, index) => {
        const row = panel.getByRole('row').nth(index + 1);
        await expect(row.getByRole('rowheader')).toHaveText(step.stage.name);
        await expect(row.getByRole('cell')).toHaveText(`${step.reached} of ${api.created}`);
      }),
    );
    // The caution names the day the history starts, in the workspace's zone.
    const today = dayLabel(api.period.to);
    await expect(
      page.getByText(
        `Stage history starts on ${today}; deals created before it count only the stages recorded since.`,
      ),
    ).toBeVisible();
    await expectNoA11yViolations(page);

    // A period that starts with the history needs no caution.
    const from = api.period.to;
    const same = await report<Funnel>(request, owner, 'funnel', `?from=${from}&to=${from}`);
    await page.goto(reports(owner.path, `?tab=funnel&from=${from}&to=${from}`));
    await expect(page.getByText(`${same.created} deals created in this period`)).toBeVisible();
    await expect(page.getByText(/Stage history starts on/u)).toHaveCount(0);
    await expect(page.getByText('No stage changes yet.')).toHaveCount(0);
  });

  test('says there are no stage changes yet in a workspace without deals', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
    await signIn(page, { email: owner.email, password: PASSWORD });
    const api = await report<Funnel>(request, owner, 'funnel');
    expect(api.historyFrom).toBeUndefined();

    await page.goto(reports(owner.path, '?tab=funnel'));

    await expect(page.getByText('No stage changes yet.')).toBeVisible();
    await expect(page.getByText('No deals were created in this period.')).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('shows the activities of each member as the API counted them, the former members last', async ({
    page,
    request,
  }) => {
    const { owner } = await seedReports(request);
    await signIn(page, { email: owner.email, password: PASSWORD });
    const api = await report<Activities>(request, owner, 'activities');
    expect(api.byUser.at(-1)?.user).toBeUndefined();

    await page.goto(reports(owner.path, '?tab=activities'));

    await expect(
      page.getByRole('button', { name: `Period: ${periodLabel(api.period)}` }),
    ).toBeVisible();
    const table = page.getByRole('region', { name: 'Activity table' });
    await expect(table.getByRole('row')).toHaveCount(api.byUser.length + 1);
    await Promise.all(
      api.byUser.map(async (entry, index) => {
        const row = table.getByRole('row').nth(index + 1);
        await expect(row.getByRole('rowheader')).toContainText(
          named(entry.user) ?? 'Former members',
        );
        const counts = [
          entry.calls,
          entry.emails,
          entry.meetings,
          entry.notes,
          entry.tasksCompleted,
        ];
        await Promise.all(
          counts.map(async (count, column) => {
            await expect(row.getByRole('cell').nth(column)).toHaveText(String(count));
          }),
        );
        // The API's total of the row, which is the five counts together.
        expect(entry.total).toBe(counts.reduce((sum, count) => sum + count, 0));
        await expect(row.getByRole('cell').nth(5)).toHaveText(String(entry.total));
      }),
    );
    await expectNoA11yViolations(page);
  });

  test('shows the follow-ups with their counts, the first items as links, and the rest as a link to the list', async ({
    page,
    request,
  }) => {
    const { owner, riley } = await seedReports(request);
    // More than the 20 the API lists, of tasks and of leads: a lead and a late call for each of
    // MORE_LEADS (Noa Park, from January 5, is the oldest lead).
    await Promise.all([
      ...MORE_LEADS.map(async (lead, index) => {
        await seed(request, riley, 'tasks', {
          title: `Call ${lead.firstName} ${lead.lastName}`,
          dueAt: new Date(Date.now() - (3 + index) * HOUR).toISOString(),
          assigneeId: riley.userId,
        });
      }),
      ...MORE_LEADS.map(async (lead, index) => {
        await seed(request, owner, 'leads', {
          ...lead,
          followUpDate: `2026-02-${String(index + 1).padStart(2, '0')}`,
        });
      }),
    ]);
    await signIn(page, { email: owner.email, password: PASSWORD });
    const api = await report<FollowUps>(request, owner, 'follow-ups');
    expect(api.overdueTasks.count).toBe(22);
    expect(api.overdueTasks.first).toHaveLength(20);
    expect(api.dueLeads.count).toBe(22);
    // Today in the workspace's zone, which is where the API ends its default period.
    const { period } = await report<Funnel>(request, owner, 'funnel');

    await page.goto(reports(owner.path, '?tab=follow-ups'));

    const overdue = page.getByRole('region', { name: 'Overdue tasks' });
    await expect(overdue).toContainText(String(api.overdueTasks.count));
    await expect(overdue.getByRole('listitem')).toHaveCount(api.overdueTasks.first.length);
    const [first] = api.overdueTasks.first;
    await expect(overdue.getByRole('link', { name: first?.title, exact: true })).toHaveAttribute(
      'href',
      `${owner.path}/tasks/${first?.id}`,
    );
    const upcoming = page.getByRole('region', { name: 'Upcoming tasks' });
    await expect(upcoming).toContainText(String(api.upcomingTasks.count));
    await expect(upcoming.getByRole('link', { name: 'Book the demo' })).toBeVisible();
    const leads = page.getByRole('region', { name: 'Leads to follow up' });
    await expect(leads).toContainText(String(api.dueLeads.count));
    await expect(leads.getByRole('link', { name: 'Noa Park' })).toHaveAttribute(
      'href',
      `${owner.path}/leads/${api.dueLeads.first[0]?.id}`,
    );
    // Only the group the API cut has "and N more".
    await expect(upcoming.getByRole('link', { name: /more/u })).toHaveCount(0);
    await expectNoA11yViolations(page);

    await overdue.getByRole('link', { name: 'and 2 more' }).click();
    await expect(page).toHaveURL(`${owner.path}/tasks?view=overdue`);
    await expect(page.getByRole('heading', { name: '22 tasks', exact: true })).toBeVisible();

    // The leads' rest: the open leads due up to today, the oldest first.
    await page.goto(reports(owner.path, '?tab=follow-ups'));
    await leads.getByRole('link', { name: 'and 2 more' }).click();
    await expect(page).toHaveURL(
      `${owner.path}/leads?status=NEW&status=CONTACTED&status=QUALIFIED&followUpBefore=${period.to}&sort=FOLLOW_UP_DATE&direction=ASC`,
    );
    await expect(page.getByRole('heading', { name: '22 leads', exact: true })).toBeVisible();
    await expect(page.getByRole('row').nth(1)).toContainText('Noa Park');
  });

  // Not a date, a month 13, from after to, more than 366 days, a from in the future: the default
  // period and the report, never an error page.
  for (const tab of ['won-lost', 'funnel', 'activities']) {
    for (const query of [
      '&from=2026-13-01&to=x',
      '&from=2020-01-01&to=2026-10-18',
      '&from=2999-01-01',
    ]) {
      test(`shows the default period for ${tab}${query}, not an error`, async ({
        page,
        request,
      }) => {
        const owner = await seedWorkspace(request, { owner: PEOPLE.owner });
        await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
        await signIn(page, { email: owner.email, password: PASSWORD });
        const defaults = await report<WonLost>(request, owner, tab);

        await page.goto(reports(owner.path, `?tab=${tab}${query}`));

        await expect(page.getByRole('heading', { level: 1, name: 'Reports' })).toBeVisible();
        await expect(
          page.getByRole('button', { name: `Period: ${periodLabel(defaults.period)}` }),
        ).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Something went wrong' })).toHaveCount(0);
      });
    }
  }

  test('changes the period from the picker and keeps the tab, and the period moves with the tabs', async ({
    page,
    request,
  }) => {
    const { owner } = await seedReports(request);
    await signIn(page, { email: owner.email, password: PASSWORD });
    const defaults = await report<WonLost>(request, owner, 'won-lost');
    await page.goto(reports(owner.path, '?tab=won-lost'));
    const trigger = (period: Period) =>
      page.getByRole('button', { name: `Period: ${periodLabel(period)}` });
    await expect(trigger(defaults.period)).toBeVisible();

    await trigger(defaults.period).click();
    await page.getByRole('link', { name: 'Last 7 days' }).click();

    await expect(page).toHaveURL(/\?tab=won-lost&from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}$/u);
    const url = new URL(page.url());
    const query = `?from=${url.searchParams.get('from')}&to=${url.searchParams.get('to')}`;
    const asked = await report<WonLost>(request, owner, 'won-lost', query);
    await expect(trigger(asked.period)).toBeVisible();
    expect((Date.parse(asked.period.to) - Date.parse(asked.period.from)) / (24 * HOUR)).toBe(6);

    // The next tab keeps the range, and its label is what the API answered for it.
    await tabsOf(page).getByRole('link', { name: 'Activities' }).click();
    await expect(page).toHaveURL(
      reports(
        owner.path,
        `?tab=activities&from=${url.searchParams.get('from')}&to=${url.searchParams.get('to')}`,
      ),
    );
    const activities = await report<Activities>(request, owner, 'activities', query);
    await expect(trigger(activities.period)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Activity by member' })).toBeVisible();
  });

  test('shows a rep the whole workspace, as the API does', async ({ page, request }) => {
    const { riley } = await seedReports(request);
    await signIn(page, { email: riley.email, password: PASSWORD });
    const api = await report<Pipeline>(request, riley, 'pipeline');

    await page.goto(riley.path);
    await page.getByRole('link', { name: 'Reports' }).first().click();

    await expect(page.getByRole('heading', { level: 1, name: 'Reports' })).toBeVisible();
    const owners = page.getByRole('table', { name: 'Open deals by owner' });
    await expect(owners.getByRole('row')).toHaveCount(api.byOwner.length + 1);
    await expect(owners).toContainText(PEOPLE.owner);
    await expect(owners).toContainText(PEOPLE.rep);
  });

  for (const tab of TABS) {
    test(`counts one member's records on ${tab} as the API does for them, and the workspace's once cleared`, async ({
      page,
      request,
    }) => {
      const { owner, riley } = await seedReports(request);
      await signIn(page, { email: owner.email, password: PASSWORD });
      await page.goto(reports(owner.path, `?tab=${tab}`));
      await expectFigures(page, request, owner, tab);

      // Members only, the caller first as "Me": a report counts one member's records.
      await waitForHydration(ownerChip(page));
      await ownerChip(page).click();
      await expect(page.getByRole('option')).toHaveText([
        /^Anyone/u,
        /Me$/u,
        new RegExp(`${PEOPLE.rep}$`, 'u'),
      ]);
      await page.getByRole('option', { name: PEOPLE.rep }).click();

      await expect(page).toHaveURL(reports(owner.path, `?tab=${tab}&ownerId=${riley.userId}`));
      await expect(ownerChip(page, PEOPLE.rep)).toBeVisible();
      await expectFigures(page, request, owner, tab, `?ownerId=${riley.userId}`);
      await expectNoA11yViolations(page);

      await page.getByRole('button', { name: 'Clear the Owner filter' }).click();
      await expect(page).toHaveURL(reports(owner.path, `?tab=${tab}`));
      await expect(ownerChip(page)).toBeFocused();
      await expectFigures(page, request, owner, tab);
    });
  }

  test("counts the caller's own follow-ups from Me, and names them where they have none", async ({
    page,
    request,
  }) => {
    const { owner } = await seedReports(request);
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(reports(owner.path, '?tab=follow-ups'));

    await waitForHydration(ownerChip(page));
    await ownerChip(page).click();
    await page.getByRole('option', { name: 'Me' }).click();

    await expect(page).toHaveURL(reports(owner.path, `?tab=follow-ups&ownerId=${owner.userId}`));
    await expect(ownerChip(page, 'Me')).toBeVisible();
    await expectFigures(page, request, owner, 'follow-ups', `?ownerId=${owner.userId}`);
    // Riley holds the overdue task; Olivia the upcoming one and the lead.
    await expect(
      page.getByText(`No overdue tasks assigned to ${PEOPLE.owner}.`, { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('region', { name: 'Upcoming tasks' })
        .getByRole('link', { name: 'Book the demo' }),
    ).toBeVisible();
  });

  test('keeps the owner when the period or the tab changes', async ({ page, request }) => {
    const { owner, riley } = await seedReports(request);
    await signIn(page, { email: owner.email, password: PASSWORD });
    const defaults = await report<WonLost>(request, owner, 'won-lost');
    await page.goto(reports(owner.path, `?tab=won-lost&ownerId=${riley.userId}`));
    const trigger = page.getByRole('button', { name: `Period: ${periodLabel(defaults.period)}` });
    await waitForHydration(trigger);

    await trigger.click();
    await page.getByRole('link', { name: 'Last 7 days' }).click();

    await expect(page).toHaveURL(
      new RegExp(
        `\\?tab=won-lost&ownerId=${riley.userId}&from=\\d{4}-\\d{2}-\\d{2}&to=\\d{4}-\\d{2}-\\d{2}$`,
        'u',
      ),
    );
    const url = new URL(page.url());
    const period = `from=${url.searchParams.get('from')}&to=${url.searchParams.get('to')}`;
    await expect(ownerChip(page, PEOPLE.rep)).toBeVisible();
    await expectFigures(page, request, owner, 'won-lost', `?ownerId=${riley.userId}&${period}`);

    await tabsOf(page).getByRole('link', { name: 'Activities' }).click();
    await expect(page).toHaveURL(
      reports(owner.path, `?tab=activities&ownerId=${riley.userId}&${period}`),
    );
    await expect(ownerChip(page, PEOPLE.rep)).toBeVisible();
    await expectFigures(page, request, owner, 'activities', `?ownerId=${riley.userId}&${period}`);
  });

  test("shows the workspace's report under a notice for an owner who left", async ({
    page,
    request,
  }) => {
    const { owner, leaver } = await seedReports(request);
    await signIn(page, { email: owner.email, password: PASSWORD });
    // The API refuses a removed member, and the page asks it again without them.
    const refused = await request.get(
      `${BACKEND_URL}/api/v1/workspaces/${owner.workspaceId}/reports/pipeline?ownerId=${leaver.userId}`,
      { headers: owner.headers },
    );
    expect(refused.status()).toBe(400);

    await page.goto(reports(owner.path, `?tab=pipeline&ownerId=${leaver.userId}`));

    await expect(
      page.getByRole('heading', { name: "This owner can't be reported on" }),
    ).toBeVisible();
    await expect(ownerChip(page, 'Former member')).toBeVisible();
    await expectFigures(page, request, owner, 'pipeline');
    await expectNoA11yViolations(page);

    await page.getByRole('link', { name: 'Clear the owner' }).click();
    await expect(page).toHaveURL(reports(owner.path, '?tab=pipeline'));
    await expect(ownerChip(page)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: "This owner can't be reported on" }),
    ).toHaveCount(0);
  });

  test.describe('on a phone, with an owner', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    for (const locale of ['th', 'fr']) {
      test(`fits the width on every report in ${locale}`, async ({ page, request }) => {
        const { owner, riley } = await seedReports(request);
        await signIn(page, { email: owner.email, password: PASSWORD });
        const path = reports(owner.path.replace('/app/', `/${locale}/app/`));

        for (const tab of TABS) {
          // oxlint-disable-next-line no-await-in-loop -- one page after the other
          await expectFits(page, { url: `${path}?tab=${tab}&ownerId=${riley.userId}` });
        }
        await expectNoA11yViolations(page);
      });
    }
  });

  test.describe('on a phone, in Thai', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    for (const tab of ['pipeline', 'won-lost', 'funnel', 'activities', 'follow-ups']) {
      test(`fits the width on ${tab}`, async ({ page, request }) => {
        const { owner } = await seedReports(request);
        await signIn(page, { email: owner.email, password: PASSWORD });
        const path = reports(owner.path.replace('/app/', '/th/app/'));

        await expectNoSidewaysScroll(page, `${path}?tab=${tab}`);

        await expect(page.getByRole('heading', { level: 1, name: 'รายงาน' })).toBeVisible();
        await expectNoA11yViolations(page);
      });
    }

    test("opens a chart's table, and lets the keyboard scroll the activity table", async ({
      page,
      request,
    }) => {
      const { owner } = await seedReports(request);
      await signIn(page, { email: owner.email, password: PASSWORD });
      const path = reports(owner.path.replace('/app/', '/th/app/'));

      // A chart's table is open already, on a phone too.
      await page.goto(`${path}?tab=won-lost`);
      await expect(page.getByRole('button', { name: 'ตาราง', exact: true })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      // The seven columns do not fit: Tab reaches the region after the period button, and the
      // arrow key scrolls it.
      await page.goto(`${path}?tab=activities`);
      const table = page.getByRole('region', { name: 'ตารางกิจกรรม' });
      await page.getByRole('button', { name: /^ช่วงเวลา/u }).focus();
      await page.keyboard.press('Tab');
      await expect(table).toBeFocused();
      expect(await table.evaluate((node) => node.scrollLeft)).toBe(0);
      await page.keyboard.press('ArrowRight');
      await expect
        .poll(async () => await table.evaluate((node) => node.scrollLeft))
        .toBeGreaterThan(0);
    });
  });
});
