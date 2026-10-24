import { refresh } from 'next/cache';
import { describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import { addCompany, findCompanyDuplicates } from './CompanyActions';

vi.mock(import('server-only'), () => ({}));
// @ts-expect-error -- a translator that gives the key back
vi.mock(import('next-intl/server'), () => ({
  getTranslations: async () => await Promise.resolve((key: string) => key),
}));
vi.mock(import('next/cache'), () => ({ refresh: vi.fn<() => void>() }));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));
// Its real module needs Next's runtime; the actions import it for redirects.
vi.mock(import('@/libs/I18nNavigation'), () => ({}));

describe(findCompanyDuplicates, () => {
  it('leaves out the company being edited and sends the website with its scheme', async () => {
    const GET = vi.fn<() => Promise<unknown>>().mockResolvedValue({
      data: [
        { id: 42, name: 'Acme' },
        { id: 7, name: 'ACME', website: 'https://acme.com' },
      ],
      response: new Response(null, { status: 200 }),
    });
    // @ts-expect-error -- only the call this action makes
    vi.mocked(authedBackend).mockResolvedValue({ GET });

    const found = await findCompanyDuplicates(1, { name: ' Acme ', website: 'acme.com' }, 42);

    expect(found).toStrictEqual([{ id: 7, name: 'ACME', website: 'https://acme.com' }]);
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/companies/duplicates', {
      params: { path: { workspaceId: 1 }, query: { name: 'Acme', website: 'https://acme.com' } },
    });
  });

  it('asks nothing for an empty name and website', async () => {
    vi.mocked(authedBackend).mockClear();

    await expect(findCompanyDuplicates(1, { name: ' ', website: '' })).resolves.toStrictEqual([]);
    expect(authedBackend).not.toHaveBeenCalled();
  });
});

describe(addCompany, () => {
  it("creates the company with the group's owner and the list's industry, and refreshes the list", async () => {
    const POST = vi.fn<() => Promise<unknown>>().mockResolvedValue({
      data: { id: 9 },
      response: new Response(null, { status: 201 }),
    });
    // @ts-expect-error -- only the call this action makes
    vi.mocked(authedBackend).mockResolvedValue({ POST });

    const result = await addCompany(1, { ownerId: 3, industry: 'Retail' }, 'Brightwater');

    expect(result).toStrictEqual({ ok: true });
    expect(POST).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/companies', {
      params: { path: { workspaceId: 1 } },
      body: {
        name: 'Brightwater',
        industry: 'Retail',
        website: undefined,
        phone: undefined,
        address: undefined,
        employeeCount: undefined,
        ownerId: 3,
        notes: undefined,
      },
    });
    expect(refresh).toHaveBeenCalledOnce();
  });
});
