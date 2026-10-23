import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { cancelTask, completeTask, reopenTask } from '@/actions/crm/TaskActions';
import type { components } from '@/libs/api/schema';
import en from '@/locales/en.json';
import { FollowUps } from './FollowUps';

type Props = Parameters<typeof FollowUps>[0];
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

const props = (extra: Partial<Props> = {}): Props => ({
  workspace: { id: 1, timezone: 'Asia/Bangkok', permissions: [] },
  me: 3,
  overdue: [task(1, 'Send the proposal', { overdue: true, dueAt: '2026-10-10T02:00:00Z' })],
  upcoming: [task(2, 'Call Globex'), task(3, 'Prepare the demo')],
  leads: [
    {
      id: 5,
      firstName: 'Noa',
      lastName: 'Park',
      followUpDate: '2026-10-01',
      status: 'CONTACTED',
    },
  ],
  ...extra,
});

const lead = (id: number) => ({
  id,
  firstName: 'Noa',
  lastName: `Park ${id}`,
  followUpDate: '2026-10-01',
  status: 'CONTACTED' as const,
});

const followUps = async (value: Props) =>
  await render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <FollowUps {...value} />
    </NextIntlClientProvider>,
  );

describe(FollowUps, () => {
  it('groups the overdue tasks, the ones coming up and the leads to follow up, each with its count', async () => {
    await followUps(props());

    await expect.element(page.getByRole('heading', { name: 'My overdue tasks 1' })).toBeVisible();
    await expect.element(page.getByRole('heading', { name: 'My upcoming tasks 2' })).toBeVisible();
    await expect
      .element(page.getByRole('heading', { name: 'My leads to follow up 1' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Send the proposal' }))
      .toHaveAttribute('href', '/app/1/tasks/1');
    await expect
      .element(page.getByRole('link', { name: 'Noa Park' }))
      .toHaveAttribute('href', '/app/1/leads/5');
    await expect.element(page.getByText('L-0005')).toBeVisible();
  });

  it('gives each task its complete box, and marks an overdue one in words', async () => {
    await followUps(props());

    await expect
      .element(page.getByRole('checkbox', { name: 'Complete Send the proposal' }))
      .toBeVisible();
    await expect.element(page.getByText('Overdue', { exact: true }).first()).toBeVisible();
  });

  it('counts a list the API may have cut with a plus', async () => {
    const eight = Array.from({ length: 8 }, (_, index) => task(10 + index, `Task ${index}`));
    await followUps(props({ upcoming: eight }));

    await expect.element(page.getByRole('heading', { name: 'My upcoming tasks 8+' })).toBeVisible();
  });

  it("counts the leads as the bell does: a list of 20, the reminders' cut, with a plus", async () => {
    const eight = await followUps(props({ leads: Array.from({ length: 8 }, (_, id) => lead(id)) }));
    // The tasks' cut is 8; the leads' is 20.
    await expect
      .element(page.getByRole('heading', { name: 'My leads to follow up 8', exact: true }))
      .toBeVisible();
    await eight.unmount();

    await followUps(props({ leads: Array.from({ length: 20 }, (_, id) => lead(id)) }));
    await expect
      .element(page.getByRole('heading', { name: 'My leads to follow up 20+' }))
      .toBeVisible();
  });

  it('says so for an empty group, and that the leads could not be read when they could not', async () => {
    await followUps(props({ overdue: [], upcoming: [], leads: undefined }));

    await expect.element(page.getByText('No overdue tasks.')).toBeVisible();
    await expect.element(page.getByText('Nothing coming up.')).toBeVisible();
    await expect.element(page.getByText('Lead follow-ups could not be loaded.')).toBeVisible();
  });

  it("links to all of the caller's tasks", async () => {
    await followUps(props());

    await expect
      .element(page.getByRole('link', { name: 'All my tasks' }))
      .toHaveAttribute('href', '/app/1/tasks?assigneeId=3');
  });
});
