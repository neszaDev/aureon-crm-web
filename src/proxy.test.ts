import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
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

describe(proxy, () => {
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
});
