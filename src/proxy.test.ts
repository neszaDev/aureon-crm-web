import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import proxy, { config } from './proxy';

const { refresh, routeI18n } = vi.hoisted(() => ({
  // The refresh token is refused: there is no session.
  refresh: vi
    .fn<() => Promise<{ data?: unknown; response: Response }>>()
    .mockResolvedValue({ response: new Response(null, { status: 401 }) }),
  routeI18n: vi.fn<(request: NextRequest) => NextResponse>(),
}));

// @ts-expect-error -- only the call the proxy makes
vi.mock(import('@/libs/api/Backend'), () => ({ backend: { POST: refresh } }));
vi.mock(import('next-intl/middleware'), () => ({ default: () => routeI18n }));

/**
 * A request for a CRM page carrying a server action's id, from a browser whose session expired.
 * @param method The HTTP method.
 * @returns The request.
 */
const actionRequest = (method: string) =>
  new NextRequest('http://localhost:3000/app/7/settings/workspace', {
    method,
    headers: { 'next-action': '7f00ab', cookie: 'refresh_token=expired' },
  });

/**
 * The browser's fetch of a list's CSV export.
 * @param cookie The cookies it sends.
 * @returns The request.
 */
const exportRequest = (cookie: string) =>
  new NextRequest('http://localhost:3000/api/crm/7/export/companies?q=acme', {
    headers: { cookie },
  });

/**
 * A server action's POST from a browser without a session.
 * @param path The page it posts to.
 * @param headers What it says of its body (`content-length` or `transfer-encoding`).
 * @returns The request.
 */
const postRequest = (path: string, headers: Record<string, string>) =>
  new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: { 'next-action': '7f00ab', ...headers },
  });

const MIB = 1024 * 1024;

const TOKENS = {
  accessToken: 'fresh-access',
  refreshToken: 'fresh-refresh',
  expiresIn: 900,
  refreshExpiresIn: 2_592_000,
};

/**
 * A request for a CRM page from a browser whose access cookie expired.
 * @param refreshToken The refresh token it holds.
 * @returns The request.
 */
const pageRequest = (refreshToken: string) =>
  new NextRequest('http://localhost:3000/app/7/deals', {
    headers: { cookie: `refresh_token=${refreshToken}` },
  });

/**
 * What a response tells the browser: where it goes, if anywhere, and the cookies it stores.
 * @param response The proxy's response.
 * @returns Its location and session cookies.
 */
const outcome = (response: Response) => {
  const { cookies } = NextResponse.next({ headers: response.headers });

  return {
    location: response.headers.get('location'),
    access: cookies.get('access_token')?.value,
    refresh: cookies.get('refresh_token')?.value,
  };
};

