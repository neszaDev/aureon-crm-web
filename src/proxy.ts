import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { backend } from '@/libs/api/Backend';
import {
  ACCESS_TOKEN_COOKIE,
  isSecureAppUrl,
  REFRESH_TOKEN_COOKIE,
  sessionCookies,
  toSessionTokens,
} from '@/libs/Auth';
import { Env } from '@/libs/Env';
import { routing } from '@/libs/I18nRouting';
import { logger } from '@/libs/Logger';
import { safeNextPath } from '@/libs/SafeRedirect';

const handleI18nRouting = createMiddleware(routing);

const localeGroup = routing.locales.join('|');
const PROTECTED_PATH = new RegExp(`^(/(?:${localeGroup}))?/(?:app|dashboard)(?:/|$)`, 'u');
const AUTH_PAGE_PATH = new RegExp(`^(/(?:${localeGroup}))?/sign-(?:in|up)(?:/|$)`, 'u');
const INVITE_PATH = new RegExp(`^(?:/(?:${localeGroup}))?/invite/`, 'u');

/**
 * Exchanges a refresh token for new tokens. Never throws: a failure means "not signed in".
 * @param refreshToken Current refresh token.
 * @returns New tokens, or `undefined` if the backend rejected the token or is unreachable.
 */
const refreshSession = async (refreshToken: string) => {
  const result = await backend
    .POST('/api/v1/auth/refresh', { body: { refreshToken } })
    .catch((error: unknown) => {
      logger.error('Token refresh failed: backend unreachable', { error: String(error) });
      return null;
    });

  return toSessionTokens(result?.data);
};

/**
 * Tells a server action call (a POST carrying its id) from a page request.
 * @param request The request.
 * @returns Whether it calls a server action.
 */
const isServerAction = (request: NextRequest) =>
  request.method === 'POST' && request.headers.has('next-action');

/**
 * Sends a visitor without a session to sign in, and back to this page afterwards.
 * @param request The request for a protected page.
 * @param localePrefix The page's locale prefix (`/fr`), if any.
 * @returns The redirect.
 */
const redirectToSignIn = (request: NextRequest, localePrefix = '') => {
  const signIn = new URL(`${localePrefix}/sign-in`, request.url);
  // Back here after signing in (`/dashboard` isn't an allowed `next`: plain sign-in).
  const next = safeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`);
  if (next) {
    signIn.searchParams.set('next', next);
  }

  return NextResponse.redirect(signIn);
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // An empty cookie is no session (a server action that ends one forwards `access_token=`).
  const hasAccessToken = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);

  const protectedMatch = PROTECTED_PATH.exec(pathname);
  // The CRM's own routes the browser fetches (the CSV export): no locale, but a session as fresh
  // as the page's.
  const crmApi = pathname.startsWith('/api/crm/');
  // An API route takes the request as it is; a page goes through i18n routing.
  const pass = () =>
    crmApi
      ? NextResponse.next({ request: { headers: request.headers } })
      : handleI18nRouting(request);
  // Invitation pages are public, but they tell a signed-in visitor apart: refresh their session
  // too, without sending anyone to sign in.
  if ((protectedMatch || crmApi || INVITE_PATH.test(pathname)) && !hasAccessToken) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const tokens = refreshToken ? await refreshSession(refreshToken) : undefined;

    if (!tokens) {
      // Don't delete cookies here: a parallel request may have just rotated them successfully.
      // A server action runs anyway: its own 401 handling sends the browser to sign in, while a
      // redirect here makes the client re-post the action to sign-in and throw. A CRM API route
      // answers its own 401 too: the browser fetched it, and would take a redirect for the file.
      return protectedMatch && !isServerAction(request)
        ? redirectToSignIn(request, protectedMatch[1])
        : pass();
    }

    const cookies = sessionCookies(tokens, isSecureAppUrl(Env.APP_URL));
    // Update the request so this render already sees the new token, and the response so the
    // browser stores it.
    for (const cookie of cookies) {
      request.cookies.set(cookie.name, cookie.value);
    }
    const response = pass();
    for (const cookie of cookies) {
      response.cookies.set(cookie);
    }
    return response;
  }

  if (crmApi) {
    return pass();
  }

  const authPageMatch = AUTH_PAGE_PATH.exec(pathname);
  if (authPageMatch && hasAccessToken) {
    const next = safeNextPath(request.nextUrl.searchParams.get('next')) ?? '/app';
    return NextResponse.redirect(new URL(`${authPageMatch[1] ?? ''}${next}`, request.url));
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/_next`, `/_vercel` or `api`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  // and the CRM's API routes, which only get their session refreshed.
  matcher: ['/((?!_next|_vercel|api|.*\\..*).*)', '/api/crm/:path*'],
};
