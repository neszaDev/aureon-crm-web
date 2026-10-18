'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { refresh } from 'next/cache';
import { actionFailure } from '@/libs/api/ActionFailure';
import type { ActionResult } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import { redirect } from '@/libs/I18nNavigation';
import type { DealValues, MoveValues } from '@/validations/crm/DealValidation';
import { DealValidation, MoveValidation } from '@/validations/crm/DealValidation';

/** What a move gives back: the deal's new version, for a card moved again before the refresh. */
export type MoveResult = ActionResult & { version?: number };

/**
 * The request body of checked form values: an empty field is left out, which the backend reads
 * as none (and, on an update, clears), the links and `ownerId` included. A deal without a
 * currency takes the workspace's, and one without a probability its stage's.
 * @param values Checked form values.
 * @returns The `DealInput` fields (the stage is the create's own).
 */
const dealBody = (values: DealValues) => ({
  name: values.name,
  amount: values.amount,
  currency: values.currency || undefined,
  probability: values.probability === '' ? undefined : Number(values.probability),
  expectedCloseDate: values.expectedCloseDate || undefined,
  ownerId: values.ownerId ?? undefined,
  companyId: values.companyId ?? undefined,
  contactId: values.contactId ?? undefined,
  sourceId: values.sourceId ?? undefined,
  notes: values.notes || undefined,
});

/**
 * Creates a deal (`POST /workspaces/{id}/deals`) and opens it.
 * @param workspaceId The workspace.
 * @param values Form values; no owner means the caller, no stage the first open one.
 * @returns Field or form errors; on success it redirects to the new deal instead.
 */
export async function createDeal(workspaceId: number, values: DealValues): Promise<ActionResult> {
  const t = await getTranslations('DealForm');
  const parsed = DealValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { data, error, response } = await api.POST('/api/v1/workspaces/{workspaceId}/deals', {
    params: { path: { workspaceId } },
    body: { ...dealBody(parsed.data), stageId: parsed.data.stageId ?? undefined },
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }
  if (!data) {
    return { ok: false, message: t('error_generic') };
  }

  return redirect({
    href: `/app/${workspaceId}/deals/${data.id}`,
    locale: await getLocale(),
  });
}

/**
 * Saves a deal's fields (`PUT /workspaces/{id}/deals/{id}`; its stage changes only by a move)
 * and refreshes the page.
 * @param workspaceId The workspace.
 * @param dealId The deal.
 * @param version The version the form was read at; an outdated one is the reload message.
 * @param values Form values, with the owner to keep, reassign to, or none to unassign.
 * @returns Success, or field and form errors.
 */
export async function updateDeal(
  workspaceId: number,
  dealId: number,
  version: number,
  values: DealValues,
): Promise<ActionResult> {
  const t = await getTranslations('DealForm');
  const parsed = DealValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.PUT('/api/v1/workspaces/{workspaceId}/deals/{id}', {
    params: { path: { workspaceId, id: dealId } },
    body: { ...dealBody(parsed.data), version },
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Archives a deal (`POST .../deals/{id}/archive`): it leaves the board and the lists, its
 * history stays.
 * @param workspaceId The workspace.
 * @param dealId The deal.
 * @returns Success, or the translated refusal.
 */
export async function archiveDeal(workspaceId: number, dealId: number): Promise<ActionResult> {
  const api = await authedBackend();
  const { error, response } = await api.POST(
    '/api/v1/workspaces/{workspaceId}/deals/{id}/archive',
    { params: { path: { workspaceId, id: dealId } } },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Restores an archived deal (`POST .../deals/{id}/restore`).
 * @param workspaceId The workspace.
 * @param dealId The deal.
 * @returns Success, or the translated refusal.
 */
export async function restoreDeal(workspaceId: number, dealId: number): Promise<ActionResult> {
  const api = await authedBackend();
  const { error, response } = await api.POST(
    '/api/v1/workspaces/{workspaceId}/deals/{id}/restore',
    { params: { path: { workspaceId, id: dealId } } },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Moves a deal to another stage (`POST .../deals/{id}/move`) and refreshes the page: the board's
 * counts and totals, the stamp row and the history come from the server. A stale version is the
 * reload message; Lost needs a reason (the backend refuses without, on `lostReason`), which any
 * other stage drops.
 * @param workspaceId The workspace.
 * @param dealId The deal.
 * @param change The stage, the version the deal was read at and, for Lost, the reason.
 * @returns Success with the deal's new version, or the translated refusal.
 */
export async function moveDeal(
  workspaceId: number,
  dealId: number,
  change: MoveValues,
): Promise<MoveResult> {
  const t = await getTranslations('MoveDealDialog');
  const parsed = MoveValidation.safeParse(change);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { data, error, response } = await api.POST(
    '/api/v1/workspaces/{workspaceId}/deals/{id}/move',
    {
      params: { path: { workspaceId, id: dealId } },
      body: {
        stageId: parsed.data.stageId,
        version: parsed.data.version,
        lostReason: parsed.data.lostReason === '' ? undefined : parsed.data.lostReason,
      },
    },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true, version: data?.version };
}
