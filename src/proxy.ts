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

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // An empty cookie is no session (a server action that ends one forwards `access_token=`).
  const hasAccessToken = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);

  const protectedMatch = PROTECTED_PATH.exec(pathname);
  // Invitation pages are public, but they tell a signed-in visitor apart: refresh their session
  // too, without sending anyone to sign in.
  if ((protectedMatch || INVITE_PATH.test(pathname)) && !hasAccessToken) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const tokens = refreshToken ? await refreshSession(refreshToken) : undefined;

    if (!tokens && !protectedMatch) {
      return handleI18nRouting(request);
    }
    if (!tokens) {
      // Don't delete cookies here: a parallel request may have just rotated them successfully.
      const signIn = new URL(`${protectedMatch?.[1] ?? ''}/sign-in`, request.url);
      // Back here after signing in (`/dashboard` isn't an allowed `next`: plain sign-in).
      const next = safeNextPath(`${pathname}${request.nextUrl.search}`);
      if (next) {
        signIn.searchParams.set('next', next);
      }
      return NextResponse.redirect(signIn);
    }

    const cookies = sessionCookies(tokens, isSecureAppUrl(Env.APP_URL));
    // Update the request so this render already sees the new token, and the response so the
    // browser stores it.
    for (const cookie of cookies) {
      request.cookies.set(cookie.name, cookie.value);
    }
    const response = handleI18nRouting(request);
    for (const cookie of cookies) {
      response.cookies.set(cookie);
    }
    return response;
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
  matcher: '/((?!_next|_vercel|api|.*\\..*).*)',
};
