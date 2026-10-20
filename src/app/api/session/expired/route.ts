import { hasLocale } from 'next-intl';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { backend } from '@/libs/api/Backend';
import { ACCESS_TOKEN_COOKIE, clearedSessionCookies, isSecureAppUrl } from '@/libs/Auth';
import { Env } from '@/libs/Env';
import { routing } from '@/libs/I18nRouting';

/**
 * Tells whether the backend refuses an access token (HTTP 401): the session is over anyway.
 * @param token The access token, if the request sent one.
 * @returns True only for a refusal; no token, or no answer, isn't one.
 */
const isRefused = async (token?: string) => {
  if (!token) {
    return false;
  }
  const result = await backend
    .GET('/api/v1/users/me', { headers: { Authorization: `Bearer ${token}` } })
    .catch(() => null);

  return result?.response.status === 401;
};

/**
 * Ends a session the backend rejected (HTTP 401) and shows sign-in with a notice. Pages and
 * layouts can't delete cookies, so they redirect here (`/api` is outside the proxy); sending
 * them to sign-in directly would loop, since the proxy still sees the access cookie. Another
 * site's link or form can't sign anyone out with it (logout CSRF): a request the browser marks
 * `Sec-Fetch-Site: cross-site` or `same-site` (a sibling subdomain; the app's own pages send
 * `same-origin` or `none`) ends the session only when the backend refuses its access token, and
 * otherwise goes on to the app, signed in as it was. Not a plain refusal: a visitor who followed
 * another site's link to a page whose session the backend rejects arrives here still marked
 * cross-site (the mark holds through redirects), and must still be signed out, or loop.
 * @param request The request; `?locale=` picks the language of the sign-in page.
 * @returns A redirect to `/{locale}/sign-in?expired=1` that deletes both session cookies, or to
 *   `/{locale}/app` without touching them.
 */
export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get('locale');
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const site = request.headers.get('sec-fetch-site');
  if (
    (site === 'cross-site' || site === 'same-site') &&
    !(await isRefused(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value))
  ) {
    return NextResponse.redirect(new URL(`/${locale}/app`, request.url));
  }

  const response = NextResponse.redirect(new URL(`/${locale}/sign-in?expired=1`, request.url));
  for (const cookie of clearedSessionCookies(isSecureAppUrl(Env.APP_URL))) {
    response.cookies.set(cookie);
  }

  return response;
}
