import { describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import type { redirectIfUnauthorized } from '@/libs/api/Session';
import { loadActivities } from './ActivityActions';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('next-intl/server'), () => ({}));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));
// Its real module needs Next's runtime; a 401 redirects to sign-in there.
vi.mock(import('@/libs/api/Session'), () => ({
  redirectIfUnauthorized: vi.fn<typeof redirectIfUnauthorized>(),
}));

const answer = () => {
  const GET = vi.fn<() => Promise<unknown>>().mockResolvedValue({
    data: { content: [{ id: 3 }] },
    response: new Response(null, { status: 200 }),
  });
  // @ts-expect-error -- only the call this action makes
  vi.mocked(authedBackend).mockResolvedValue({ GET });

  return GET;
};

describe(loadActivities, () => {
  it('asks for a page of those before an instant, by the exclusive `to`', async () => {
    const GET = answer();

    await expect(
      loadActivities(7, { companyId: 9 }, { page: 1, to: '2026-10-18T03:00:00.001+00:00' }),
    ).resolves.toStrictEqual([{ id: 3 }]);
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/activities', {
      params: {
        path: { workspaceId: 7 },
        query: { companyId: 9, to: '2026-10-18T03:00:00.001Z', page: 1, size: 20 },
      },
    });
  });

  it.each([
    ['an instant that is not one', { page: 0, to: 'yesterday' }],
    ['a negative page', { page: -1 }],
  ])('refuses %s without asking the backend', async (_case, older) => {
    const GET = answer();

    await expect(loadActivities(7, { companyId: 9 }, older)).rejects.toThrow('Not a timeline page');
    expect(GET).not.toHaveBeenCalled();
  });
});
