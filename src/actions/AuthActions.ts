'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import type { ActionResult } from '@/libs/api/ApiError';
import { toActionError } from '@/libs/api/ApiError';
import { backend } from '@/libs/api/Backend';
import { rateLimited } from '@/libs/api/RateLimit';
import { forwardedFor, startSession } from '@/libs/api/Session';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/libs/Auth';
import { redirect } from '@/libs/I18nNavigation';
import { safeNextPath } from '@/libs/SafeRedirect';
import type { AuthValues } from '@/validations/AuthValidation';
import { SignInValidation, SignUpValidation } from '@/validations/AuthValidation';

/**
 * Signs in through the backend (`POST /auth/login`).
 * @param values Email and password from the form.
 * @param next The page's `next` query parameter (untrusted; checked before use).
 * @returns Field or form errors; on success it redirects instead of returning.
 */
export async function signIn(values: AuthValues, next?: unknown): Promise<ActionResult> {
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

  return await startSession(data, next);
}

/**
 * Creates an account through the backend (`POST /auth/register`) and signs in.
 * @param values Email and password from the form.
 * @param next The page's `next` query parameter (untrusted; checked before use).
 * @returns Field or form errors; on success it redirects instead of returning.
 */
export async function signUp(values: AuthValues, next?: unknown): Promise<ActionResult> {
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

  return await startSession(data, next);
}

/**
 * Revokes the refresh token on the backend, clears the session cookies and goes home.
 * @param next Where to go instead (untrusted; only what `safeNextPath` accepts), e.g. back to
 *   an invitation to use it with another account. A form passes its `FormData`: ignored.
 */
export async function signOut(next?: unknown) {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    // Best effort: the local session ends even if the backend is unreachable.
    await backend.POST('/api/v1/auth/logout', { body: { refreshToken } }).catch(() => null);
  }

  jar.delete(ACCESS_TOKEN_COOKIE);
  jar.delete(REFRESH_TOKEN_COOKIE);
  redirect({ href: safeNextPath(next) ?? '/', locale: await getLocale() });
}
