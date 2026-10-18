import { describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import { findCompanyDuplicates } from './CompanyActions';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('next-intl/server'), () => ({}));
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