describe(proxy, () => {
  // Each test starts with no refresh shared from an earlier one: the grace runs on fake timers.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('sends a GET to sign in even with an action id', async () => {
    const response = await proxy(actionRequest('GET'));

    expect(refresh).toHaveBeenCalledOnce();
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/sign-in?next=%2Fapp%2F7%2Fsettings%2Fworkspace',
    );
    expect(routeI18n).not.toHaveBeenCalled();
  });

  it('passes a server action on to i18n routing: the action ends the session itself', async () => {
    const request = actionRequest('POST');
    const passed = NextResponse.next();
    routeI18n.mockReturnValue(passed);

    await expect(proxy(request)).resolves.toBe(passed);
    expect(routeI18n).toHaveBeenCalledWith(request);
  });

  it("runs for the CRM's own API routes, and no other", () => {
    expect(
      unstable_doesMiddlewareMatch({ config, url: '/api/crm/7/export/companies' }),
    ).toBeTruthy();
    expect(unstable_doesMiddlewareMatch({ config, url: '/api/session/expired' })).toBeFalsy();
  });

  it('refreshes an expired session before a CRM API route runs, as it does for a page', async () => {
    refresh.mockClear();
    routeI18n.mockClear();
    refresh.mockResolvedValueOnce({
      data: {
        accessToken: 'fresh-access',
        refreshToken: 'fresh-refresh',
        expiresIn: 900,
        refreshExpiresIn: 2_592_000,
      },
      response: new Response(null, { status: 200 }),
    });

    const response = await proxy(exportRequest('refresh_token=still-good'));

    expect(refresh).toHaveBeenCalledOnce();
    // The route runs (no redirect), and the browser keeps the new tokens.
    expect({
      next: response.headers.get('x-middleware-next'),
      location: response.headers.get('location'),
      access: response.cookies.get('access_token')?.value,
      refresh: response.cookies.get('refresh_token')?.value,
    }).toStrictEqual({
      next: '1',
      location: null,
      access: 'fresh-access',
      refresh: 'fresh-refresh',
    });
    // It reads the new token too.
    expect(response.headers.get('x-middleware-request-cookie')).toContain(
      'access_token=fresh-access',
    );
    // No locale prefix for an API route.
    expect(routeI18n).not.toHaveBeenCalled();
  });

  it('lets a CRM API route answer for itself when the session cannot be refreshed', async () => {
    refresh.mockClear();
    routeI18n.mockClear();

    const response = await proxy(exportRequest('refresh_token=expired'));

    // The route's 401 sends the browser to sign in: a redirect here would be downloaded.
    expect(refresh).toHaveBeenCalledOnce();
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('location')).toBeNull();
    expect(routeI18n).not.toHaveBeenCalled();
  });

  it('passes a CRM API request with a session straight through', async () => {
    refresh.mockClear();
    routeI18n.mockClear();

    const response = await proxy(exportRequest('access_token=valid; refresh_token=good'));

    expect(refresh).not.toHaveBeenCalled();
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(routeI18n).not.toHaveBeenCalled();
  });

  describe('with a POST body', () => {
    beforeEach(() => {
      refresh.mockClear();
      routeI18n.mockClear();
      routeI18n.mockImplementation((request) => NextResponse.next({ request }));
    });

    it.each([
      '/sign-in',
      '/fr/sign-up',
      '/app/7/companies/new',
      '/dashboard/users/2',
      '/en/invite/a.b',
      // Any first segment renders `[locale]`: these reach the sign-in page's action too.
      '/api/sign-in',
      '/apix/sign-in',
      '/_vercel/sign-in',
      '/_next/sign-in',
    ])('refuses one over 1 MiB on %s (413) before anything else runs', async (path) => {
      const response = await proxy(postRequest(path, { 'content-length': String(MIB + 1) }));

      expect(response.status).toBe(413);
      expect(refresh).not.toHaveBeenCalled();
      expect(routeI18n).not.toHaveBeenCalled();
    });

    it('refuses one that states no length outside the files page (411)', async () => {
      const response = await proxy(postRequest('/sign-in', { 'transfer-encoding': 'chunked' }));

      expect(response.status).toBe(411);
      expect(routeI18n).not.toHaveBeenCalled();
    });

    it.each([
      ['/dashboard/files', { 'content-length': String(11 * MIB) }],
      ['/fr/dashboard/files', { 'content-length': String(11 * MIB) }],
      ['/dashboard/files', { 'transfer-encoding': 'chunked' }],
    ])('lets the files page take an upload: %s with %o', async (path, headers) => {
      const response = await proxy(postRequest(path, headers));

      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(routeI18n).toHaveBeenCalledOnce();
    });

    it('passes 1 MiB or less on, and a GET whatever it says', async () => {
      const exact = await proxy(postRequest('/sign-in', { 'content-length': String(MIB) }));
      const get = await proxy(
        new NextRequest('http://localhost:3000/sign-in', {
          headers: { 'content-length': String(11 * MIB) },
        }),
      );

      expect([exact.status, get.status]).toStrictEqual([200, 200]);
      expect(routeI18n).toHaveBeenCalledTimes(2);
    });

    // The matcher takes these only for their body: past the check, they go on as before.
    it.each([
      '/en/invite/a.b',
      '/api/sign-in',
      '/apix/sign-in',
      '/_vercel/sign-in',
      '/_next/sign-in',
      '/api/session/expired',
    ])('passes a small body to %s on as if the proxy had not run', async (path) => {
      const response = await proxy(postRequest(path, { 'content-length': '64' }));

      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(refresh).not.toHaveBeenCalled();
      expect(routeI18n).not.toHaveBeenCalled();
    });
  });

  describe('with requests that arrive together with one expired session', () => {
    it.each([2, 5])(
      'refreshes it once for %i requests, and gives every one the same new cookies',
      async (count) => {
        refresh.mockClear();
        routeI18n.mockClear();
        const answer = Promise.withResolvers<{ data?: unknown; response: Response }>();
        refresh.mockReturnValueOnce(answer.promise);
        routeI18n.mockImplementation((request) => NextResponse.next({ request }));

        const responses = Array.from(
          { length: count },
          async () => await proxy(pageRequest('shared')),
        );
        answer.resolve({ data: TOKENS, response: new Response(null, { status: 200 }) });
        const answered = await Promise.all(responses);
        const outcomes = answered.map(outcome);

        expect(refresh).toHaveBeenCalledExactlyOnceWith('/api/v1/auth/refresh', {
          body: { refreshToken: 'shared' },
        });
        expect(outcomes).toStrictEqual(
          Array.from({ length: count }, () => ({
            location: null,
            access: 'fresh-access',
            refresh: 'fresh-refresh',
          })),
        );
      },
    );

    it('ends the session the same way for every request when the one refresh fails', async () => {
      refresh.mockClear();
      routeI18n.mockClear();
      const answer = Promise.withResolvers<{ data?: unknown; response: Response }>();
      refresh.mockReturnValueOnce(answer.promise);

      const responses = Array.from({ length: 3 }, async () => await proxy(pageRequest('refused')));
      answer.resolve({ response: new Response(null, { status: 401 }) });
      const answered = await Promise.all(responses);
      const outcomes = answered.map(outcome);

      expect(refresh).toHaveBeenCalledOnce();
      expect(outcomes).toStrictEqual(
        Array.from({ length: 3 }, () => ({
          location: 'http://localhost:3000/sign-in?next=%2Fapp%2F7%2Fdeals',
          access: undefined,
          refresh: undefined,
        })),
      );
    });

    it('gives a request within 2 s after it the same new tokens, and refreshes again after', async () => {
      refresh.mockClear();
      routeI18n.mockImplementation((request) => NextResponse.next({ request }));
      refresh.mockResolvedValue({ data: TOKENS, response: new Response(null, { status: 200 }) });

      const first = outcome(await proxy(pageRequest('late')));
      vi.advanceTimersByTime(1999);
      const late = outcome(await proxy(pageRequest('late')));

      expect(refresh).toHaveBeenCalledOnce();
      expect(late).toStrictEqual(first);

      vi.advanceTimersByTime(1);
      await proxy(pageRequest('late'));

      expect(refresh).toHaveBeenCalledTimes(2);
      refresh.mockResolvedValue({ response: new Response(null, { status: 401 }) });
    });

    it('keeps no failed refresh: a request just after it asks the backend again', async () => {
      refresh.mockClear();
      routeI18n.mockImplementation((request) => NextResponse.next({ request }));
      refresh.mockResolvedValue({ response: new Response(null, { status: 401 }) });

      await proxy(pageRequest('failed'));
      await proxy(pageRequest('failed'));

      expect(refresh).toHaveBeenCalledTimes(2);
    });

    it('refreshes each refresh token on its own', async () => {
      refresh.mockClear();
      routeI18n.mockImplementation((request) => NextResponse.next({ request }));

      await Promise.all([proxy(pageRequest('one')), proxy(pageRequest('two'))]);

      expect(refresh).toHaveBeenCalledTimes(2);
    });

    it('holds a bounded number of shared refreshes: past it, a request refreshes on its own', async () => {
      refresh.mockClear();
      routeI18n.mockImplementation((request) => NextResponse.next({ request }));
      const answer = Promise.withResolvers<{ data?: unknown; response: Response }>();
      refresh.mockReturnValue(answer.promise);
      // A thousand sessions refreshing at once (or a flood of made-up tokens) fill the map.
      const filling = Array.from(
        { length: 1000 },
        async (_, index) => await proxy(pageRequest(`t${index}`)),
      );

      const extra = [proxy(pageRequest('extra')), proxy(pageRequest('extra'))];

      expect(refresh).toHaveBeenCalledTimes(1002);
      answer.resolve({ response: new Response(null, { status: 401 }) });
      await Promise.all([...filling, ...extra]);
      refresh.mockResolvedValue({ response: new Response(null, { status: 401 }) });
    });
  });
});
