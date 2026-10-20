import { describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import { redirectIfUnauthorized } from '@/libs/api/Session';
import { loadHistory } from './AuditActions';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));
// Its real module needs Next's runtime; a 401 redirects to sign-in there.
vi.mock(import('@/libs/api/Session'), () => ({
  redirectIfUnauthorized: vi.fn<typeof redirectIfUnauthorized>(),
}));

const answer = (status: number, content: unknown[] = []) => {
  const GET = vi.fn<() => Promise<unknown>>().mockResolvedValue({
    data: status === 200 ? { content } : undefined,
    response: new Response(null, { status }),
  });
  // @ts-expect-error -- only the call this action makes
  vi.mocked(authedBackend).mockResolvedValue({ GET });

  return GET;
};

describe(loadHistory, () => {
  it("gives a later page of a record's history, ten events a page", async () => {
    const GET = answer(200, [{ id: 3 }]);

    await expect(loadHistory(7, 'DEAL', 12, 2)).resolves.toStrictEqual([{ id: 3 }]);
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/audit-events', {
      params: {
        path: { workspaceId: 7 },
        query: { entityType: 'DEAL', entityId: 12, page: 2, size: 10 },
      },
    });
  });

  it.each([
    ['a type with no history section', 'MEMBER', 12, 1],
    ['an unknown type', 'INVOICE', 12, 1],
    ['a record id that is not one', 'DEAL', 0, 1],
    ['a page that is not a whole number', 'DEAL', 12, 1.5],
    ['a negative page', 'DEAL', 12, -1],
  ])('refuses %s without asking the backend', async (_name, type, id, page) => {
    vi.mocked(authedBackend).mockClear();

    // A server action takes whatever a caller sends.
    // @ts-expect-error -- the type is the caller's to get wrong
    await expect(loadHistory(7, type, id, page)).rejects.toThrow('Not a history page');
    expect(authedBackend).not.toHaveBeenCalled();
  });

  it('ends the session on a 401', async () => {
    answer(401);

    await expect(loadHistory(7, 'DEAL', 12, 1)).rejects.toThrow('could not be loaded');
    expect(redirectIfUnauthorized).toHaveBeenCalledWith(401);
  });

  it('throws when the backend refuses, for the button to say so', async () => {
    answer(403);

    await expect(loadHistory(7, 'DEAL', 12, 1)).rejects.toThrow('could not be loaded');
  });
});
