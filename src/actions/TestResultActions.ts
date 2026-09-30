'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/libs/api/ApiError';
import { toActionError } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import { redirect } from '@/libs/I18nNavigation';
import type { TestResultValues } from '@/validations/TestResultValidation';
import { TestResultValidation } from '@/validations/TestResultValidation';

/**
 * Sends the user to sign in when the backend no longer accepts the session.
 * @param status HTTP status of the backend response.
 */
const redirectIfUnauthorized = async (status: number) => {
  if (status === 401) {
    redirect({ href: '/sign-in', locale: await getLocale() });
  }
};

/**
 * Creates a test result for the signed-in user (`POST /test-results`).
 * @param values Form values.
 * @returns Success, or field/form errors from validation or the backend.
 */
export async function createTestResult(values: TestResultValues): Promise<ActionResult> {
  const t = await getTranslations('TestResultForm');
  const parsed = TestResultValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.POST('/api/v1/test-results', { body: parsed.data });
  await redirectIfUnauthorized(response.status);
  if (!response.ok) {
    return toActionError(error, t('error_generic'));
  }

  revalidatePath('/[locale]/dashboard/test-results', 'page');
  return { ok: true };
}

/**
 * Deletes one of the signed-in user's test results (`DELETE /test-results/{id}`).
 * @param id Test result id.
 */
export async function deleteTestResult(id: number) {
  const api = await authedBackend();
  const { response } = await api.DELETE('/api/v1/test-results/{id}', {
    params: { path: { id } },
  });
  await redirectIfUnauthorized(response.status);
  revalidatePath('/[locale]/dashboard/test-results', 'page');
}
