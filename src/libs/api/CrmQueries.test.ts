import { describe, expect, it, vi } from 'vitest';
import { parseListQuery } from '@/libs/crm/ListQuery';
import { authedBackend } from './Backend';
import { COMPANY_LIST, getCompanies, getLeads, LEAD_LIST, taskViewQuery } from './CrmQueries';

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

describe(getLeads, () => {
  it('asks for the statuses, the unassigned filter and the follow-up date as the backend names them', async () => {
    const GET = vi.fn<() => Promise<unknown>>().mockResolvedValue({
      data: { content: [] },
      response: new Response(null, { status: 200 }),
    });
    // @ts-expect-error -- only the call this query makes
    vi.mocked(authedBackend).mockResolvedValue({ GET });

    await getLeads(
      '7',
      parseListQuery(LEAD_LIST, {
        status: ['NEW', 'QUALIFIED', 'NOPE'],
        ownerId: 'unassigned',
        priority: 'HIGH',
        followUpBefore: '2026-10-20',
        sort: 'FOLLOW_UP_DATE',
      }),
    );

    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/leads', {
      params: {
        path: { workspaceId: 7 },
        query: expect.objectContaining({
          status: ['NEW', 'QUALIFIED'],
          unassigned: true,
          priority: 'HIGH',
          followUpBefore: '2026-10-20',
          sort: 'FOLLOW_UP_DATE',
        }),
      },
    });
  });
});

describe(taskViewQuery, () => {
  // Sunday 18 October 2026, 03:00 UTC.
  const NOW = Date.UTC(2026, 9, 18, 3);

  it('asks for the caller\'s open tasks on "mine"', () => {
    expect(taskViewQuery('mine', NOW)).toStrictEqual({ mine: true, status: ['OPEN'] });
  });

  it('asks for overdue tasks on "overdue"', () => {
    expect(taskViewQuery('overdue', NOW)).toStrictEqual({ overdue: true });
  });

  it('asks for the open tasks due from now to a week on, now included and the week out', () => {
    expect(taskViewQuery('upcoming', NOW)).toStrictEqual({
      status: ['OPEN'],
      dueFrom: '2026-10-18T03:00:00.000Z',
      dueTo: '2026-10-25T03:00:00.000Z',
    });
  });

  it('lists completed tasks by when they were last updated, latest first', () => {
    expect(taskViewQuery('completed', NOW)).toStrictEqual({
      status: ['COMPLETED'],
      sort: 'UPDATED_AT',
      direction: 'DESC',
    });
  });

  it('adds nothing on "all"', () => {
    expect(taskViewQuery('all', NOW)).toStrictEqual({});
  });
});
