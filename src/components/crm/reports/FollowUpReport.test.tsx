import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { cancelTask, completeTask, reopenTask } from '@/actions/crm/TaskActions';
import type { components } from '@/libs/api/schema';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { FollowUpReport } from './FollowUpReport';
import '@/styles/global.css';

// The task due time lives with the rows, which import the task actions.
vi.mock(import('@/actions/crm/TaskActions'), () => ({
  completeTask: vi.fn<typeof completeTask>(),
  reopenTask: vi.fn<typeof reopenTask>(),
  cancelTask: vi.fn<typeof cancelTask>(),
}));

type Props = Parameters<typeof FollowUpReport>[0];
type Task = components['schemas']['TaskResponse'];
type Lead = components['schemas']['LeadResponse'];

const task = (id: number, title: string, overdue: boolean, assignee?: string): Task => ({
  id,
  title,
  overdue,
  status: 'OPEN',
  priority: 'MEDIUM',
  dueAt: overdue ? '2026-10-10T09:00:00Z' : '2026-10-20T09:00:00Z',
  assignee: assignee ? { userId: id, displayName: assignee, email: `${id}@demo.test` } : undefined,
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-01T09:00:00Z',
  version: 1,
});
const lead = (id: number, firstName: string, followUpDate: string): Lead => ({
  id,
  firstName,
  lastName: 'Park',
  followUpDate,
  status: 'NEW',
  priority: 'MEDIUM',
  archived: false,
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-01T09:00:00Z',
  version: 1,
});

// A fixed response: 25 overdue tasks of which the API gives the first two, one upcoming task and
// every due lead.
const REPORT: Props['report'] = {
  overdueTasks: {
    count: 25,
    first: [task(5, 'Send the contract', true, 'Riley Rep'), task(6, 'Call Acme', true)],
  },
  upcomingTasks: { count: 1, first: [task(9, 'Prepare the demo', false, 'Sam Seller')] },
  dueLeads: { count: 1, first: [lead(3, 'Noa', '2026-10-17')] },
};

const MIA = { userId: 12, displayName: 'Mia Rossi', email: 'mia@demo.test' };

const report = async (value: Props['report'], locale: 'en' | 'fr' = 'en', owner?: Props['owner']) =>
  await render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'fr' ? fr : en}
      timeZone="Asia/Bangkok"
    >
      <FollowUpReport
        report={value}
        workspace={{ id: 7, timezone: 'Asia/Bangkok' }}
        today="2026-10-18"
        owner={owner}
      />
    </NextIntlClientProvider>,
  );

const group = (name: string) => page.getByRole('region', { name });
const style = (element: Element) => getComputedStyle(element);

