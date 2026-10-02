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

const handleI18nRouting = createMiddleware(routing);

const localeGroup = routing.locales.join('|');
const PROTECTED_PATH = new RegExp(`^(/(?:${localeGroup}))?/dashboard(?:/|$)`, 'u');
const AUTH_PAGE_PATH = new RegExp(`^(/(?:${localeGroup}))?/sign-(?:in|up)(?:/|$)`, 'u');

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
  const hasAccessToken = request.cookies.has(ACCESS_TOKEN_COOKIE);

  const protectedMatch = PROTECTED_PATH.exec(pathname);
  if (protectedMatch && !hasAccessToken) {
    const localePrefix = protectedMatch[1] ?? '';
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const tokens = refreshToken ? await refreshSession(refreshToken) : undefined;

    if (!tokens) {
      // Don't delete cookies here: a parallel request may have just rotated them successfully.
      return NextResponse.redirect(new URL(`${localePrefix}/sign-in`, request.url));
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
    return NextResponse.redirect(new URL(`${authPageMatch[1] ?? ''}/dashboard`, request.url));
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/_next`, `/_vercel` or `api`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!_next|_vercel|api|.*\\..*).*)',
};
