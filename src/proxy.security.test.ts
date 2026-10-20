import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { backend } from '@/libs/api/Backend';
import proxy, { config } from './proxy';

// @ts-expect-error -- only the call the proxy makes
vi.mock(import('@/libs/api/Backend'), () => ({
  backend: { POST: vi.fn<(typeof backend)['POST']>() },
}));
// Locale routing isn't under test (and its ESM build can't load in Node): it passes requests on.
vi.mock(import('next-intl/middleware'), () => ({ default: () => () => NextResponse.next() }));
// Served over https, as in production.
// @ts-expect-error -- only what the proxy and the logger read
vi.mock(import('@/libs/Env'), () => ({
  Env: {
    APP_URL: 'https://crm.example',
    BACKEND_URL: 'http://backend.test',
    NEXT_PUBLIC_LOGGING_LEVEL: 'error',
  },
}));

/**
 * Tells whether a request for the path goes through the proxy.
 * @param path The path.
 * @returns Whether the proxy's matcher takes it.
 */
const runsOn = (path: string) =>
  unstable_doesMiddlewareMatch({ config, url: `https://crm.example${path}` });

describe('proxy security', () => {
  it("runs on every locale's CRM and demo pages, their file route and the CRM's API routes", () => {
    const guarded = [
      '/app',
      '/fr/app/7/companies/3',
      '/th/app/7/settings/members',
      '/dashboard',
      '/fr/dashboard/users/2',
      '/dashboard/files/4/content',
      '/api/crm/7/export/companies',
      '/invite/abc',
    ];

    expect(guarded.filter((path) => !runsOn(path))).toStrictEqual([]);
  });

  it('leaves out only the session route, static files and paths with a dot', () => {
    // Pages behind a path with a dot still ask the backend, which refuses them without a token
    // (Security.e2e.ts); the session route must stay outside, or ending a session would loop.
    const outside = [
      '/api/session/expired',
      '/_next/static/chunks/app.js',
      '/favicon.ico',
      '/fr/app/7/companies/3.json',
    ];

    expect(outside.filter((path) => runsOn(path))).toStrictEqual([]);
  });

  it('stores a refreshed session in Secure, httpOnly, SameSite=Lax cookies over https', async () => {
    vi.mocked(backend.POST).mockResolvedValue({
      data: {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: 900,
        refreshExpiresIn: 2_592_000,
      },
    });

    const response = await proxy(
      new NextRequest('https://crm.example/app', { headers: { cookie: 'refresh_token=old' } }),
    );

    const cookies = response.headers.getSetCookie();
    expect(cookies.map((cookie) => cookie.split(';')[0])).toStrictEqual([
      'access_token=new-access',
      'refresh_token=new-refresh',
    ]);
    for (const cookie of cookies) {
      expect(cookie).toMatch(/; Secure(?:;|$)/u);
      expect(cookie).toMatch(/; HttpOnly(?:;|$)/u);
      expect(cookie).toMatch(/; SameSite=lax(?:;|$)/u);
      expect(cookie).toMatch(/; Path=\/(?:;|$)/u);
    }
  });
});
