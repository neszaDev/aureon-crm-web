import { NextIntlClientProvider } from 'next-intl';
import { createContext, useContext } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { loadReminders } from '@/actions/crm/ReminderActions';
import type { cancelTask, completeTask, reopenTask } from '@/actions/crm/TaskActions';
import * as TaskActions from '@/actions/crm/TaskActions';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { components } from '@/libs/api/schema';
import type { BellReminders } from '@/libs/crm/Reminders';
import messages from '@/locales/en.json';
import { RemindersBell } from './RemindersBell';

type Reminders = BellReminders;
type Task = components['schemas']['TaskResponse'];
type Lead = components['schemas']['LeadResponse'];

vi.mock(import('@/actions/crm/ReminderActions'), () => ({
  loadReminders: vi.fn<typeof loadReminders>(),
}));
// The path is the test's to change; a context makes the bell render again when it does, as the
// router's own hook does.
const PathContext = createContext('/app/1');
vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: () => useContext(PathContext),
}));
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
// Read on 19 October in the workspace's zone.
const REMINDERS: Reminders = {
  overdueTasks: [LATE],
  dueSoonTasks: [SOON],
  followUpLeads: [LEAD],
  today: '2026-10-19',
};
const NONE: Reminders = {
  overdueTasks: [],
  dueSoonTasks: [],
  followUpLeads: [],
  today: '2026-10-19',
};

const Bell = (props: { reminders?: Reminders; path?: string }) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <TooltipProvider>
      <PathContext value={props.path ?? '/app/1'}>
        <RemindersBell
          workspaceId={1}
          me={3}
          timeZone="Asia/Bangkok"
          reminders={props.reminders}
          side="right"
        />
      </PathContext>
    </TooltipProvider>
    <Toaster />
  </NextIntlClientProvider>
);

const bell = (name: string | RegExp) => page.getByRole('button', { name });
const pause = async (ms: number) => {
  const { promise, resolve } = Promise.withResolvers<undefined>();
  setTimeout(resolve, ms);
  await promise;
};

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
      .toHaveAttribute('href', expect.stringContaining('/app/1/tasks?assigneeId=3'));
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

// What the action answers when the backend failed.
const NOTHING: Awaited<ReturnType<typeof loadReminders>> = undefined;

describe('the bell refreshing itself', () => {
  // The layout's reminders are only as new as its last render, which a soft navigation doesn't
  // repeat: the bell asks again.
  const FRESH: Reminders = {
    ...REMINDERS,
    dueSoonTasks: [SOON, task(44, 'Renew the contract')],
  };

  beforeEach(() => {
    vi.mocked(loadReminders).mockReset();
  });

  it('asks again once for each navigation, not on the first paint, and shows the new count', async () => {
    vi.mocked(loadReminders).mockResolvedValue(FRESH);
    const { rerender } = await render(<Bell reminders={REMINDERS} />);
    await expect.element(bell('Reminders: 3')).toBeVisible();
    expect(loadReminders).not.toHaveBeenCalled();

    await rerender(<Bell path="/app/1/tasks" reminders={REMINDERS} />);

    await expect.element(bell('Reminders: 4')).toBeVisible();
    // The same page rendering again asks nothing more.
    await rerender(<Bell path="/app/1/tasks" reminders={REMINDERS} />);
    await pause(100);
    expect(loadReminders).toHaveBeenCalledExactlyOnceWith(1, 'Asia/Bangkok');
  });

  it('asks again when the tab comes back into view, and not when it goes out of it', async () => {
    vi.mocked(loadReminders).mockResolvedValue(FRESH);
    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    await render(<Bell reminders={REMINDERS} />);

    visibility.mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    await pause(100);
    expect(loadReminders).not.toHaveBeenCalled();

    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    await expect.element(bell('Reminders: 4')).toBeVisible();
    expect(loadReminders).toHaveBeenCalledExactlyOnceWith(1, 'Asia/Bangkok');
    visibility.mockRestore();
  });

  it.each([
    ['the backend fails', () => vi.mocked(loadReminders).mockResolvedValue(NOTHING)],
    [
      'the request never gets through',
      () => vi.mocked(loadReminders).mockRejectedValue(new Error('Failed to fetch')),
    ],
  ])('keeps the count it has when %s', async (_, fail) => {
    fail();
    const { rerender } = await render(<Bell reminders={REMINDERS} />);

    await rerender(<Bell path="/app/1/tasks" reminders={REMINDERS} />);
    await expect.poll(() => vi.mocked(loadReminders).mock.calls.length).toBe(1);
    await pause(100);

    await expect.element(bell('Reminders: 3')).toBeVisible();
  });

  it('lets a page that refreshed meanwhile beat an older answer, and a newer page an answer it had', async () => {
    const slow = Promise.withResolvers<Reminders>();
    vi.mocked(loadReminders).mockReturnValueOnce(slow.promise);
    const { rerender } = await render(<Bell reminders={REMINDERS} />);
    await rerender(<Bell path="/app/1/tasks" reminders={REMINDERS} />);
    await expect.poll(() => vi.mocked(loadReminders).mock.calls.length).toBe(1);

    // An action refreshed the page (the task was completed) while the request was out.
    await rerender(<Bell path="/app/1/tasks" reminders={{ ...REMINDERS, overdueTasks: [] }} />);
    slow.resolve(FRESH);
    await pause(100);
    await expect.element(bell('Reminders: 2')).toBeVisible();

    // And the other way round: an answer shows until the page renders its own, newer reminders.
    vi.mocked(loadReminders).mockResolvedValueOnce(FRESH);
    await rerender(<Bell path="/app/1/leads" reminders={{ ...REMINDERS, overdueTasks: [] }} />);
    await expect.element(bell('Reminders: 4')).toBeVisible();
    await rerender(
      <Bell
        path="/app/1/leads"
        reminders={{ ...REMINDERS, overdueTasks: [], followUpLeads: [] }}
      />,
    );
    await expect.element(bell('Reminders: 1')).toBeVisible();
  });

  it('tells a late follow-up by the day the reminders were read, so it turns late past midnight', async () => {
    // Read on 1 October: the follow-up is due that day, not late.
    const first: Reminders = { ...NONE, followUpLeads: [LEAD], today: '2026-10-01' };
    vi.mocked(loadReminders).mockResolvedValue({ ...first, today: '2026-10-02' });
    const { rerender } = await render(<Bell reminders={first} />);
    await bell('Reminders: 1').click();
    const leads = page.getByRole('region', { name: /Leads to follow up/u });
    await expect.element(leads.getByText('Oct 1, 2026')).toBeVisible();
    expect(leads.getByText('Overdue', { exact: true }).elements()).toHaveLength(0);

    // Asked again on the 2nd: the same lead, now late.
    await rerender(<Bell path="/app/1/tasks" reminders={first} />);

    await expect.element(leads.getByText('Overdue', { exact: true })).toBeVisible();
  });

  it('drops an answer that comes after a newer request was made', async () => {
    const slow = Promise.withResolvers<Reminders>();
    vi.mocked(loadReminders).mockReturnValueOnce(slow.promise).mockResolvedValueOnce(FRESH);
    const { rerender } = await render(<Bell reminders={REMINDERS} />);
    await rerender(<Bell path="/app/1/tasks" reminders={REMINDERS} />);
    await rerender(<Bell path="/app/1/leads" reminders={REMINDERS} />);
    await expect.element(bell('Reminders: 4')).toBeVisible();

    slow.resolve({ ...FRESH, followUpLeads: [] });
    await pause(100);

    await expect.element(bell('Reminders: 4')).toBeVisible();
  });
});
