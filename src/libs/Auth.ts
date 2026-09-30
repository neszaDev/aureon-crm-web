import type { components } from '@/libs/api/schema';

/** httpOnly cookie holding the backend access token (JWT). Never readable by browser JS. */
export const ACCESS_TOKEN_COOKIE = 'access_token';
/** httpOnly cookie holding the backend refresh token (opaque, rotates on every use). */
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
/** Drop the access cookie slightly before the JWT expires so the proxy refreshes in time. */
const ACCESS_EXPIRY_MARGIN_SECONDS = 30;

/** Tokens returned by `/auth/register`, `/auth/login` and `/auth/refresh`. */
export type SessionTokens = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
};

/** Cookie as accepted by both `cookies().set()` and `NextResponse.cookies.set()`. */
export type SessionCookie = {
  name: string;
  value: string;
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: '/';
  maxAge: number;
};

/**
 * Validates a backend token response (all fields are optional in the generated types).
 * @param body Response body of a successful auth call.
 * @returns The tokens, or `undefined` when a field is missing.
 */
export const toSessionTokens = (
  body?: components['schemas']['AuthTokensResponse'],
): SessionTokens | undefined => {
  if (!body?.accessToken || !body.refreshToken || !body.expiresIn || !body.refreshExpiresIn) {
    return undefined;
  }

  return {
    accessToken: body.accessToken,
    expiresIn: body.expiresIn,
    refreshToken: body.refreshToken,
    refreshExpiresIn: body.refreshExpiresIn,
  };
};

/**
 * Builds the two session cookies. Each cookie expires with its token, so a missing access
 * cookie means "refresh needed" and a missing refresh cookie means "signed out".
 * @param tokens Tokens from the backend.
 * @param secure Whether to set the `Secure` attribute (true when the app is served over https).
 * @returns The access and refresh cookies.
 */
export const sessionCookies = (tokens: SessionTokens, secure: boolean): SessionCookie[] => {
  const base = { httpOnly: true, sameSite: 'lax', secure, path: '/' } as const;

  return [
    {
      ...base,
      name: ACCESS_TOKEN_COOKIE,
      value: tokens.accessToken,
      maxAge: Math.max(tokens.expiresIn - ACCESS_EXPIRY_MARGIN_SECONDS, 1),
    },
    {
      ...base,
      name: REFRESH_TOKEN_COOKIE,
      value: tokens.refreshToken,
      maxAge: tokens.refreshExpiresIn,
    },
  ];
};

/**
 * Tells whether auth cookies must be `Secure`.
 * @param appUrl Public URL of the app.
 * @returns True when the app is served over https.
 */
export const isSecureAppUrl = (appUrl: string) => appUrl.startsWith('https://');
