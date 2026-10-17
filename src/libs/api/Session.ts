import 'server-only';
import { getLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { redirect as redirectToUrl } from 'next/navigation';
import { clearedSessionCookies, isSecureAppUrl } from '@/libs/Auth';
import { Env } from '@/libs/Env';
import { redirect } from '@/libs/I18nNavigation';

/**
 * Ends a session the backend rejected (HTTP 401) while a page or layout renders. Those can't
 * delete cookies, so `/api/session/expired` does it and shows sign-in with a notice.
 * @param locale The page's locale.
 * @returns Never: it redirects.
 */
export const endRejectedSession = (locale: string) =>
  redirectToUrl(`/api/session/expired?locale=${encodeURIComponent(locale)}`);

/**
 * Ends the session when the backend no longer accepts it (HTTP 401) in a server action: deletes
 * the session cookies and sends the user to sign in with a notice.
 * @param status HTTP status of the backend response.
 */
export const redirectIfUnauthorized = async (status: number) => {
  if (status === 401) {
    const jar = await cookies();
    for (const cookie of clearedSessionCookies(isSecureAppUrl(Env.APP_URL))) {
      jar.set(cookie);
    }
    redirect({ href: '/sign-in?expired=1', locale: await getLocale() });
  }
};
