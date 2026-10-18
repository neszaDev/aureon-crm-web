import { describe, expect, it, vi } from 'vitest';
import { parseListQuery } from '@/libs/crm/ListQuery';
import { authedBackend } from './Backend';
import { COMPANY_LIST, getCompanies } from './CrmQueries';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('./Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));

describe(getCompanies, () => {
  it('flags a query the backend refuses as invalid, without data', async () => {
    const GET = vi.fn<() => Promise<unknown>>().mockResolvedValue({
      error: { status: 400, code: 'VALIDATION_FAILED', message: 'Validation failed' },
      response: new Response(null, { status: 400 }),
    });
    // @ts-expect-error -- only the call this query makes
    vi.mocked(authedBackend).mockResolvedValue({ GET });

    const result = await getCompanies('7', parseListQuery(COMPANY_LIST, { q: 'a'.repeat(201) }));

    expect(result).toStrictEqual({
      companies: undefined,
      unauthorized: false,
      forbidden: false,
      notFound: false,
      invalid: true,
    });
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/companies', {
      params: {
        path: { workspaceId: 7 },
        query: expect.objectContaining({ q: 'a'.repeat(201), page: 0, size: 20, sort: 'NAME' }),
      },
    });
  });
});
