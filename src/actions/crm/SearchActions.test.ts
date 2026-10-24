import { describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import { redirectIfUnauthorized } from '@/libs/api/Session';
import { searchAll } from './SearchActions';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));
// Its real module needs Next's runtime; a 401 redirects to sign-in there.
vi.mock(import('@/libs/api/Session'), () => ({
  redirectIfUnauthorized: vi.fn<typeof redirectIfUnauthorized>(),
}));

const PAGES: Record<string, unknown[]> = {
  '/api/v1/workspaces/{workspaceId}/companies': [
    { id: 7, name: 'Acme', website: 'https://acme.test' },
  ],
  '/api/v1/workspaces/{workspaceId}/contacts': [
    { id: 3, fullName: 'Mia Chan', company: { id: 7, name: 'Acme' } },
  ],
  '/api/v1/workspaces/{workspaceId}/leads': [{ id: 5, firstName: 'Noa', lastName: 'Park' }],
  '/api/v1/workspaces/{workspaceId}/deals': [
    { id: 12_345, name: 'Acme renewal', company: { id: 7, name: 'Acme' } },
  ],
};

// Answers each list endpoint with its page, or with `status` for the paths in `refused`.
const mockApi = (refused: Record<string, number> = {}) => {
  const answers = new Map(
    Object.entries(PAGES).map(([path, content]) => {
      const status = refused[path] ?? 200;

      return [
        path,
        Promise.resolve({
          data: status === 200 ? { content } : undefined,
          response: new Response(null, { status }),
        }),
      ];
    }),
  );
  const GET = vi.fn<(path: string) => Promise<unknown>>(async (path) => await answers.get(path));
  // @ts-expect-error -- only the call this action makes
  vi.mocked(authedBackend).mockResolvedValue({ GET });

  return GET;
};

describe(searchAll, () => {
  it('finds 5 active records of each kind in parallel, each with its number and its page', async () => {
    const GET = mockApi();

    await expect(searchAll(4, ' acme ')).resolves.toStrictEqual({
      companies: [
        {
          id: 7,
          label: 'Acme',
          detail: 'https://acme.test',
          href: '/app/4/companies/7',
          reference: 'C-0007',
        },
      ],
      contacts: [
        {
          id: 3,
          label: 'Mia Chan',
          detail: 'Acme',
          href: '/app/4/contacts/3',
          reference: 'P-0003',
        },
      ],
      leads: [
        {
          id: 5,
          label: 'Noa Park',
          detail: undefined,
          href: '/app/4/leads/5',
          reference: 'L-0005',
        },
      ],
      deals: [
        {
          id: 12_345,
          label: 'Acme renewal',
          detail: 'Acme',
          href: '/app/4/deals/12345',
          reference: 'D-12345',
        },
      ],
    });
    // Active records only: the lists' default, so no `archived`.
    for (const path of Object.keys(PAGES)) {
      expect(GET).toHaveBeenCalledWith(path, {
        params: { path: { workspaceId: 4 }, query: { q: 'acme', size: 5 } },
      });
    }
    expect(GET).toHaveBeenCalledTimes(4);
  });

  it.each(['', ' ', 'a', ' a ', '\u0000a\u0000'])(
    'finds nothing, and asks nobody, for %j: under 2 characters once trimmed',
    async (q) => {
      const GET = mockApi();

      await expect(searchAll(4, q)).resolves.toStrictEqual({
        companies: [],
        contacts: [],
        leads: [],
        deals: [],
      });
      expect(GET).not.toHaveBeenCalled();
    },
  );

  it('sends no NUL characters, and no more text than the backend takes', async () => {
    const GET = mockApi();

    await searchAll(4, `a\u0000b${'c'.repeat(300)}`);

    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/deals', {
      params: { path: { workspaceId: 4 }, query: { q: `ab${'c'.repeat(198)}`, size: 5 } },
    });
  });

  it('fails when the backend refuses any list, so the dialog can say so', async () => {
    mockApi({ '/api/v1/workspaces/{workspaceId}/leads': 403 });

    await expect(searchAll(4, 'acme')).rejects.toThrow('403');
  });

  it('ends a session the backend no longer accepts, as other reads do', async () => {
    vi.mocked(redirectIfUnauthorized).mockClear();
    mockApi({ '/api/v1/workspaces/{workspaceId}/companies': 401 });

    await expect(searchAll(4, 'acme')).rejects.toThrow('401');
    expect(redirectIfUnauthorized).toHaveBeenCalledWith(401);
  });
});
