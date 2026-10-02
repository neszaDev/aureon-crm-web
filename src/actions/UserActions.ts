'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/libs/api/ApiError';
import { toActionError } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import { redirectIfUnauthorized } from '@/libs/api/Session';
import { redirect } from '@/libs/I18nNavigation';
import type { UpdateUserValues } from '@/validations/UserValidation';
import { UpdateUserValidation } from '@/validations/UserValidation';

/**
 * Changes a user's email and role (`PATCH /users/{id}`, admins only). The backend refuses
 * changes to your own account and taken emails.
 * @param id User id.
 * @param values Form values.
 * @returns Success, or field/form errors from validation or the backend.
 */
export async function updateUser(id: number, values: UpdateUserValues): Promise<ActionResult> {
  const t = await getTranslations('UserForm');
  const parsed = UpdateUserValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.PATCH('/api/v1/users/{id}', {
    params: { path: { id } },
    body: parsed.data,
  });
  await redirectIfUnauthorized(response.status);
  if (response.status === 409) {
    // The page offers no form for your own account, so a conflict is a taken email.
    return { ok: false, fieldErrors: { email: t('error_email_taken') } };
  }
  if (!response.ok) {
    return toActionError(error, t('error_generic'));
  }

  revalidatePath('/[locale]/dashboard/users', 'layout');
  return { ok: true };
}

/**
 * Deletes a user with their data (`DELETE /users/{id}`, admins only) and returns to the list.
 * @param id User id.
 * @returns A form error; on success it redirects instead of returning.
 */
export async function deleteUser(id: number): Promise<ActionResult> {
  const t = await getTranslations('UserForm');
  const api = await authedBackend();
  const { error, response } = await api.DELETE('/api/v1/users/{id}', {
    params: { path: { id } },
  });
  await redirectIfUnauthorized(response.status);
  if (!response.ok && response.status !== 404) {
    return toActionError(error, t('error_generic'));
  }

  revalidatePath('/[locale]/dashboard/users', 'layout');
  return redirect({ href: '/dashboard/users', locale: await getLocale() });
}
