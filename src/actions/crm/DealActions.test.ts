import { refresh } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import { archiveDeal, assignDeal, moveDeal } from './DealActions';

vi.mock(import('server-only'), () => ({}));
// @ts-expect-error -- a translator that gives the key back
vi.mock(import('next-intl/server'), () => ({
  getTranslations: async () => await Promise.resolve((key: string) => key),
}));
vi.mock(import('next/cache'), () => ({ refresh: vi.fn<() => void>() }));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));
// Its real module needs Next's runtime; the actions import it for redirects.
vi.mock(import('@/libs/I18nNavigation'), () => ({}));

describe(assignDeal, () => {
  it('reads the deal and saves its fields back, at the list’s version, with the new owner', async () => {
    const GET = vi.fn<(path: string, init: unknown) => Promise<unknown>>().mockResolvedValue({
      data: {
        id: 9,
        name: 'Fleet tablets',
        amount: '1200.00',
        currency: 'EUR',
        probabilityOverride: 40,
        expectedCloseDate: '2026-11-30',
        owner: { userId: 2 },
        company: { id: 4, name: 'Acme' },
        source: { id: 6, name: 'Referral' },
        notes: 'Keep it short',
        stage: { id: 1, name: 'New', kind: 'OPEN' },
        version: 8,
      },
      response: new Response(null, { status: 200 }),
    });
    const PUT = vi
      .fn<(path: string, init: unknown) => Promise<unknown>>()
      .mockResolvedValue({ response: new Response(null, { status: 200 }) });
    // @ts-expect-error -- only the calls this action makes
    vi.mocked(authedBackend).mockResolvedValue({ GET, PUT });

    const result = await assignDeal(1, 9, 7, 3);

    expect(result).toStrictEqual({ ok: true });
    expect(PUT).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/deals/{id}', {
      params: { path: { workspaceId: 1, id: 9 } },
      body: {
        name: 'Fleet tablets',
        amount: '1200.00',
        currency: 'EUR',
        probability: 40,
        expectedCloseDate: '2026-11-30',
        ownerId: 3,
        companyId: 4,
        contactId: undefined,
        sourceId: 6,
        notes: 'Keep it short',
        version: 7,
      },
    });
  });
});

describe('refreshing the page', () => {
  const ok = { data: { version: 2 }, response: new Response(null, { status: 200 }) };

  beforeEach(() => {
    const call = vi.fn<() => Promise<unknown>>().mockResolvedValue(ok);
    // @ts-expect-error -- only the calls these actions make
    vi.mocked(authedBackend).mockResolvedValue({ GET: call, PUT: call, POST: call });
    vi.mocked(refresh).mockClear();
  });

  it('refreshes after a change by default, as a form or a row needs', async () => {
    await archiveDeal(1, 9);
    await moveDeal(1, 9, { stageId: 3, version: 1 });

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('leaves the refresh to the bulk bar, which does it once after its last record', async () => {
    await archiveDeal(1, 9, false);
    await moveDeal(1, 9, { stageId: 3, version: 1 }, false);
    await assignDeal(1, 9, 1, 3, false);

    expect(refresh).not.toHaveBeenCalled();
  });
});
