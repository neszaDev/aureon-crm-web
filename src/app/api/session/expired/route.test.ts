import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const { me } = vi.hoisted(() => ({
  // The backend accepts the access token: the session is alive.
  me: vi
    .fn<() => Promise<{ data?: unknown; response: Response }>>()
    .mockResolvedValue({ data: { id: 1 }, response: new Response(null, { status: 200 }) }),
}));

vi.mock(import('server-only'), () => ({}));
// @ts-expect-error -- only the call the route makes
vi.mock(import('@/libs/api/Backend'), () => ({ backend: { GET: me } }));

/**
 * The browser's request to end its session, as a page that got a 401 sends it there.
 * @param search The query string.
 * @param headers Its headers (the cookies, `Sec-Fetch-Site`).
 * @returns The request.
 */
const expired = (search: string, headers: Record<string, string> = {}) =>
  new NextRequest(`http://localhost:3000/api/session/expired${search}`, {
    headers: { cookie: 'access_token=abc; refresh_token=def', ...headers },
  });

/**
 * Where a response sends the browser, and the session cookies it deletes.
 * @param response The route's response.
 * @returns The location and the names of the cookies it clears.
 */
const outcome = (response: Response) => ({
  status: response.status,
  location: response.headers.get('location'),
  cleared: response.headers
    .getSetCookie()
    .filter((cookie) => /^[a-z_]+=;/u.test(cookie) && cookie.includes('Max-Age=0'))
    .map((cookie) => cookie.split('=')[0]),
});

describe(GET, () => {
  it.each([
    ['en', '/en/sign-in?expired=1'],
    ['fr', '/fr/sign-in?expired=1'],
    ['th', '/th/sign-in?expired=1'],
    ['xx', '/en/sign-in?expired=1'],
  ])('ends the session and shows sign-in in the page language (%s)', async (locale, path) => {
    expect(outcome(await GET(expired(`?locale=${locale}`)))).toStrictEqual({
      status: 307,
      location: `http://localhost:3000${path}`,
      cleared: ['access_token', 'refresh_token'],
    });
  });

  it.each(['same-origin', 'none'])(
    'ends it for a request the browser marks %s, as for one without the header',
    async (site) => {
      const response = await GET(expired('?locale=fr', { 'sec-fetch-site': site }));

      expect(outcome(response).cleared).toStrictEqual(['access_token', 'refresh_token']);
      expect(me).not.toHaveBeenCalled();
    },
  );

  describe('for a request another site started (Sec-Fetch-Site: cross-site or same-site)', () => {
    // A sibling subdomain is another site too: the app's own pages send same-origin or none.
    it.each(['cross-site', 'same-site'])(
      'keeps a session the backend still accepts, and goes on to the app (%s)',
      async (site) => {
        me.mockClear();

        const response = await GET(expired('?locale=th', { 'sec-fetch-site': site }));

        expect(outcome(response)).toStrictEqual({
          status: 307,
          location: 'http://localhost:3000/th/app',
          cleared: [],
        });
        expect(me).toHaveBeenCalledExactlyOnceWith('/api/v1/users/me', {
          headers: { Authorization: 'Bearer abc' },
        });
      },
    );

    it('keeps the cookies without an access token, asking the backend nothing', async () => {
      me.mockClear();

      const response = await GET(
        new NextRequest('http://localhost:3000/api/session/expired?locale=fr', {
          headers: { cookie: 'refresh_token=def', 'sec-fetch-site': 'cross-site' },
        }),
      );

      expect(outcome(response)).toStrictEqual({
        status: 307,
        location: 'http://localhost:3000/fr/app',
        cleared: [],
      });
      expect(me).not.toHaveBeenCalled();
    });

    it('keeps the cookies when the backend cannot be reached', async () => {
      me.mockRejectedValueOnce(new TypeError('fetch failed'));

      const response = await GET(expired('', { 'sec-fetch-site': 'cross-site' }));

      expect(outcome(response).cleared).toStrictEqual([]);
    });

    it('still ends a session the backend refuses: a visitor from another site keeps the mark through the redirects', async () => {
      me.mockResolvedValueOnce({ response: new Response(null, { status: 401 }) });

      const response = await GET(expired('?locale=fr', { 'sec-fetch-site': 'cross-site' }));

      expect(outcome(response)).toStrictEqual({
        status: 307,
        location: 'http://localhost:3000/fr/sign-in?expired=1',
        cleared: ['access_token', 'refresh_token'],
      });
    });
  });
});