describe(FollowUpReport, () => {
  it("sets who holds an item in the secondary size and ink, under the item's title", async () => {
    await report({
      ...REPORT,
      dueLeads: {
        count: 1,
        first: [
          {
            ...lead(3, 'Noa', '2026-10-17'),
            owner: { userId: 4, displayName: 'Morgan Manager', email: '4@demo.test' },
          },
        ],
      },
    });
    const muted = style(page.getByText('T-0005').element()).color;

    for (const [name, title] of [
      ['Riley Rep', 'Send the contract'],
      ['Morgan Manager', 'Noa Park'],
    ] as const) {
      const member = style(page.getByText(name, { exact: true }).element());
      expect(member.fontSize).toBe('14px');
      expect(member.color).toBe(muted);
      expect(style(page.getByRole('link', { name: title }).element()).fontSize).toBe('15px');
    }
  });

  it('shows the three groups with the workspace-wide counts as sent', async () => {
    await report(REPORT);

    await expect.element(group('Overdue tasks')).toHaveTextContent('25');
    await expect.element(group('Upcoming tasks')).toHaveTextContent('1');
    await expect.element(group('Leads to follow up')).toHaveTextContent('1');
  });

  it('lists the first items as links to the records', async () => {
    await report(REPORT);

    await expect
      .element(group('Overdue tasks').getByRole('link', { name: 'Send the contract' }))
      .toHaveAttribute('href', '/app/7/tasks/5');
    await expect
      .element(group('Upcoming tasks').getByRole('link', { name: 'Prepare the demo' }))
      .toHaveAttribute('href', '/app/7/tasks/9');
    await expect
      .element(group('Leads to follow up').getByRole('link', { name: 'Noa Park' }))
      .toHaveAttribute('href', '/app/7/leads/3');
    await expect.element(group('Overdue tasks')).toHaveTextContent('Riley Rep');
  });

  it('says how many more there are, with a link to the filtered list, only when there are', async () => {
    await report(REPORT);

    await expect
      .element(group('Overdue tasks').getByRole('link', { name: 'and 23 more' }))
      .toHaveAttribute('href', '/app/7/tasks?view=overdue');
    expect(group('Upcoming tasks').getByRole('link', { name: /more/u }).elements()).toHaveLength(0);
    expect(
      group('Leads to follow up').getByRole('link', { name: /more/u }).elements(),
    ).toHaveLength(0);
  });

  it('links the rest of the due leads to the open leads due up to today, the oldest first', async () => {
    await report({
      ...REPORT,
      dueLeads: { count: 21, first: [lead(3, 'Noa', '2026-10-17')] },
    });

    await expect
      .element(group('Leads to follow up').getByRole('link', { name: 'and 20 more' }))
      .toHaveAttribute(
        'href',
        '/app/7/leads?status=NEW&status=CONTACTED&status=QUALIFIED&followUpBefore=2026-10-18&sort=FOLLOW_UP_DATE&direction=ASC',
      );
  });

  it('says so for a group with nothing in it', async () => {
    await report({
      overdueTasks: { count: 0, first: [] },
      upcomingTasks: { count: 0, first: [] },
      dueLeads: { count: 0, first: [] },
    });

    await expect.element(page.getByText('No overdue tasks.')).toBeVisible();
    await expect.element(page.getByText('Nothing due in the next 7 days.')).toBeVisible();
    await expect.element(page.getByText('No leads to follow up.')).toBeVisible();
  });

  it('names the member it counts in a group with nothing of theirs', async () => {
    await report(
      {
        overdueTasks: { count: 0, first: [] },
        upcomingTasks: { count: 0, first: [] },
        dueLeads: { count: 0, first: [] },
      },
      'en',
      MIA,
    );

    await expect.element(page.getByText('No overdue tasks assigned to Mia Rossi.')).toBeVisible();
    await expect
      .element(page.getByText('Nothing assigned to Mia Rossi is due in the next 7 days.'))
      .toBeVisible();
    await expect.element(page.getByText('No leads owned by Mia Rossi to follow up.')).toBeVisible();
  });

  it("links the rest to the member's own tasks and leads", async () => {
    await report(
      { ...REPORT, dueLeads: { count: 21, first: [lead(3, 'Noa', '2026-10-17')] } },
      'en',
      MIA,
    );

    await expect
      .element(group('Overdue tasks').getByRole('link', { name: 'and 23 more' }))
      .toHaveAttribute('href', '/app/7/tasks?view=overdue&assigneeId=12');
    await expect
      .element(group('Leads to follow up').getByRole('link', { name: 'and 20 more' }))
      .toHaveAttribute(
        'href',
        '/app/7/leads?status=NEW&status=CONTACTED&status=QUALIFIED&followUpBefore=2026-10-18&sort=FOLLOW_UP_DATE&direction=ASC&ownerId=12',
      );
  });

  it('writes the groups in the page language', async () => {
    await report(REPORT, 'fr');

    await expect.element(group('Tâches en retard')).toHaveTextContent('25');
    await expect
      .element(group('Tâches en retard').getByRole('link', { name: 'et 23 de plus' }))
      .toBeVisible();
  });
});
