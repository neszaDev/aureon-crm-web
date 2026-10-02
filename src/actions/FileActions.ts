'use server';

import { getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/libs/api/ApiError';
import { toActionError } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import { redirectIfUnauthorized } from '@/libs/api/Session';

/**
 * Uploads one file for the signed-in user (`POST /files`, multipart).
 * @param form Form data with the file under `file`.
 * @returns Success, or a translated reason the backend refused it.
 */
export async function uploadFile(form: FormData): Promise<ActionResult> {
  const t = await getTranslations('FilesPage');
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: t('error_empty') };
  }

  const body = new FormData();
  body.append('file', file, file.name);
  const api = await authedBackend();
  const { error, response } = await api.POST('/api/v1/files', {
    // The spec types the binary part as a string; the serializer sends the real file.
    body: { file: file.name },
    bodySerializer: () => body,
  });
  await redirectIfUnauthorized(response.status);
  if (!response.ok) {
    const reasons: Record<number, string> = {
      400: t('error_empty'),
      413: t('error_too_large'),
      415: t('error_type'),
    };
    return reasons[response.status]
      ? { ok: false, message: reasons[response.status] }
      : toActionError(error, t('error_generic'));
  }

  revalidatePath('/[locale]/dashboard/files', 'page');
  return { ok: true };
}

/**
 * Deletes one of the signed-in user's files (`DELETE /files/{id}`).
 * @param id File id.
 */
export async function deleteFile(id: number) {
  const api = await authedBackend();
  const { response } = await api.DELETE('/api/v1/files/{id}', { params: { path: { id } } });
  await redirectIfUnauthorized(response.status);
  revalidatePath('/[locale]/dashboard/files', 'page');
}
