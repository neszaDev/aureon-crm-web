import { afterEach, describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import { redirectIfUnauthorized } from '@/libs/api/Session';
import { loadReminders } from './ReminderActions';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));
// Its real module needs Next's runtime; a 401 redirects to sign-in there.
vi.mock(import('@/libs/api/Session'), () => ({
  redirectIfUnauthorized: vi.fn<typeof redirectIfUnauthorized>(),
}));

const mockGet = (result: { data?: unknown; status: number }) => {
  const GET = vi.fn<() => Promise<unknown>>().mockResolvedValue({
    data: result.data,
    response: new Response(null, { status: result.status }),
  });
  // @ts-expect-error -- only the call this action makes
  vi.mocked(authedBackend).mockResolvedValue({ GET });
  return GET;
};

const TASK = {
  id: 42,
  title: 'Send the proposal',
  description: 'Not for the bell.',
  dueAt: '2026-10-10T02:00:00Z',
  overdue: true,
  version: 3,
};

describe(loadReminders, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the caller's reminders of the workspace, slimmed to what the bell shows, with the workspace's day", async () => {
    // 18:00 UTC on the 20th is already the 21st in Bangkok.
    vi.useFakeTimers({ now: new Date('2026-10-20T18:00:00Z'), toFake: ['Date'] });
    const GET = mockGet({
      status: 200,
      data: { overdueTasks: [TASK], dueSoonTasks: [], followUpLeads: [] },
    });

    await expect(loadReminders(7, 'Asia/Bangkok')).resolves.toStrictEqual({
      overdueTasks: [
        {
          id: 42,
          title: 'Send the proposal',
          version: 3,
          dueAt: '2026-10-10T02:00:00Z',
          overdue: true,
        },
      ],
      dueSoonTasks: [],
      followUpLeads: [],
      today: '2026-10-21',
    });
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/reminders', {
      params: { path: { workspaceId: 7 } },
    });
  });

  it('ends a session the backend no longer accepts, as other reads do', async () => {
    vi.mocked(redirectIfUnauthorized).mockClear();
    mockGet({ status: 401 });

    await expect(loadReminders(7, 'Asia/Bangkok')).resolves.toBeUndefined();
    expect(redirectIfUnauthorized).toHaveBeenCalledWith(401);
  });

  it('answers nothing, so the bell keeps its count, when the backend fails', async () => {
    vi.mocked(redirectIfUnauthorized).mockClear();
    mockGet({ status: 503 });

    await expect(loadReminders(7, 'Asia/Bangkok')).resolves.toBeUndefined();
    expect(redirectIfUnauthorized).not.toHaveBeenCalled();
  });

  it('asks the backend nothing for a workspace id that is not one', async () => {
    const GET = mockGet({ status: 200, data: {} });

    // @ts-expect-error -- what a crafted call could send
    await expect(loadReminders({ id: 7 }, 'Asia/Bangkok')).resolves.toBeUndefined();
    expect(GET).not.toHaveBeenCalled();
  });

  it('asks the backend nothing for a time zone that is not one', async () => {
    const GET = mockGet({ status: 200, data: {} });

    await expect(loadReminders(7, 'Not/A_Zone')).rejects.toThrow(RangeError);
    expect(GET).not.toHaveBeenCalled();
  });
});
