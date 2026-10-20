import { createTranslator } from 'next-intl';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { GET, HEAD } from './route';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));
// The real one needs Next's request context; the messages are the app's own.
// @ts-expect-error -- only what this route reads
vi.mock(import('next-intl/server'), () => ({
  getTranslations: async (options: { locale: string; namespace: 'ApiError' | 'ActionError' }) =>
    await Promise.resolve(
      createTranslator({
        locale: options.locale,
        messages: options.locale === 'fr' ? fr : en,
        namespace: options.namespace,
      }),
    ),
}));

const CSV = '﻿Reference,Name\r\nC-0001,Acme\r\n';
const HEADERS = {
  'Content-Type': 'text/csv;charset=UTF-8',
  'Content-Disposition': 'attachment; filename="companies-2026-10-20.csv"',
};

/**
 * Answers the backend's export with `answer`, and runs the route for the list and query.
 * @param list The `[list]` segment.
 * @param search The request's query string.
 * @param answer What the backend says.
 * @param sent What else the request has.
 * @param sent.cookie Its cookie header.
 * @param sent.headers Its other headers.
 * @param sent.workspaceId The `[workspaceId]` segment.
 * @returns The route's response and the backend call.
 */
const exportList = async (
  list: string,
  search: string,
  answer: { data?: unknown; error?: unknown; response: Response },
  sent: { cookie?: string; headers?: Record<string, string>; workspaceId?: string } = {},
) => {
  const call = vi.fn<(path: string, init: unknown) => Promise<unknown>>().mockResolvedValue(answer);
  vi.mocked(authedBackend).mockClear();
  // @ts-expect-error -- only the call this route makes
  vi.mocked(authedBackend).mockResolvedValue({ GET: call });
  const workspaceId = sent.workspaceId ?? '7';
  const request = new NextRequest(
    `http://localhost:3000/api/crm/${workspaceId}/export/${list}${search}`,
    { headers: { cookie: sent.cookie ?? 'access_token=abc', ...sent.headers } },
  );
  const response = await GET(request, { params: Promise.resolve({ workspaceId, list }) });

  return { response, call };
};

const ok = (body: BodyInit | null = CSV) => ({
  data: body === null ? null : new Response(body).body,
  response: new Response(null, { status: 200, headers: HEADERS }),
});

const refused = (status: number, body: unknown) => ({
  error: body,
  response: new Response(null, { status }),
});

