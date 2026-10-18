'use server';

import { getTranslations } from 'next-intl/server';
import { refresh } from 'next/cache';
import { actionFailure } from '@/libs/api/ActionFailure';
import type { ActionResult } from '@/libs/api/ApiError';
import { errorCode } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import type {
  LeadSourceUpdateValues,
  LeadSourceValues,
} from '@/validations/crm/LeadSourceValidation';
import {
  LeadSourceUpdateValidation,
  LeadSourceValidation,
} from '@/validations/crm/LeadSourceValidation';

/**
 * The result of a failed source write: a duplicate name is the name field's error.
 * @param response The backend response.
 * @param error Its parsed error body.
 * @returns The name field error, or the general failure.
 */
const sourceFailure = async (response: Response, error: unknown) => {
  if (errorCode(error) === 'DUPLICATE_NAME') {
    const t = await getTranslations('SourceList');
    return { ok: false, fieldErrors: { name: t('error_name_taken') } } satisfies ActionResult;
  }

  return await actionFailure(response, error);
};

/**
 * Adds a lead source (`POST /workspaces/{id}/lead-sources`).
 * @param workspaceId The workspace.
 * @param values The name.
 * @returns Success, or field and form errors.
 */
export async function createLeadSource(
  workspaceId: number,
  values: LeadSourceValues,
): Promise<ActionResult> {
  const t = await getTranslations('SourceList');
  const parsed = LeadSourceValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.POST('/api/v1/workspaces/{workspaceId}/lead-sources', {
    params: { path: { workspaceId } },
    body: parsed.data,
  });
  if (!response.ok) {
    return await sourceFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Renames, archives or restores a lead source (`PUT /workspaces/{id}/lead-sources/{id}`). An
 * archived source stays on the records that use it but is offered no more.
 * @param workspaceId The workspace.
 * @param sourceId The source.
 * @param version The version the row was read at.
 * @param values Its name and whether it is archived (both always sent).
 * @returns Success, or field and form errors.
 */
export async function updateLeadSource(
  workspaceId: number,
  sourceId: number,
  version: number,
  values: LeadSourceUpdateValues,
): Promise<ActionResult> {
  const t = await getTranslations('SourceList');
  const parsed = LeadSourceUpdateValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.PUT('/api/v1/workspaces/{workspaceId}/lead-sources/{id}', {
    params: { path: { workspaceId, id: sourceId } },
    body: { ...parsed.data, version },
  });
  if (!response.ok) {
    return await sourceFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Deletes a lead source (`DELETE /workspaces/{id}/lead-sources/{id}`).
 * @param workspaceId The workspace.
 * @param sourceId The source.
 * @returns Success, or the translated refusal (409 while records use it: archive it instead).
 */
export async function deleteLeadSource(
  workspaceId: number,
  sourceId: number,
): Promise<ActionResult> {
  const api = await authedBackend();
  const { error, response } = await api.DELETE(
    '/api/v1/workspaces/{workspaceId}/lead-sources/{id}',
    { params: { path: { workspaceId, id: sourceId } } },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}
