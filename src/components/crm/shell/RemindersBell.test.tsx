import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { cancelTask, completeTask, reopenTask } from '@/actions/crm/TaskActions';
import * as TaskActions from '@/actions/crm/TaskActions';
import { Toaster } from '@/components/ui/sonner';
import type { components } from '@/libs/api/schema';
import messages from '@/locales/en.json';
import { RemindersBell } from './RemindersBell';

type Reminders = components['schemas']['RemindersResponse'];
type Task = components['schemas']['TaskResponse'];
type Lead = components['schemas']['LeadResponse'];

// `TaskDue` comes from the task row, which imports all three.
vi.mock(import('@/actions/crm/TaskActions'), () => ({
  completeTask: vi.fn<typeof completeTask>(),
  reopenTask: vi.fn<typeof reopenTask>(),
  cancelTask: vi.fn<typeof cancelTask>(),
}));

const task = (id: number, title: string, extra: Partial<Task> = {}): Task => ({
  id,
  title,
  priority: 'MEDIUM',
  status: 'OPEN',
  overdue: false,
  dueAt: '2026-10-20T02:00:00Z',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  version: 3,
  ...extra,
});
const LATE = task(42, 'Send the proposal', { overdue: true, dueAt: '2026-10-10T02:00:00Z' });
const SOON = task(43, 'Call Globex', { dueAt: '2026-10-19T09:30:00Z' });
const LEAD: Lead = {
  id: 5,
  firstName: 'Noa',
  lastName: 'Park',
  companyName: 'Initech',
  followUpDate: '2026-10-01',
  status: 'CONTACTED',
  priority: 'MEDIUM',
  archived: false,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  version: 1,
};
const REMINDERS: Reminders = { overdueTasks: [LATE], dueSoonTasks: [SOON], followUpLeads: [LEAD] };
const NONE: Reminders = { overdueTasks: [], dueSoonTasks: [], followUpLeads: [] };

const Bell = (props: { reminders?: Reminders }) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <RemindersBell workspaceId={1} timeZone="Asia/Bangkok" reminders={props.reminders} />
    <Toaster />
  </NextIntlClientProvider>
);

const bell = (name: string | RegExp) => page.getByRole('button', { name });

describe(RemindersBell, () => {
  it('hides the badge at 0 and says so in its label', async () => {
    await render(<Bell reminders={NONE} />);

    await expect.element(bell('Reminders: 0')).toBeVisible();
    // The badge is the button's only text.
    expect(bell('Reminders: 0').element().textContent).toBe('');
  });

  it('counts the overdue tasks, the tasks due soon and the leads to follow up', async () => {
    await render(<Bell reminders={REMINDERS} />);

    await expect.element(bell('Reminders: 3')).toHaveTextContent('3');
  });

  it('shows "20+" when a list is at the cap, since there may be more', async () => {
    const full = Array.from({ length: 20 }, (_, index) => task(100 + index, `Task ${index}`));
    await render(<Bell reminders={{ ...NONE, dueSoonTasks: full, followUpLeads: [LEAD] }} />);

    await expect.element(bell('Reminders: 21+')).toBeVisible();
    await bell('Reminders: 21+').click();
    await expect.element(page.getByText('20+', { exact: true })).toBeVisible();
  });

  it('lists the three groups, each item linking to its record, with due times in the workspace zone', async () => {
    await render(<Bell reminders={REMINDERS} />);

    await bell('Reminders: 3').click();

    const popover = page.getByRole('dialog', { name: 'Reminders' });
    await expect.element(popover.getByRole('heading', { name: /Overdue tasks/u })).toBeVisible();
    await expect
      .element(popover.getByRole('heading', { name: /Due in the next 24 hours/u }))
      .toBeVisible();
    await expect
      .element(popover.getByRole('heading', { name: /Leads to follow up/u }))
      .toBeVisible();
    await expect
      .element(popover.getByRole('link', { name: 'Send the proposal' }))
      .toHaveAttribute('href', expect.stringContaining('/app/1/tasks/42'));
    await expect
      .element(popover.getByRole('link', { name: 'Noa Park' }))
      .toHaveAttribute('href', expect.stringContaining('/app/1/leads/5'));
    await expect.element(popover.getByText('T-0042')).toBeVisible();
    // 09:30 UTC on the 19th is 4:30 PM in Bangkok (the space before PM varies); the late task says
    // "Overdue" in words.
    await expect.element(popover.getByText(/Oct 19, 2026, 4:30.PM/u)).toBeVisible();
    await expect
      .element(
        popover
          .getByRole('region', { name: /Overdue tasks/u })
          .getByText('Overdue', { exact: true }),
      )
      .toBeVisible();
    // The lead's follow-up date, 1 October, is long past.
    await expect
      .element(
        popover.getByRole('region', { name: /Leads to follow up/u }).getByText('Oct 1, 2026'),
      )
      .toBeVisible();
    await expect
      .element(popover.getByRole('link', { name: 'All tasks' }))
      .toHaveAttribute('href', expect.stringContaining('/app/1/tasks?view=mine'));
  });

  it('says reminders appear in the app, and promises nothing else', async () => {
    await render(<Bell reminders={NONE} />);

    await bell('Reminders: 0').click();

    const popover = page.getByRole('dialog', { name: 'Reminders' });
    await expect.element(popover.getByText('Reminders appear here in the app.')).toBeVisible();
    await expect.element(popover.getByText('Nothing needs your attention.')).toBeVisible();
    await expect.element(popover.getByText(/e-?mail|push|calendar/iu)).not.toBeInTheDocument();
  });

  it('completes a task with the version it was read at, and the count follows when the page refreshes', async () => {
    const answer = Promise.withResolvers<{ ok: boolean }>();
    vi.mocked(TaskActions.completeTask).mockReturnValue(answer.promise);
    const { rerender } = await render(<Bell reminders={REMINDERS} />);
    await bell('Reminders: 3').click();

    await page.getByRole('checkbox', { name: 'Complete Send the proposal' }).click();

    expect(TaskActions.completeTask).toHaveBeenCalledWith(1, 42, 3);
    await expect
      .element(page.getByRole('checkbox', { name: 'Complete Send the proposal' }))
      .toBeChecked();
    // The action refreshes the page: the layout reads the reminders again, without the task.
    answer.resolve({ ok: true });
    await rerender(<Bell reminders={{ ...REMINDERS, overdueTasks: [] }} />);

    await expect.element(bell('Reminders: 2')).toHaveTextContent('2');
    expect(page.getByRole('link', { name: 'Send the proposal' }).elements()).toHaveLength(0);
  });

  it('un-ticks the box and says why when completing fails, the count unchanged', async () => {
    vi.mocked(TaskActions.completeTask).mockResolvedValue({
      ok: false,
      message: "This task's status changed meanwhile.",
    });
    await render(<Bell reminders={REMINDERS} />);
    await bell('Reminders: 3').click();

    await page.getByRole('checkbox', { name: 'Complete Send the proposal' }).click();

    await expect.element(page.getByText("This task's status changed meanwhile.")).toBeVisible();
    await expect
      .element(page.getByRole('checkbox', { name: 'Complete Send the proposal' }))
      .not.toBeChecked();
    await expect.element(bell('Reminders: 3')).toBeVisible();
  });

  it('says so, without a count, when the reminders could not be read', async () => {
    await render(<Bell />);

    expect(bell('Reminders').element().textContent).toBe('');
    await bell('Reminders').click();
    await expect
      .element(page.getByText("Couldn't load your reminders. Reload the page to try again."))
      .toBeVisible();
  });
});
