import 'server-only';
import { getLocale, getTranslations } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { redirect as redirectToUrl } from 'next/navigation';
import type { ActionResult } from '@/libs/api/ApiError';
import { clientIpFrom } from '@/libs/api/ClientIp';
import {
  ACCESS_TOKEN_COOKIE,
  clearedSessionCookies,
  isSecureAppUrl,
  sessionCookies,
  toSessionTokens,
} from '@/libs/Auth';
import { Env } from '@/libs/Env';
import { redirect } from '@/libs/I18nNavigation';
import { safeNextPath } from '@/libs/SafeRedirect';

// Not in a 'use server' file: every export there is an action anyone can call, and these must
// only run after the backend issued the tokens.

/**
 * Stores the backend tokens as httpOnly cookies and sends the user on, in a server action.
 * @param body Token response from the backend (sign-in, sign-up, invitation sign-up).
 * @param next Where the user was going; followed only if `safeNextPath` accepts it, else `/app`.
 * @returns Only returns (with an error) if the response has no usable tokens.
 */
export const startSession = async (body: Parameters<typeof toSessionTokens>[0], next: unknown) => {
  const tokens = toSessionTokens(body);
  if (!tokens) {
    const t = await getTranslations('AuthForm');
    return { ok: false, message: t('error_generic') } satisfies ActionResult;
  }

  const jar = await cookies();
  for (const cookie of sessionCookies(tokens, isSecureAppUrl(Env.APP_URL))) {
    jar.set(cookie);
  }

  return redirect({ href: safeNextPath(next) ?? '/app', locale: await getLocale() });
};

/**
 * Passes the browser's address on, so the backend rate-limits each client and not this server.
 * @returns Headers for the backend's sign-in and registration calls.
 */
export const forwardedFor = async () => {
  const incoming = await headers();
  const ip = clientIpFrom(incoming.get('x-forwarded-for'));

  return ip ? { 'X-Forwarded-For': ip } : {};
};

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
 * @param next Where to come back to after signing in (only what `safeNextPath` accepts).
 */
export const redirectIfUnauthorized = async (status: number, next?: string) => {
  if (status === 401) {
    const jar = await cookies();
    // Only the token this request sent was rejected. Without one, the cookies the browser holds
    // now may be newer (a parallel request won the refresh race): keep them.
    if (jar.get(ACCESS_TOKEN_COOKIE)?.value) {
      for (const cookie of clearedSessionCookies(isSecureAppUrl(Env.APP_URL))) {
        jar.set(cookie);
      }
    }
    const query = new URLSearchParams({ expired: '1' });
    const back = safeNextPath(next);
    if (back) {
      query.set('next', back);
    }
    redirect({ href: `/sign-in?${query.toString()}`, locale: await getLocale() });
  }
};
