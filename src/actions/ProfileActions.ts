'use server';

import { getTranslations } from 'next-intl/server';
import { refresh } from 'next/cache';
import { cookies } from 'next/headers';
import { actionFailure } from '@/libs/api/ActionFailure';
import type { ActionResult } from '@/libs/api/ApiError';
import { isApiError } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import { rateLimited } from '@/libs/api/RateLimit';
import { isSecureAppUrl, sessionCookies, toSessionTokens } from '@/libs/Auth';
import { Env } from '@/libs/Env';
import type { PasswordChangeValues, ProfileValues } from '@/validations/ProfileValidation';
import { PasswordChangeValidation, ProfileValidation } from '@/validations/ProfileValidation';

/**
 * Sets or clears the signed-in user's display name (`PUT /users/me`); the avatar follows it.
 * @param values Form values; an empty name clears it.
 * @returns Success, or field and form errors.
 */
export async function updateProfile(values: ProfileValues): Promise<ActionResult> {
  const t = await getTranslations('ProfileForm');
  const parsed = ProfileValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.PUT('/api/v1/users/me', {
    body: { displayName: parsed.data.displayName || undefined },
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Changes the signed-in user's password (`POST /users/me/password`). The backend ends every
 * other session and answers with new tokens, stored here as `startSession` does, so this
 * browser stays signed in (no redirect).
 * @param values Current and new password.
 * @returns Success, or field and form errors (a wrong current password, too many attempts).
 */
export async function changePassword(values: PasswordChangeValues): Promise<ActionResult> {
  const t = await getTranslations('PasswordForm');
  const parsed = PasswordChangeValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { data, error, response } = await api.POST('/api/v1/users/me/password', {
    body: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword },
  });
  if (response.status === 429) {
    return await rateLimited(response);
  }
  // The generated types declare no error bodies, so `error` is typed `never`.
  const body: unknown = error;
  if (response.status === 400 && isApiError(body) && body.fieldErrors?.currentPassword) {
    return { ok: false, fieldErrors: { currentPassword: t('error_wrong_password') } };
  }
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  const tokens = toSessionTokens(data);
  if (!tokens) {
    return { ok: false, message: t('error_generic') };
  }
  const jar = await cookies();
  for (const cookie of sessionCookies(tokens, isSecureAppUrl(Env.APP_URL))) {
    jar.set(cookie);
  }

  return { ok: true };
}
