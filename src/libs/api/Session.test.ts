import { getLocale } from 'next-intl/server';
import { RequestCookies } from 'next/dist/server/web/spec-extension/cookies';
import type { ResponseCookies } from 'next/dist/server/web/spec-extension/cookies';
import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { redirect } from '@/libs/I18nNavigation';
import { redirectIfUnauthorized } from './Session';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('next/headers'), () => ({ cookies: vi.fn<typeof cookies>() }));
vi.mock(import('next-intl/server'), () => ({ getLocale: vi.fn<typeof getLocale>() }));
vi.mock(import('@/libs/I18nNavigation'), () => ({ redirect: vi.fn<typeof redirect>() }));

/**
 * Makes `cookies()` return the cookies a request sent, recording what the action sets.
 * @param header The request's `Cookie` header.
 * @returns The jar.
 */
const requestWith = (header: string) => {
  const jar = Object.assign(new RequestCookies(new Headers({ cookie: header })), {
    set: vi.fn<ResponseCookies['set']>(),
    delete: vi.fn<ResponseCookies['delete']>(),
  });
  vi.mocked(cookies).mockResolvedValue(jar);

  return jar;
};

const hrefs = () => vi.mocked(redirect).mock.calls.map(([options]) => options.href);

describe(redirectIfUnauthorized, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLocale).mockResolvedValue('fr');
  });

  it('deletes the session the backend rejected and sends the user to sign in', async () => {
    const jar = requestWith('access_token=rejected; refresh_token=r');

    await redirectIfUnauthorized(401);

    expect(jar.set).toHaveBeenCalledTimes(2);
    expect(jar.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'access_token', value: '', maxAge: 0 }),
    );
    expect(jar.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'refresh_token', value: '', maxAge: 0 }),
    );
    expect(redirect).toHaveBeenCalledWith({ href: '/sign-in?expired=1', locale: 'fr' });
  });

  it("keeps the cookies when the request sent no access token (another request's are newer)", async () => {
    const jar = requestWith('refresh_token=r');

    await redirectIfUnauthorized(401);

    expect(jar.set).not.toHaveBeenCalled();
    expect(hrefs()).toStrictEqual(['/sign-in?expired=1']);
  });

  it('comes back to a safe next path only', async () => {
    requestWith('');

    await redirectIfUnauthorized(401, '/invite/abc');
    await redirectIfUnauthorized(401, '//evil.example/invite/abc');

    expect(hrefs()).toStrictEqual([
      '/sign-in?expired=1&next=%2Finvite%2Fabc',
      '/sign-in?expired=1',
    ]);
  });

  it('leaves other statuses alone', async () => {
    const jar = requestWith('access_token=a');

    await redirectIfUnauthorized(403);

    expect(jar.set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
