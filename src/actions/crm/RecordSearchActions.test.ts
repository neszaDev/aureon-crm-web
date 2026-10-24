import { describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import { redirectIfUnauthorized } from '@/libs/api/Session';
import { searchRecords } from './RecordSearchActions';

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

describe(searchRecords, () => {
  it('lists the first 10 active companies matching the text, by name and website', async () => {
    const GET = mockGet({
      status: 200,
      data: {
        content: [
          { id: 7, name: 'Acme', website: 'https://acme.test' },
          { id: 9, name: 'Acme Logistics' },
        ],
      },
    });

    await expect(searchRecords(1, 'company', ' acme ')).resolves.toStrictEqual([
      { id: 7, label: 'Acme', detail: 'https://acme.test' },
      { id: 9, label: 'Acme Logistics', detail: undefined },
    ]);
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/companies', {
      params: { path: { workspaceId: 1 }, query: { q: 'acme', size: 10 } },
    });
  });

  it('lists contacts by name, with their company or email', async () => {
    const GET = mockGet({
      status: 200,
      data: {
        content: [
          { id: 3, fullName: 'Mia Chan', company: { id: 7, name: 'Acme' } },
          { id: 4, fullName: 'Mia Lee', email: 'mia@lee.test' },
        ],
      },
    });

    await expect(searchRecords(1, 'contact', 'mia')).resolves.toStrictEqual([
      { id: 3, label: 'Mia Chan', detail: 'Acme' },
      { id: 4, label: 'Mia Lee', detail: 'mia@lee.test' },
    ]);
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/contacts', {
      params: { path: { workspaceId: 1 }, query: { q: 'mia', size: 10 } },
    });
  });

  it('lists leads by name, with their company', async () => {
    const GET = mockGet({
      status: 200,
      data: {
        content: [
          { id: 5, firstName: 'Noa', lastName: 'Park', companyName: 'Globex' },
          { id: 6, firstName: 'Noa' },
        ],
      },
    });

    await expect(searchRecords(1, 'lead', 'noa')).resolves.toStrictEqual([
      { id: 5, label: 'Noa Park', detail: 'Globex' },
      { id: 6, label: 'Noa', detail: undefined },
    ]);
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/leads', {
      params: { path: { workspaceId: 1 }, query: { q: 'noa', size: 10 } },
    });
  });

  it('lists deals by name, with their company', async () => {
    const GET = mockGet({
      status: 200,
      data: { content: [{ id: 8, name: 'Acme renewal', company: { id: 7, name: 'Acme' } }] },
    });

    await expect(searchRecords(1, 'deal', 'renewal')).resolves.toStrictEqual([
      { id: 8, label: 'Acme renewal', detail: 'Acme' },
    ]);
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/deals', {
      params: { path: { workspaceId: 1 }, query: { q: 'renewal', size: 10 } },
    });
  });

  it('sends no NUL characters, and no more text than the backend takes', async () => {
    const GET = mockGet({ status: 200, data: { content: [] } });

    await searchRecords(1, 'company', `a\u0000b${'c'.repeat(300)}`);

    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/companies', {
      params: { path: { workspaceId: 1 }, query: { q: `ab${'c'.repeat(198)}`, size: 10 } },
    });
  });

  it('fails when the backend refuses, so the picker can say so', async () => {
    mockGet({ status: 403 });

    await expect(searchRecords(1, 'company', '')).rejects.toThrow('403');
  });

  it('ends a session the backend no longer accepts, as other reads do', async () => {
    vi.mocked(redirectIfUnauthorized).mockClear();
    mockGet({ status: 401 });

    await expect(searchRecords(1, 'company', '')).rejects.toThrow('401');
    expect(redirectIfUnauthorized).toHaveBeenCalledWith(401);
  });

  it('finds nothing for a kind it has no search for', async () => {
    const GET = mockGet({ status: 200, data: { content: [] } });

    // @ts-expect-error -- what a crafted call could send
    await expect(searchRecords(1, 'constructor', '')).resolves.toStrictEqual([]);
    expect(GET).not.toHaveBeenCalled();
  });
});
