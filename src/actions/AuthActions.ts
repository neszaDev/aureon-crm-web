'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import type { ActionResult } from '@/libs/api/ApiError';
import { toActionError } from '@/libs/api/ApiError';
import { backend } from '@/libs/api/Backend';
import { clientIpFrom } from '@/libs/api/ClientIp';
import {
  ACCESS_TOKEN_COOKIE,
  isSecureAppUrl,
  REFRESH_TOKEN_COOKIE,
  sessionCookies,
  toSessionTokens,
} from '@/libs/Auth';
import { Env } from '@/libs/Env';
import { redirect } from '@/libs/I18nNavigation';
import type { AuthValues } from '@/validations/AuthValidation';
import { SignInValidation, SignUpValidation } from '@/validations/AuthValidation';

/**
 * Stores the backend tokens as httpOnly cookies and sends the user to the dashboard.
 * @param body Token response from the backend.
 * @returns Only returns (with an error) if the response has no usable tokens.
 */
const startSession = async (body: Parameters<typeof toSessionTokens>[0]) => {
  const tokens = toSessionTokens(body);
  if (!tokens) {
    const t = await getTranslations('AuthForm');
    return { ok: false, message: t('error_generic') } satisfies ActionResult;
  }

  const jar = await cookies();
  for (const cookie of sessionCookies(tokens, isSecureAppUrl(Env.APP_URL))) {
    jar.set(cookie);
  }

  return redirect({ href: '/dashboard', locale: await getLocale() });
};

/**
 * Passes the browser's address on, so the backend rate-limits each client and not this server.
 * @returns Headers for the backend's sign-in and registration calls.
 */
const forwardedFor = async () => {
  const incoming = await headers();
  const ip = clientIpFrom(incoming.get('x-forwarded-for'));

  return ip ? { 'X-Forwarded-For': ip } : {};
};

/**
 * The form message for a backend 429: how long to wait, rounded up to whole minutes.
 * @param response The backend response.
 * @returns The translated message.
 */
const rateLimited = async (response: Response) => {
  const t = await getTranslations('AuthForm');
  const seconds = Number(response.headers.get('Retry-After'));

  return {
    ok: false,
    message: t('error_rate_limited', {
      minutes: Math.max(1, Math.ceil((Number.isFinite(seconds) ? seconds : 60) / 60)),
    }),
  } satisfies ActionResult;
};

/**
 * Signs in through the backend (`POST /auth/login`).
 * @param values Email and password from the form.
 * @returns Field or form errors; on success it redirects instead of returning.
 */
export async function signIn(values: AuthValues): Promise<ActionResult> {
  const t = await getTranslations('AuthForm');
  const parsed = SignInValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const { data, error, response } = await backend.POST('/api/v1/auth/login', {
    body: parsed.data,
    headers: await forwardedFor(),
  });
  if (!data) {
    if (response.status === 429) {
      return await rateLimited(response);
    }
    return response.status === 401
      ? { ok: false, message: t('error_invalid_credentials') }
      : toActionError(error, t('error_generic'));
  }

  return await startSession(data);
}

/**
 * Creates an account through the backend (`POST /auth/register`) and signs in.
 * @param values Email and password from the form.
 * @returns Field or form errors; on success it redirects instead of returning.
 */
export async function signUp(values: AuthValues): Promise<ActionResult> {
  const t = await getTranslations('AuthForm');
  const parsed = SignUpValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const { data, error, response } = await backend.POST('/api/v1/auth/register', {
    body: parsed.data,
    headers: await forwardedFor(),
  });
  if (!data) {
    if (response.status === 429) {
      return await rateLimited(response);
    }
    return response.status === 409
      ? { ok: false, fieldErrors: { email: t('error_email_taken') } }
      : toActionError(error, t('error_generic'));
  }

  return await startSession(data);
}

/** Revokes the refresh token on the backend, clears the session cookies and goes home. */
export async function signOut() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    // Best effort: the local session ends even if the backend is unreachable.
    await backend.POST('/api/v1/auth/logout', { body: { refreshToken } }).catch(() => null);
  }

  jar.delete(ACCESS_TOKEN_COOKIE);
  jar.delete(REFRESH_TOKEN_COOKIE);
  redirect({ href: '/', locale: await getLocale() });
}