describe(GET, () => {
  it('answers 404 for a list that has no export, without asking the backend', async () => {
    const { response, call } = await exportList('tasks', '', ok());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toStrictEqual({
      message: 'This can’t be found. It may have been deleted.'.replace('’', "'"),
    });
    expect(call).not.toHaveBeenCalled();
    expect(authedBackend).not.toHaveBeenCalled();
  });

  it('answers 404 for a workspace id that is not one, without asking the backend', async () => {
    const { response, call } = await exportList('companies', '', ok(), { workspaceId: 'abc' });

    expect(response.status).toBe(404);
    expect(call).not.toHaveBeenCalled();
    expect(authedBackend).not.toHaveBeenCalled();
  });

  it('refuses an export another site started, in the language asked, without asking the backend', async () => {
    // A link or form on another site opens the route with the victim's (SameSite=Lax) cookies:
    // it would export, and record the export, in their name.
    const { response, call } = await exportList('contacts', '?locale=fr', ok(), {
      headers: { 'sec-fetch-site': 'cross-site' },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toStrictEqual({ message: fr.ApiError.status_403 });
    expect(call).not.toHaveBeenCalled();
    expect(authedBackend).not.toHaveBeenCalled();
  });

  it.each([['same-origin'], ['same-site'], ['none'], [undefined]])(
    'exports for a request from %s (a typed URL or bookmark is none; an older browser sends none)',
    async (site) => {
      const { response, call } = await exportList('contacts', '', ok(), {
        headers: site === undefined ? {} : { 'sec-fetch-site': site },
      });

      expect(response.status).toBe(200);
      expect(call).toHaveBeenCalledOnce();
    },
  );

  it('asks for the list as its page reads its URL, leaving out the paging and the sort', async () => {
    const { call } = await exportList(
      'leads',
      '?status=NEW&status=BOGUS&ownerId=unassigned&sourceId=abc&priority=HIGH&followUpBefore=2026-02-30' +
        '&q=%20acme%20&archived=true&page=3&size=50&sort=NAME&direction=ASC&locale=fr',
      ok(),
    );

    expect(call).toHaveBeenCalledExactlyOnceWith('/api/v1/workspaces/{workspaceId}/leads/export', {
      params: {
        path: { workspaceId: 7 },
        query: {
          status: ['NEW'],
          priority: 'HIGH',
          q: 'acme',
          archived: true,
          unassigned: true,
        },
      },
      parseAs: 'stream',
    });
  });

  it("exports the deals table's filters, without the page's own view", async () => {
    const { call } = await exportList(
      'deals',
      '?view=list&status=OPEN&stageId=4&contactId=5&sourceId=6&closeFrom=2026-11-01&archived=true',
      ok(),
    );

    expect(call).toHaveBeenCalledExactlyOnceWith('/api/v1/workspaces/{workspaceId}/deals/export', {
      params: {
        path: { workspaceId: 7 },
        query: {
          status: 'OPEN',
          stageId: 4,
          contactId: 5,
          sourceId: 6,
          closeFrom: '2026-11-01',
          archived: true,
        },
      },
      parseAs: 'stream',
    });
  });

  it('exports what the deal board shows: its search, owner and company, not the table filters', async () => {
    // The view tabs keep the table's filters in the URL; the board doesn't apply them.
    const { call } = await exportList(
      'deals',
      '?q=acme&ownerId=3&companyId=9&status=WON&stageId=4&sourceId=6&closeTo=2026-12-31&archived=true',
      ok(),
    );

    expect(call).toHaveBeenCalledExactlyOnceWith('/api/v1/workspaces/{workspaceId}/deals/export', {
      params: { path: { workspaceId: 7 }, query: { q: 'acme', ownerId: 3, companyId: 9 } },
      parseAs: 'stream',
    });
  });

  it.each([
    ['companies', 'industry=Retail', { industry: 'Retail' }],
    ['contacts', 'tag=vip&companyId=9', { tag: 'vip', companyId: 9 }],
  ])('exports the %s with their filters', async (list, search, query) => {
    const { call } = await exportList(list, `?${search}`, ok());

    expect(call).toHaveBeenCalledWith(
      `/api/v1/workspaces/{workspaceId}/${list}/export`,
      expect.objectContaining({
        params: { path: { workspaceId: 7 }, query: expect.objectContaining(query) },
      }),
    );
  });

  it("passes the backend's file through with its type and its name", async () => {
    const { response } = await exportList('companies', '', ok());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv;charset=UTF-8');
    expect(response.headers.get('Content-Disposition')).toBe(HEADERS['Content-Disposition']);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    // Bytes, not text: the byte order mark Excel needs must reach the file.
    expect(new Uint8Array(await response.arrayBuffer())).toStrictEqual(
      new TextEncoder().encode(CSV),
    );
  });

  it('never lets the browser read the file as anything but what it says, and always saves it', async () => {
    const sent = await exportList('companies', '', ok());
    expect(sent.response.headers.get('X-Content-Type-Options')).toBe('nosniff');

    // A proxy in front of the backend may drop its headers: the CSV still downloads, never renders.
    const bare = await exportList('companies', '', {
      data: new Response(CSV).body,
      response: new Response(null, { status: 200 }),
    });
    expect(bare.response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(bare.response.headers.get('Content-Disposition')).toBe('attachment');
  });

  it("passes none of the backend's other headers, its cookies least of all", async () => {
    const { response } = await exportList('companies', '', {
      data: new Response(CSV).body,
      response: new Response(null, {
        status: 200,
        headers: { ...HEADERS, 'Set-Cookie': 'JSESSIONID=backend; Path=/', 'X-Request-Id': 'r-1' },
      }),
    });

    expect(response.headers.getSetCookie()).toStrictEqual([]);
    expect(response.headers.get('X-Request-Id')).toBeNull();
  });

  it('streams the body as it comes: the first rows reach the browser before the last are read', async () => {
    const encoder = new TextEncoder();
    // The backend holds the last rows until the test sends them.
    const { promise: rest, resolve: sendRest } = Promise.withResolvers<string>();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('Reference\r\nC-0001\r\n'));
      },
      async pull(controller) {
        controller.enqueue(encoder.encode(await rest));
        controller.close();
      },
    });
    const { response } = await exportList('companies', '', {
      data: body,
      response: new Response(null, { status: 200, headers: HEADERS }),
    });

    const reader = response.body?.getReader();
    const first = await reader?.read();

    expect(new TextDecoder().decode(first?.value)).toBe('Reference\r\nC-0001\r\n');
    sendRest('C-0002\r\n');
    const second = await reader?.read();
    expect(new TextDecoder().decode(second?.value)).toBe('C-0002\r\n');
  });

  it('answers a translated 400 for a file over the cap', async () => {
    const { response } = await exportList(
      'contacts',
      '?locale=en',
      refused(400, {
        status: 400,
        code: 'EXPORT_TOO_LARGE',
        message: 'Too many rows to export (12345); narrow the filters',
      }),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    await expect(response.json()).resolves.toStrictEqual({
      message: 'Too many rows to export. Narrow the filters and try again.',
    });
  });

  it('writes the refusal in the language it was asked in', async () => {
    const { response } = await exportList(
      'contacts',
      '?locale=fr',
      refused(400, { status: 400, code: 'EXPORT_TOO_LARGE', message: 'Too many rows' }),
    );

    const { message } = await response.json();
    expect(message).not.toBe('Too many rows to export. Narrow the filters and try again.');
    expect(message).toMatch(/export/iu);
  });

  it('names no fields to check when the backend refuses the filters: the export has none on screen', async () => {
    // A deals export with closeFrom after closeTo: the list itself shows its invalid-filter notice.
    const { response } = await exportList(
      'deals',
      '?view=table&closeFrom=2026-12-01&closeTo=2026-01-01',
      refused(400, {
        status: 400,
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        fieldErrors: { closeFrom: 'must not be after closeTo' },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toStrictEqual({
      message: "Something in the request isn't valid. Check it and try again.",
    });
  });

  it("answers 403 with the role's refusal, not the file", async () => {
    const { response } = await exportList(
      'deals',
      '',
      refused(403, { status: 403, code: 'FORBIDDEN', message: 'Forbidden' }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toStrictEqual({
      message: "Your role doesn't allow this.",
    });
  });

  it('ends the session on a 401: a bare 401 for the button, and the cookies cleared', async () => {
    const { response } = await exportList(
      'companies',
      '',
      refused(401, { status: 401, message: 'Unauthorized' }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('Location')).toBeNull();
    await expect(response.text()).resolves.toBe('');
    const cookies = response.headers.getSetCookie();
    expect(cookies.some((cookie) => cookie.startsWith('access_token=;'))).toBeTruthy();
    expect(cookies.some((cookie) => cookie.startsWith('refresh_token=;'))).toBeTruthy();
  });

  it('keeps the cookies on a 401 for a request that sent no access token', async () => {
    // A parallel request may have just refreshed them.
    const { response } = await exportList(
      'companies',
      '',
      refused(401, { status: 401, message: 'Unauthorized' }),
      { cookie: 'refresh_token=xyz' },
    );

    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toStrictEqual([]);
  });

  it('answers a translated 502 when the backend cannot be reached', async () => {
    // @ts-expect-error -- only the call this route makes
    vi.mocked(authedBackend).mockResolvedValue({
      GET: vi.fn<() => Promise<never>>().mockRejectedValue(new TypeError('fetch failed')),
    });
    const request = new NextRequest('http://localhost:3000/api/crm/7/export/companies');

    const response = await GET(request, {
      params: Promise.resolve({ workspaceId: '7', list: 'companies' }),
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toStrictEqual({
      message: "Couldn't reach the server. Check your connection and try again.",
    });
  });
});

describe(HEAD, () => {
  it("doesn't run the export: Next would answer HEAD with GET, which records it", () => {
    vi.mocked(authedBackend).mockClear();

    const response = HEAD();

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET');
    expect(authedBackend).not.toHaveBeenCalled();
  });
});
