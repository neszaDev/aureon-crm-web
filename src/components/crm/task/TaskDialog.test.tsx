import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { searchRecords } from '@/actions/crm/RecordSearchActions';
import * as RecordSearchActions from '@/actions/crm/RecordSearchActions';
import type { createTask, updateTask } from '@/actions/crm/TaskActions';
import * as TaskActions from '@/actions/crm/TaskActions';
import type { components } from '@/libs/api/schema';
import messages from '@/locales/en.json';
import { TaskDialog } from './TaskDialog';

type Task = components['schemas']['TaskResponse'];

vi.mock(import('@/actions/crm/TaskActions'), () => ({
  createTask: vi.fn<typeof createTask>(),
  updateTask: vi.fn<typeof updateTask>(),
}));
vi.mock(import('@/actions/crm/RecordSearchActions'), () => ({
  searchRecords: vi.fn<typeof searchRecords>(),
}));

const MIA = { userId: 1, email: 'mia@acme.test', displayName: 'Mia Manager' };

// Company Acme comes from the contact Pat, whose company it is: the backend derived it.
const TASK: Task = {
  id: 42,
  title: 'Send the proposal',
  priority: 'HIGH',
  status: 'OPEN',
  overdue: false,
  assignee: MIA,
  company: { id: 7, name: 'Acme' },
  contact: { id: 9, fullName: 'Pat Buyer' },
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  version: 3,
};

const openDialog = async (task: Task) => {
  vi.mocked(TaskActions.updateTask).mockResolvedValue({ ok: true });
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <TaskDialog
        trigger={<button type="button">Edit</button>}
        workspaceId={1}
        task={task}
        members={[MIA]}
        me={MIA.userId}
        canAssign
        timeZone="UTC"
      />
    </NextIntlClientProvider>,
  );
  await page.getByRole('button', { name: 'Edit' }).click();
};

const save = async () => {
  await page.getByRole('button', { name: 'Save changes' }).click();
  await vi.waitFor(() => {
    expect(TaskActions.updateTask).toHaveBeenCalledOnce();
  });
};

const sentBody = () => vi.mocked(TaskActions.updateTask).mock.calls[0]?.[3];

describe(TaskDialog, () => {
  it('sends no company when Company is untouched under a contact, so the backend derives it again', async () => {
    vi.mocked(TaskActions.updateTask).mockClear();
    await openDialog(TASK);

    await save();

    expect(sentBody()).toMatchObject({ companyId: null, contactId: 9 });
  });

  it('keeps an untouched company when no contact or deal sets it', async () => {
    vi.mocked(TaskActions.updateTask).mockClear();
    await openDialog({ ...TASK, contact: undefined });

    await save();

    expect(sentBody()).toMatchObject({ companyId: 7, contactId: null });
  });

  it('sends the company that was picked, even under a contact', async () => {
    vi.mocked(TaskActions.updateTask).mockClear();
    vi.mocked(RecordSearchActions.searchRecords).mockResolvedValue([{ id: 8, label: 'Globex' }]);
    await openDialog(TASK);

    await page.getByRole('combobox', { name: 'Company' }).click();
    await userEvent.keyboard('glo');
    await page.getByRole('option', { name: /Globex/u }).click();
    await save();

    expect(sentBody()).toMatchObject({ companyId: 8, contactId: 9 });
  });

  it('marks a picker invalid when the backend refuses the record it holds', async () => {
    vi.mocked(TaskActions.updateTask).mockClear();
    await openDialog(TASK);
    vi.mocked(TaskActions.updateTask).mockResolvedValue({
      ok: false,
      message: 'Check the highlighted fields and try again.',
      fieldErrors: { contactId: 'is not in this workspace' },
    });

    await save();

    await expect
      .element(page.getByRole('combobox', { name: 'Contact' }))
      .toHaveAttribute('aria-invalid', 'true');
  });
});
