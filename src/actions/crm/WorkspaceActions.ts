'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import type { ActionResult } from '@/libs/api/ApiError';
import { toActionError } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import { redirectIfUnauthorized } from '@/libs/api/Session';
import { redirect } from '@/libs/I18nNavigation';
import type { WorkspaceValues } from '@/validations/crm/WorkspaceValidation';
import { WorkspaceValidation } from '@/validations/crm/WorkspaceValidation';

/**
 * Creates a workspace owned by the signed-in user (`POST /workspaces`) and opens it.
 * @param values Form values.
 * @returns Field or form errors; on success it redirects to the new workspace instead.
 */
export async function createWorkspace(values: WorkspaceValues): Promise<ActionResult> {
  const t = await getTranslations('WorkspaceForm');
  const parsed = WorkspaceValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { data, error, response } = await api.POST('/api/v1/workspaces', { body: parsed.data });
  await redirectIfUnauthorized(response.status);
  if (!response.ok || data?.id === undefined) {
    return toActionError(error, t('error_generic'));
  }

  return redirect({ href: `/app/${data.id}`, locale: await getLocale() });
}
