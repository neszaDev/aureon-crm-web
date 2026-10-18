'use server';

import { getTranslations } from 'next-intl/server';
import { refresh } from 'next/cache';
import { actionFailure } from '@/libs/api/ActionFailure';
import type { ActionResult } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import { getActivities } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import { redirectIfUnauthorized } from '@/libs/api/Session';
import type { ActivityLink, ActivityValues } from '@/validations/crm/ActivityValidation';
import { ActivityLinkValidation, ActivityValidation } from '@/validations/crm/ActivityValidation';

type Activity = components['schemas']['ActivityResponse'];

/**
 * The request body of checked values: an empty body or link is left out (on an edit, cleared),
 * and so is a null `occurredAt` (now on a new activity, unchanged on an edit).
 * @param values Checked values.
 * @returns The `ActivityInput` fields.
 */
const activityBody = (values: ActivityValues) => ({
  type: values.type,
  subject: values.subject,
  body: values.body || undefined,
  occurredAt: values.occurredAt ?? undefined,
  companyId: values.companyId ?? undefined,
  contactId: values.contactId ?? undefined,
  leadId: values.leadId ?? undefined,
  dealId: values.dealId ?? undefined,
});

/**
 * Logs an activity (`POST /workspaces/{id}/activities`), written by the caller, and refreshes the
 * page. On a contact or deal it lands on that record's company too; on a converted lead, on the
 * contact the lead became.
 * @param workspaceId The workspace.
 * @param values What happened, and the records it is on.
 * @returns Success, or field and form errors.
 */
export async function logActivity(
  workspaceId: number,
  values: ActivityValues,
): Promise<ActionResult> {
  const t = await getTranslations('ActivityComposer');
  const parsed = ActivityValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.POST('/api/v1/workspaces/{workspaceId}/activities', {
    params: { path: { workspaceId } },
    body: activityBody(parsed.data),
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Saves an activity (`PUT /workspaces/{id}/activities/{id}`, its author or `RECORDS_EDIT_ANY`)
 * and refreshes the page.
 * @param workspaceId The workspace.
 * @param activityId The activity.
 * @param version The version it was read at; an outdated one is the reload message.
 * @param values Every field, its links as they are.
 * @returns Success with the saved activity, or field and form errors.
 */
export async function updateActivity(
  workspaceId: number,
  activityId: number,
  version: number,
  values: ActivityValues,
): Promise<ActionResult & { activity?: Activity }> {
  const t = await getTranslations('ActivityComposer');
  const parsed = ActivityValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { data, error, response } = await api.PUT(
    '/api/v1/workspaces/{workspaceId}/activities/{id}',
    {
      params: { path: { workspaceId, id: activityId } },
      body: { ...activityBody(parsed.data), version },
    },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true, activity: data };
}

/**
 * Deletes an activity (`DELETE /workspaces/{id}/activities/{id}`, its author or
 * `RECORDS_EDIT_ANY`) and refreshes the page.
 * @param workspaceId The workspace.
 * @param activityId The activity.
 * @returns Success, or the translated refusal.
 */
export async function deleteActivity(
  workspaceId: number,
  activityId: number,
): Promise<ActionResult> {
  const api = await authedBackend();
  const { error, response } = await api.DELETE('/api/v1/workspaces/{workspaceId}/activities/{id}', {
    params: { path: { workspaceId, id: activityId } },
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Loads a later page of a record's timeline, for "Show older". A 401 ends the session.
 * @param workspaceId The workspace.
 * @param link The record, such as `{ companyId: 7 }`.
 * @param page The page, from 1.
 * @returns The page's activities, newest first.
 * @throws {Error} When the record or page isn't one, or the backend refuses.
 */
export async function loadActivities(
  workspaceId: number,
  link: ActivityLink,
  page: number,
): Promise<Activity[]> {
  // A server action takes whatever a caller sends.
  const parsed = ActivityLinkValidation.safeParse(link);
  if (!parsed.success || !Number.isSafeInteger(page) || page < 0) {
    throw new Error('Not a timeline page');
  }
  const result = await getActivities(String(workspaceId), parsed.data, page);
  if (result.unauthorized) {
    await redirectIfUnauthorized(401);
  }
  if (!result.activities) {
    throw new Error('The activities could not be loaded');
  }

  return result.activities.content;
}
