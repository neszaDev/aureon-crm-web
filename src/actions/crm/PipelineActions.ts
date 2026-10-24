'use server';

import { getTranslations } from 'next-intl/server';
import { refresh } from 'next/cache';
import { actionFailure } from '@/libs/api/ActionFailure';
import type { ActionResult } from '@/libs/api/ApiError';
import { errorCode } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import type { Stage } from '@/libs/crm/Stages';
import { toStages } from '@/libs/crm/Stages';
import type { StageValues } from '@/validations/crm/PipelineValidation';
import { StageValidation } from '@/validations/crm/PipelineValidation';

/**
 * The result of a failed stage write: a duplicate name is the name field's error.
 * @param response The backend response.
 * @param error Its parsed error body.
 * @returns The name field error, or the general failure.
 */
const stageFailure = async (response: Response, error: unknown) => {
  if (errorCode(error) === 'DUPLICATE_NAME') {
    const t = await getTranslations('StageList');
    return { ok: false, fieldErrors: { name: t('error_name_taken') } } satisfies ActionResult;
  }

  return await actionFailure(response, error);
};

/**
 * Adds an open stage after the open ones (`POST /workspaces/{id}/pipeline-stages`).
 * @param workspaceId The workspace.
 * @param values Name and probability.
 * @returns Success, or field and form errors.
 */
export async function createStage(workspaceId: number, values: StageValues): Promise<ActionResult> {
  const t = await getTranslations('StageList');
  const parsed = StageValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.POST('/api/v1/workspaces/{workspaceId}/pipeline-stages', {
    params: { path: { workspaceId } },
    body: parsed.data,
  });
  if (!response.ok) {
    return await stageFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Renames a stage or changes its probability (`PUT /workspaces/{id}/pipeline-stages/{id}`).
 * @param workspaceId The workspace.
 * @param stageId The stage.
 * @param version The version the row was read at.
 * @param values Name and probability.
 * @returns Success, or field and form errors.
 */
export async function updateStage(
  workspaceId: number,
  stageId: number,
  version: number,
  values: StageValues,
): Promise<ActionResult> {
  const t = await getTranslations('StageList');
  const parsed = StageValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.PUT(
    '/api/v1/workspaces/{workspaceId}/pipeline-stages/{id}',
    { params: { path: { workspaceId, id: stageId } }, body: { ...parsed.data, version } },
  );
  if (!response.ok) {
    return await stageFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Saves a new order of the open stages (`PUT /workspaces/{id}/pipeline-stages/order`); Won and
 * Lost stay last.
 * @param workspaceId The workspace.
 * @param stageIds Every open stage id, once, in the new order.
 * @returns The whole pipeline in the server's order, a reload conflict when the pipeline changed
 *   meanwhile, or the translated refusal.
 */
export async function reorderStages(
  workspaceId: number,
  stageIds: number[],
): Promise<ActionResult & { stages?: Stage[] }> {
  const api = await authedBackend();
  const { data, error, response } = await api.PUT(
    '/api/v1/workspaces/{workspaceId}/pipeline-stages/order',
    { params: { path: { workspaceId } }, body: { stageIds } },
  );
  if (!response.ok || !data) {
    const result = await actionFailure(response, error);
    // The ids no longer match the open stages (another tab added or deleted one): reload.
    return errorCode(error) === 'PIPELINE_CHANGED' ? { ...result, conflict: true } : result;
  }

  refresh();
  return { ok: true, stages: toStages(data) };
}

/**
 * Deletes an open stage (`DELETE /workspaces/{id}/pipeline-stages/{id}`).
 * @param workspaceId The workspace.
 * @param stageId The stage.
 * @returns Success, or the translated refusal (409: Won or Lost, the last open stage, or in use).
 */
export async function deleteStage(workspaceId: number, stageId: number): Promise<ActionResult> {
  const api = await authedBackend();
  const { error, response } = await api.DELETE(
    '/api/v1/workspaces/{workspaceId}/pipeline-stages/{id}',
    { params: { path: { workspaceId, id: stageId } } },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}
