import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { cancelTask, completeTask, reopenTask } from '@/actions/crm/TaskActions';
import * as TaskActions from '@/actions/crm/TaskActions';
import { Toaster } from '@/components/ui/sonner';
import { Table, TableBody } from '@/components/ui/table';
import type { components } from '@/libs/api/schema';
import messages from '@/locales/en.json';
import { TaskRow } from './TaskRow';

type Task = components['schemas']['TaskResponse'];

vi.mock(import('@/actions/crm/TaskActions'), () => ({
  completeTask: vi.fn<typeof completeTask>(),
  reopenTask: vi.fn<typeof reopenTask>(),
  cancelTask: vi.fn<typeof cancelTask>(),
}));

const TASK: Task = {
  id: 42,
  title: 'Send the proposal',
  priority: 'HIGH',
  status: 'OPEN',
  overdue: false,
  dueAt: '2026-10-20T02:00:00Z',
  assignee: { userId: 1, email: 'mia@acme.test', displayName: 'Mia Manager' },
  company: { id: 7, name: 'Acme' },
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  version: 3,
};

const renderRow = async (task: Task) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <Table>
        <TableBody>
          <TaskRow
            task={task}
            workspaceId={1}
            canEdit
            timeZone="Asia/Bangkok"
            headingId="tasks-heading"
          />
        </TableBody>
      </Table>
      <Toaster />
    </NextIntlClientProvider>,
  );
};

const checkbox = () => page.getByRole('checkbox', { name: 'Complete Send the proposal' });
const menu = () => page.getByRole('button', { name: 'More actions for Send the proposal' });

describe(TaskRow, () => {
  it('completes an open task with the version it was read at, ticked at once', async () => {
    const answer = Promise.withResolvers<{ ok: boolean }>();
    vi.mocked(TaskActions.completeTask).mockReturnValue(answer.promise);
    await renderRow(TASK);

    await checkbox().click();

    expect(TaskActions.completeTask).toHaveBeenCalledWith(1, 42, 3);
    await expect.element(checkbox()).toBeChecked();
    answer.resolve({ ok: true });
  });

  it('un-ticks the box and says why when completing fails', async () => {
    const answer = Promise.withResolvers<{ ok: boolean; message: string }>();
    vi.mocked(TaskActions.completeTask).mockReturnValue(answer.promise);
    await renderRow(TASK);

    await checkbox().click();
    // Ticked at once, before the answer.
    await expect.element(checkbox()).toBeChecked();
    answer.resolve({ ok: false, message: "This task's status changed meanwhile." });

    await expect.element(page.getByText("This task's status changed meanwhile.")).toBeVisible();
    await expect.element(checkbox()).not.toBeChecked();
  });

  it('offers a reload when the task changed meanwhile', async () => {
    vi.mocked(TaskActions.completeTask).mockResolvedValue({
      ok: false,
      message: "This task's status changed meanwhile. Reload to see it.",
      conflict: true,
    });
    await renderRow(TASK);

    await checkbox().click();

    await expect.element(page.getByRole('button', { name: 'Reload' })).toBeVisible();
  });

  it('offers Reopen only on a completed or cancelled task, and Cancel only on an open one', async () => {
    await renderRow(TASK);

    await menu().click();
    await expect.element(page.getByRole('menuitem', { name: 'Cancel task' })).toBeVisible();
    expect(page.getByRole('menuitem', { name: 'Reopen' }).elements()).toHaveLength(0);
  });

  it('offers Reopen on a completed task', async () => {
    await renderRow({ ...TASK, status: 'COMPLETED', completedAt: '2026-10-19T00:00:00Z' });

    await menu().click();
    await expect.element(page.getByRole('menuitem', { name: 'Reopen' })).toBeVisible();
    expect(page.getByRole('menuitem', { name: 'Cancel task' }).elements()).toHaveLength(0);
  });

  it('marks an overdue task in words, not colour alone', async () => {
    await renderRow({ ...TASK, overdue: true, dueAt: '2026-10-10T02:00:00Z' });

    await expect.element(page.getByText('Overdue', { exact: false })).toBeVisible();
  });
});
