import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { PASSWORD, signIn } from '../helpers';
import type { Member } from './helpers';
import {
  addMember,
  apiCall,
  apiSend,
  expectNoA11yViolations,
  expectNoSidewaysScroll,
  seed,
  seedWorkspace,
  stagesOf,
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
  }[];
};
type FollowUps = Record<
  'overdueTasks' | 'upcomingTasks' | 'dueLeads',
  { count: number; first: { id: number; title?: string; firstName?: string }[] }
>;

const HOUR = 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The API's own answer, which the page must show as it is.
const report = async <T>(request: APIRequestContext, as: Member, name: string, query = '') =>
  await apiCall<T>(request, as, 'GET', `/workspaces/${as.workspaceId}/reports/${name}${query}`);

// An amount as the page writes it in English: the currency's symbol, grouped, with its cents.
const money = (amount: string, currency: string) =>
  new Intl.NumberFormat('en', { style: 'currency', currency }).format(Number(amount));

// A period as the page writes it in English: "Sep 19 – Oct 18, 2026", the year once when shared.
const label = (period: Period) => {
  const day = (value: string) =>
    `${MONTHS[Number(value.slice(5, 7)) - 1]} ${Number(value.slice(8))}`;
  const sameYear = period.from.slice(0, 4) === period.to.slice(0, 4);

  return `${day(period.from)}${sameYear ? '' : `, ${period.from.slice(0, 4)}`} – ${day(period.to)}, ${period.to.slice(0, 4)}`;
};

// A report month as the page writes it: "Oct 2026".
const month = (value: string) => `${MONTHS[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}`;

// A member as the page names them.
const named = (member?: MemberRef) => (member ? (member.displayName ?? member.email) : undefined);

const reports = (path: string, query = '') => `${path}/reports${query}`;

// Under every chart, "Show table" is closed on a wide screen until it is asked for.
const showTable = async (panel: Locator) => {
  const button = panel.getByRole('button', { name: 'Show table' });
  await expect(button).toBeVisible();
  await button.click();
  await expect(panel.getByRole('button', { name: 'Hide table' })).toBeVisible();
};

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
 * @returns The owner, the rep and the company's id.
 */
const seedReports = async (request: APIRequestContext) => {
  const owner = await seedWorkspace(request, { workspace: 'Acme', owner: 'Olivia Owner' });
  const riley = await addMember(request, owner, 'SALES_REP', 'Riley Rep');
  const leaver = await addMember(request, owner, 'MANAGER', 'Lee Leaver');
  const company = await seed(request, owner, 'companies', { name: 'Acme Trading' });
  await seed(request, owner, 'deals', { name: 'Acme seats', amount: '1000.00' });
  const ahead = await seed(request, owner, 'deals', { name: 'Acme rollout', amount: '2500.50' });
  await move(request, owner, ahead, 'Proposal');
  const won = await seed(request, owner, 'deals', { name: 'Won deal', amount: '1234.56' });
  await move(request, owner, won, 'Won');
  await seed(request, riley, 'deals', { name: 'Riley US', amount: '400.00', currency: 'USD' });
  const lost = await seed(request, riley, 'deals', { name: 'Lost deal', amount: '99.00' });
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

  return { owner, riley };
};

const tabsOf = (page: Page) => page.getByRole('navigation', { name: 'Reports' });

test.describe('Reports', () => {
  test('opens the pipeline from the rail, and for a value that is no report', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { workspace: 'Acme', owner: 'Olivia Owner' });
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
      const owner = await seedWorkspace(request, { workspace: 'Acme', owner: 'Olivia Owner' });
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
    const owner = await seedWorkspace(request, { workspace: 'Acme', owner: 'Olivia Owner' });
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

    const stages = page.getByRole('region', { name: 'Open deals by stage' });
    await showTable(stages);
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
    await expect(page.getByRole('button', { name: `Period: ${label(api.period)}` })).toBeVisible();
    const panel = page.getByRole('region', { name: 'Won and lost by month' });
    await showTable(panel);
    await expect(panel.getByRole('row')).toHaveCount(api.months.length + 1);
    await Promise.all(
      api.months.map(async (item, index) => {
        const row = panel.getByRole('row').nth(index + 1);
        await expect(row.getByRole('rowheader')).toHaveText(month(item.month));
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
    const today = `${MONTHS[Number(api.period.to.slice(5, 7)) - 1]} ${Number(api.period.to.slice(8))}, ${api.period.to.slice(0, 4)}`;
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
    const owner = await seedWorkspace(request, { workspace: 'Acme', owner: 'Olivia Owner' });
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

    await expect(page.getByRole('button', { name: `Period: ${label(api.period)}` })).toBeVisible();
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
        await expect(row.getByRole('cell').nth(5)).toHaveText(
          String(counts.reduce((sum, count) => sum + count, 0)),
        );
      }),
    );
    await expectNoA11yViolations(page);
  });

  test('shows the follow-ups with their counts, the first items as links, and the rest as a link to the list', async ({
    page,
    request,
  }) => {
    const { owner, riley } = await seedReports(request);
    // More than the 20 the API lists.
    await Promise.all(
      Array.from({ length: 21 }, async (_, index) => {
        await seed(request, riley, 'tasks', {
          title: `Late ${index}`,
          dueAt: new Date(Date.now() - (3 + index) * HOUR).toISOString(),
          assigneeId: riley.userId,
        });
      }),
    );
    await signIn(page, { email: owner.email, password: PASSWORD });
    const api = await report<FollowUps>(request, owner, 'follow-ups');
    expect(api.overdueTasks.count).toBe(22);
    expect(api.overdueTasks.first).toHaveLength(20);

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
    await expect(page.getByRole('heading', { name: '22 tasks' })).toBeVisible();
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
        const owner = await seedWorkspace(request, { workspace: 'Acme', owner: 'Olivia Owner' });
        await seed(request, owner, 'companies', { name: 'Acme Trading' });
        await signIn(page, { email: owner.email, password: PASSWORD });
        const defaults = await report<WonLost>(request, owner, tab);

        await page.goto(reports(owner.path, `?tab=${tab}${query}`));

        await expect(page.getByRole('heading', { level: 1, name: 'Reports' })).toBeVisible();
        await expect(
          page.getByRole('button', { name: `Period: ${label(defaults.period)}` }),
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
      page.getByRole('button', { name: `Period: ${label(period)}` });
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
    await expect(owners).toContainText('Olivia Owner');
    await expect(owners).toContainText('Riley Rep');
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

      // Below `md` a chart's table is open already.
      await page.goto(`${path}?tab=won-lost`);
      await expect(page.getByRole('button', { name: 'ซ่อนตาราง' })).toBeVisible();
      // The seven columns do not fit; the region takes the focus so the keyboard can scroll it.
      await page.goto(`${path}?tab=activities`);
      const table = page.getByRole('region', { name: 'ตารางกิจกรรม' });
      await table.focus();
      await expect(table).toBeFocused();
    });
  });
});
