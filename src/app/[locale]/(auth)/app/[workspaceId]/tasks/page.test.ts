import { describe, expect, it, vi } from 'vitest';
import { getTasks, getUndatedTasks } from '@/libs/api/CrmQueries';
import { redirect } from '@/libs/I18nNavigation';
import TasksPage from './page';

vi.mock(import('server-only'), () => ({}));
// @ts-expect-error -- a translator that gives the key back
vi.mock(import('next-intl/server'), () => ({
  getTranslations: async () => await Promise.resolve((key: string) => key),
  setRequestLocale: vi.fn<() => void>(),
}));
// @ts-expect-error -- stand-ins for only what the page reads
vi.mock(import('@/libs/api/CrmQueries'), () => ({
  TASK_LIST: {
    sorts: ['DUE_AT', 'PRIORITY'],
    defaultSort: 'DUE_AT',
    filters: { view: { enum: ['completed', 'mine'] }, assigneeId: 'id' },
    groups: ['due'],
    defaultGroup: 'due',
  },
  getTasks: vi.fn<typeof getTasks>(),
  getUndatedTasks: vi.fn<typeof getUndatedTasks>(),
  getMembers: async () =>
    await Promise.resolve({ members: [{ userId: 1, email: 'mia@acme.test' }] }),
}));
// @ts-expect-error -- only what the page reads
vi.mock(import('@/libs/api/Queries'), () => ({
  getCurrentUser: async () => await Promise.resolve({ user: { id: 1, email: 'mia@acme.test' } }),
}));
// @ts-expect-error -- only what the page reads
vi.mock(import('@/libs/crm/OpenWorkspace'), () => ({
  getOpenWorkspace: async () =>
    await Promise.resolve({ workspace: { id: 1, timezone: 'UTC', permissions: [] } }),
}));
vi.mock(import('@/libs/api/Session'), () => ({}));
// Their real modules need Next's runtime.
vi.mock(import('@/libs/I18nNavigation'), () => ({ redirect: vi.fn<typeof redirect>() }));
vi.mock(import('@/libs/crm/PageMetadata'), () => ({}));
vi.mock(import('@/actions/crm/TaskActions'), () => ({}));

const PAGE = { content: [], totalElements: 0, totalPages: 0 };
const FLAGS = { unauthorized: false, forbidden: false, notFound: false, invalid: false };
const params = Promise.resolve({ locale: 'en', workspaceId: '1' });

describe(TasksPage, () => {
  it('reads each due section on its own, at most 50 rows, the undated ones from the end', async () => {
    // @ts-expect-error -- only what the page reads
    vi.mocked(getTasks).mockResolvedValue({ ...FLAGS, tasks: PAGE });
    // @ts-expect-error -- only what the page reads
    vi.mocked(getUndatedTasks).mockResolvedValue({ ...FLAGS, tasks: PAGE });

    await TasksPage({ params, searchParams: Promise.resolve({ q: 'quote', page: '2' }) });

    const reads = vi.mocked(getTasks).mock.calls.map(([, query]) => query);
    // Overdue, today, the week, later, completed and cancelled; no ungrouped read.
    expect(reads.map((query) => query.status)).toStrictEqual([
      ['OPEN'],
      ['OPEN'],
      ['OPEN'],
      ['OPEN'],
      ['COMPLETED'],
      ['CANCELLED'],
    ]);
    expect(
      reads.every((query) => query.page === 0 && query.size === 50 && query.q === 'quote'),
    ).toBeTruthy();
    expect(getUndatedTasks).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ q: 'quote', page: 0, size: 50 }),
      expect.any(String),
    );
  });

  it('sends an old My tasks link to the list filtered to the caller', async () => {
    await TasksPage({ params, searchParams: Promise.resolve({ view: 'mine' }) });

    expect(redirect).toHaveBeenCalledWith({ href: '/app/1/tasks?assigneeId=1', locale: 'en' });
  });
});
