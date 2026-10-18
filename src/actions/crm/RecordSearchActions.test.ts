import { describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import { searchRecords } from './RecordSearchActions';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));

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

  it('sends no NUL characters, and no more text than the backend takes', async () => {
    const GET = mockGet({ status: 200, data: { content: [] } });

    await searchRecords(1, 'company', `a\u0000b${'c'.repeat(300)}`);

    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/companies', {
      params: { path: { workspaceId: 1 }, query: { q: `ab${'c'.repeat(198)}`, size: 10 } },
    });
  });

  it('finds nothing when the backend refuses', async () => {
    mockGet({ status: 403 });

    await expect(searchRecords(1, 'company', '')).resolves.toStrictEqual([]);
  });

  it('finds nothing for a kind it has no search for', async () => {
    const GET = mockGet({ status: 200, data: { content: [] } });

    // @ts-expect-error -- what a crafted call could send
    await expect(searchRecords(1, 'constructor', '')).resolves.toStrictEqual([]);
    expect(GET).not.toHaveBeenCalled();
  });
});
