import { describe, expect, it, vi } from 'vitest';
import { parseListQuery } from '@/libs/crm/ListQuery';
import { authedBackend } from './Backend';
import {
  COMPANY_LIST,
  DEAL_LIST,
  getAuditEvents,
  getCompanies,
  getActivityReport,
  getDashboard,
  getDeals,
  getFollowUpReport,
  getFunnelReport,
  getLeads,
  getPipelineReport,
  getReminders,
  getWonLostReport,
  LEAD_LIST,
  taskViewQuery,
} from './CrmQueries';

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

describe(getDeals, () => {
  it("asks for the table's filters, the lead source among them, as the backend names them", async () => {
    const GET = vi.fn<() => Promise<unknown>>().mockResolvedValue({
      data: { content: [] },
      response: new Response(null, { status: 200 }),
    });
    // @ts-expect-error -- only the call this query makes
    vi.mocked(authedBackend).mockResolvedValue({ GET });

    await getDeals(
      '7',
      parseListQuery(DEAL_LIST, { view: 'list', sourceId: '6', stageId: '4', status: 'OPEN' }),
    );

    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/deals', {
      params: {
        path: { workspaceId: 7 },
        query: expect.objectContaining({ sourceId: 6, stageId: 4, status: 'OPEN' }),
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

describe(getReminders, () => {
  it("reads the caller's reminders of the workspace, and flags a lost session", async () => {
    const reminders = { overdueTasks: [], dueSoonTasks: [], followUpLeads: [] };
    const GET = vi
      .fn<() => Promise<unknown>>()
      .mockResolvedValueOnce({ data: reminders, response: new Response(null, { status: 200 }) })
      .mockResolvedValueOnce({ response: new Response(null, { status: 401 }) });
    // @ts-expect-error -- only the call this query makes
    vi.mocked(authedBackend).mockResolvedValue({ GET });

    await expect(getReminders('7')).resolves.toStrictEqual({
      reminders,
      unauthorized: false,
      forbidden: false,
      notFound: false,
      invalid: false,
    });
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/reminders', {
      params: { path: { workspaceId: 7 } },
    });
    // A second workspace: the request-scoped cache is per argument, and a 401 has no data.
    await expect(getReminders('8')).resolves.toMatchObject({
      reminders: undefined,
      unauthorized: true,
    });
  });

  it('finds none for a malformed workspace id, without asking the backend', async () => {
    vi.mocked(authedBackend).mockClear();

    await expect(getReminders('seven')).resolves.toMatchObject({
      reminders: undefined,
      notFound: true,
    });
    expect(authedBackend).not.toHaveBeenCalled();
  });
});

describe(getDashboard, () => {
  it('asks for the period as it is, leaves out what is not given, and flags a refusal as invalid', async () => {
    const GET = vi
      .fn<() => Promise<unknown>>()
      .mockResolvedValueOnce({
        data: { counts: {} },
        response: new Response(null, { status: 200 }),
      })
      .mockResolvedValueOnce({ response: new Response(null, { status: 200 }), data: {} })
      .mockResolvedValueOnce({
        error: { status: 400, code: 'VALIDATION_FAILED', message: 'Validation failed' },
        response: new Response(null, { status: 400 }),
      });
    // @ts-expect-error -- only the call this query makes
    vi.mocked(authedBackend).mockResolvedValue({ GET });

    await expect(
      getDashboard('7', { from: '2026-09-01', to: '2026-09-30' }),
    ).resolves.toMatchObject({ dashboard: { counts: {} }, invalid: false });
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/dashboard', {
      params: { path: { workspaceId: 7 }, query: { from: '2026-09-01', to: '2026-09-30' } },
    });
    await getDashboard('7', {});
    expect(GET).toHaveBeenLastCalledWith('/api/v1/workspaces/{workspaceId}/dashboard', {
      params: { path: { workspaceId: 7 }, query: {} },
    });
    await expect(getDashboard('7', { from: '2026-09-01' })).resolves.toStrictEqual({
      dashboard: undefined,
      unauthorized: false,
      forbidden: false,
      notFound: false,
      invalid: true,
    });
  });

  it('finds none for a malformed workspace id, without asking the backend', async () => {
    vi.mocked(authedBackend).mockClear();

    await expect(getDashboard('seven', {})).resolves.toMatchObject({
      dashboard: undefined,
      notFound: true,
    });
    expect(authedBackend).not.toHaveBeenCalled();
  });
});

describe('the reports', () => {
  const ok = { data: { period: {} }, response: new Response(null, { status: 200 }) };
  const refused = {
    error: { status: 400, code: 'VALIDATION_FAILED', message: 'Validation failed' },
    response: new Response(null, { status: 400 }),
  };

  it.each([
    ['won-lost', getWonLostReport],
    ['funnel', getFunnelReport],
    ['activities', getActivityReport],
  ] as const)(
    'asks %s for the period as it is, and flags a refusal as invalid',
    async (path, get) => {
      const GET = vi
        .fn<() => Promise<unknown>>()
        .mockResolvedValueOnce(ok)
        .mockResolvedValueOnce(ok)
        .mockResolvedValueOnce(refused);
      // @ts-expect-error -- only the call this query makes
      vi.mocked(authedBackend).mockResolvedValue({ GET });

      const result = await get('7', { from: '2026-09-01', to: '2026-09-30' });

      expect(result).toMatchObject({ report: { period: {} }, invalid: false });
      expect(GET).toHaveBeenCalledWith(`/api/v1/workspaces/{workspaceId}/reports/${path}`, {
        params: { path: { workspaceId: 7 }, query: { from: '2026-09-01', to: '2026-09-30' } },
      });
      await get('7', {});
      expect(GET).toHaveBeenLastCalledWith(`/api/v1/workspaces/{workspaceId}/reports/${path}`, {
        params: { path: { workspaceId: 7 }, query: {} },
      });
      await expect(get('7', { from: '2026-09-01' })).resolves.toStrictEqual({
        report: undefined,
        unauthorized: false,
        forbidden: false,
        notFound: false,
        invalid: true,
      });
    },
  );

  it.each([
    ['pipeline', getPipelineReport],
    ['follow-ups', getFollowUpReport],
  ] as const)('asks %s for nothing but the workspace: it is as of now', async (path, get) => {
    const GET = vi.fn<() => Promise<unknown>>().mockResolvedValue(ok);
    // @ts-expect-error -- only the call this query makes
    vi.mocked(authedBackend).mockResolvedValue({ GET });

    await expect(get('7')).resolves.toMatchObject({ report: { period: {} }, forbidden: false });
    expect(GET).toHaveBeenCalledWith(`/api/v1/workspaces/{workspaceId}/reports/${path}`, {
      params: { path: { workspaceId: 7 } },
    });
  });

  it.each([
    getPipelineReport,
    getFollowUpReport,
    getWonLostReport,
    getFunnelReport,
    getActivityReport,
  ])('finds none for a malformed workspace id, without asking the backend', async (get) => {
    vi.mocked(authedBackend).mockClear();

    await expect(get('seven', {})).resolves.toMatchObject({ report: undefined, notFound: true });
    expect(authedBackend).not.toHaveBeenCalled();
  });
});

describe(getAuditEvents, () => {
  it("asks for a page of the workspace's history by the filters the backend names", async () => {
    const GET = vi.fn<() => Promise<unknown>>().mockResolvedValue({
      data: { content: [] },
      response: new Response(null, { status: 200 }),
    });
    // @ts-expect-error -- only the call this query makes
    vi.mocked(authedBackend).mockResolvedValue({ GET });

    await expect(
      getAuditEvents('7', { entityType: 'DEAL', entityId: 12, page: 2, size: 10 }),
    ).resolves.toStrictEqual({
      events: { content: [] },
      unauthorized: false,
      forbidden: false,
      notFound: false,
      invalid: false,
    });
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/audit-events', {
      params: {
        path: { workspaceId: 7 },
        query: { entityType: 'DEAL', entityId: 12, page: 2, size: 10 },
      },
    });
  });

  it('flags a member without AUDIT_READ asking for everything', async () => {
    const GET = vi.fn<() => Promise<unknown>>().mockResolvedValue({
      error: { status: 403, code: 'FORBIDDEN', message: 'Forbidden' },
      response: new Response(null, { status: 403 }),
    });
    // @ts-expect-error -- only the call this query makes
    vi.mocked(authedBackend).mockResolvedValue({ GET });

    await expect(getAuditEvents('7', { page: 0, size: 20 })).resolves.toMatchObject({
      events: undefined,
      forbidden: true,
    });
  });

  it('finds nothing for a malformed workspace without asking', async () => {
    vi.mocked(authedBackend).mockClear();

    await expect(getAuditEvents('abc', {})).resolves.toMatchObject({ notFound: true });
    expect(authedBackend).not.toHaveBeenCalled();
  });
});
