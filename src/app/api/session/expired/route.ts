import { hasLocale } from 'next-intl';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { clearedSessionCookies, isSecureAppUrl } from '@/libs/Auth';
import { Env } from '@/libs/Env';
import { routing } from '@/libs/I18nRouting';

/**
 * Ends a session the backend rejected (HTTP 401) and shows sign-in with a notice. Pages and
 * layouts can't delete cookies, so they redirect here (`/api` is outside the proxy); sending
 * them to sign-in directly would loop, since the proxy still sees the access cookie.
 * @param request The request; `?locale=` picks the language of the sign-in page.
 * @returns A redirect to `/{locale}/sign-in?expired=1` that deletes both session cookies.
 */
export function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get('locale');
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const response = NextResponse.redirect(new URL(`/${locale}/sign-in?expired=1`, request.url));
  for (const cookie of clearedSessionCookies(isSecureAppUrl(Env.APP_URL))) {
    response.cookies.set(cookie);
  }

  return response;
}
