import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { cancelTask, completeTask, reopenTask } from '@/actions/crm/TaskActions';
import type { components } from '@/libs/api/schema';
import en from '@/locales/en.json';
import { MyWork } from './MyWork';

type Props = Parameters<typeof MyWork>[0];
type Task = components['schemas']['TaskResponse'];

// The rows import the task actions.
vi.mock(import('@/actions/crm/TaskActions'), () => ({
  completeTask: vi.fn<typeof completeTask>(),
  reopenTask: vi.fn<typeof reopenTask>(),
  cancelTask: vi.fn<typeof cancelTask>(),
}));

const ME = { userId: 3, email: 'riley@acme.test', displayName: 'Riley Rep' };
const task = (id: number, title: string, extra: Partial<Task> = {}): Task => ({
  id,
  title,
  priority: 'MEDIUM',
  status: 'OPEN',
  overdue: false,
  dueAt: '2026-10-20T02:00:00Z',
  assignee: ME,
  createdBy: ME,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  version: 3,
  ...extra,
});

// Now is 19 October, 10:00 in Bangkok: today ends at 17:00 UTC, the week a week from now.
const BOUNDS = {
  now: '2026-10-19T03:00:00Z',
  tomorrow: '2026-10-19T17:00:00Z',
  week: '2026-10-26T03:00:00Z',
};

const lead = (id: number) => ({
  id,
  firstName: 'Noa',
  lastName: `Park ${id}`,
  followUpDate: '2026-10-01',
  status: 'CONTACTED' as const,
});

const props = (extra: Partial<Props> = {}): Props => ({
  workspace: { id: 1, timezone: 'Asia/Bangkok', permissions: [] },
  me: 3,
  overdue: [task(1, 'Send the proposal', { overdue: true, dueAt: '2026-10-10T02:00:00Z' })],
  upcoming: [
    task(2, 'Call Globex', { dueAt: '2026-10-19T09:00:00Z' }),
    task(3, 'Prepare the demo', { dueAt: '2026-10-21T02:00:00Z' }),
    // Past the week: on the Tasks page, not here.
    task(4, 'Plan the quarter', { dueAt: '2026-11-02T02:00:00Z' }),
  ],
  leads: [{ ...lead(5), lastName: 'Park' }],
  bounds: BOUNDS,
  today: '2026-10-19',
  ...extra,
});

const myWork = async (value: Props) =>
  await render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <MyWork {...value} />
    </NextIntlClientProvider>,
  );

// A section's heading: its pill (read as "Due: Overdue") and its count in words.
const section = (name: string) =>
  page.getByRole('heading', { name: new RegExp(`^Due: ${name}`, 'u') });

describe(MyWork, () => {
  it('groups the tasks as the Tasks page does, overdue, today and the next 7 days, each with its count', async () => {
    await myWork(props());

    await expect.element(section('Overdue')).toHaveTextContent(/1 task$/u);
    await expect.element(section('Today')).toHaveTextContent(/1 task$/u);
    await expect.element(section('Next 7 days')).toHaveTextContent(/1 task$/u);
    await expect
      .element(page.getByRole('link', { name: 'Send the proposal' }))
      .toHaveAttribute('href', '/app/1/tasks/1');
    await expect.element(page.getByRole('link', { name: 'Call Globex' })).toBeVisible();
    await expect.element(page.getByRole('link', { name: 'Prepare the demo' })).toBeVisible();
    expect(page.getByText('Plan the quarter').elements()).toHaveLength(0);
  });

  it('gives each task its complete box, and marks an overdue one in words', async () => {
    await myWork(props());

    await expect
      .element(page.getByRole('checkbox', { name: 'Complete Send the proposal' }))
      .toBeVisible();
    await expect.element(page.getByText('Overdue', { exact: true }).first()).toBeVisible();
  });

  it('lists the leads to follow up, linking to each', async () => {
    await myWork(props());

    await expect
      .element(page.getByRole('heading', { name: 'Leads to follow up 1 lead' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Noa Park' }))
      .toHaveAttribute('href', '/app/1/leads/5');
    await expect.element(page.getByText('L-0005')).toBeVisible();
  });

  it('counts with a plus the section the API may have cut: the full overdue list, the last of the upcoming one', async () => {
    const eight = (from: number, dueAt: string, overdue = false) =>
      Array.from({ length: 8 }, (_, index) =>
        task(from + index, `Task ${from + index}`, { dueAt, overdue }),
      );
    await myWork(
      props({
        overdue: eight(10, '2026-10-10T02:00:00Z', true),
        upcoming: [
          ...eight(20, '2026-10-19T09:00:00Z').slice(0, 2),
          ...eight(30, '2026-10-22T02:00:00Z').slice(0, 6),
        ],
      }),
    );

    await expect.element(section('Overdue')).toHaveTextContent(/8\+.*8 tasks or more$/u);
    // Today's two came before the cut; the week's six may be followed by more.
    await expect.element(section('Today')).toHaveTextContent(/2 tasks$/u);
    await expect.element(section('Next 7 days')).toHaveTextContent(/6\+.*6 tasks or more$/u);
  });

  it("counts the leads as the inbox does: a list of 20, the reminders' cut, with a plus", async () => {
    await myWork(props({ leads: Array.from({ length: 20 }, (_, id) => lead(id)) }));

    await expect
      .element(page.getByRole('heading', { name: 'Leads to follow up 20 leads or more' }))
      .toBeVisible();
  });

  it('says so when nothing is due this week, and that the leads could not be read when they could not', async () => {
    await myWork(props({ overdue: [], upcoming: [], leads: undefined }));

    await expect
      .element(page.getByText('Nothing due in the next 7 days.', { exact: false }))
      .toHaveTextContent('Nothing due in the next 7 days. Add a task');
    await expect
      .element(page.getByRole('link', { name: 'Add a task' }))
      .toHaveAttribute('href', '/app/1/tasks?new=1');
    await expect.element(page.getByText('Lead follow-ups could not be loaded.')).toBeVisible();
  });

  it("links to all of the caller's tasks", async () => {
    await myWork(props());

    await expect
      .element(page.getByRole('link', { name: 'All my tasks' }))
      .toHaveAttribute('href', '/app/1/tasks?assigneeId=3');
  });
});
