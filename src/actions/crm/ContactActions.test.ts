import { describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import { findContactDuplicates } from './ContactActions';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('next-intl/server'), () => ({}));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));
// Its real module needs Next's runtime; the actions import it for redirects.
vi.mock(import('@/libs/I18nNavigation'), () => ({}));

describe(findContactDuplicates, () => {
  it('leaves out the contact being edited and sends the email and phone trimmed', async () => {
    const GET = vi.fn<() => Promise<unknown>>().mockResolvedValue({
      data: [
        { id: 42, fullName: 'Mia Chan', email: 'mia@acme.test' },
        { id: 7, fullName: 'Mia C.', phone: '081 234 5678' },
      ],
      response: new Response(null, { status: 200 }),
    });
    // @ts-expect-error -- only the call this action makes
    vi.mocked(authedBackend).mockResolvedValue({ GET });

    const found = await findContactDuplicates(
      1,
      { email: ' Mia@acme.test ', phone: ' 081 234 5678 ' },
      42,
    );

    expect(found).toStrictEqual([{ id: 7, fullName: 'Mia C.', phone: '081 234 5678' }]);
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/contacts/duplicates', {
      params: {
        path: { workspaceId: 1 },
        query: { email: 'Mia@acme.test', phone: '081 234 5678' },
      },
    });
  });

  it('asks nothing for an empty email and phone', async () => {
    vi.mocked(authedBackend).mockClear();

    await expect(findContactDuplicates(1, { email: ' ', phone: '' })).resolves.toStrictEqual([]);
    expect(authedBackend).not.toHaveBeenCalled();
  });
});
