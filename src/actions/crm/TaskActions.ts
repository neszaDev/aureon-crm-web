'use server';

import { getTranslations } from 'next-intl/server';
import { refresh } from 'next/cache';
import { actionFailure } from '@/libs/api/ActionFailure';
import type { ActionResult } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import type { TaskValues } from '@/validations/crm/TaskValidation';
import { TaskValidation } from '@/validations/crm/TaskValidation';

type StatusPath =
  | '/api/v1/workspaces/{workspaceId}/tasks/{id}/complete'
  | '/api/v1/workspaces/{workspaceId}/tasks/{id}/reopen'
  | '/api/v1/workspaces/{workspaceId}/tasks/{id}/cancel';

/**
 * The request body of checked values: an empty field is left out, which the backend reads as
 * none (and, on an update, clears), the due time, the links and `assigneeId` included.
 * @param values Checked values.
 * @returns The `TaskInput` fields.
 */
const taskBody = (values: TaskValues) => ({
  title: values.title,
  description: values.description || undefined,
  dueAt: values.dueAt ?? undefined,
  priority: values.priority,
  assigneeId: values.assigneeId ?? undefined,
  companyId: values.companyId ?? undefined,
  contactId: values.contactId ?? undefined,
  leadId: values.leadId ?? undefined,
  dealId: values.dealId ?? undefined,
});

/**
 * Creates a task (`POST /workspaces/{id}/tasks`) and refreshes the page. Linked to a contact or
 * deal, it lands on that record's company too.
 * @param workspaceId The workspace.
 * @param values The task; no assignee means the caller.
 * @returns Success, or field and form errors.
 */
export async function createTask(workspaceId: number, values: TaskValues): Promise<ActionResult> {
  const t = await getTranslations('TaskDialog');
  const parsed = TaskValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.POST('/api/v1/workspaces/{workspaceId}/tasks', {
    params: { path: { workspaceId } },
    body: taskBody(parsed.data),
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Adds a task by its title alone from a list (its inline add): created as `createTask` does, for
 * the list's assignee (none: the caller), due when its group is (today's end, or never). A
 * refused title is the `name` field's error, as the add row names it.
 * @param workspaceId The workspace.
 * @param preset What the list's group or filter gives it.
 * @param preset.assigneeId Its assignee; none means the caller.
 * @param preset.dueAt Its due time, or none.
 * @param title The title typed.
 * @returns Success, or the refusal.
 */
export async function addTask(
  workspaceId: number,
  preset: { assigneeId: number | null; dueAt: string | null },
  title: string,
): Promise<ActionResult> {
  const result = await createTask(workspaceId, {
    ...preset,
    title,
    description: '',
    priority: 'MEDIUM',
    companyId: null,
    contactId: null,
    leadId: null,
    dealId: null,
  });

  return result.fieldErrors?.title
    ? { ...result, fieldErrors: { name: result.fieldErrors.title } }
    : result;
}

/**
 * Saves a task's fields (`PUT /workspaces/{id}/tasks/{id}`; its status changes only through the
 * actions below) and refreshes the page.
 * @param workspaceId The workspace.
 * @param taskId The task.
 * @param version The version it was read at; an outdated one is the reload message.
 * @param values Every field, with the assignee to keep, reassign to, or none to unassign.
 * @returns Success, or field and form errors.
 */
export async function updateTask(
  workspaceId: number,
  taskId: number,
  version: number,
  values: TaskValues,
): Promise<ActionResult> {
  const t = await getTranslations('TaskDialog');
  const parsed = TaskValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { error, response } = await api.PUT('/api/v1/workspaces/{workspaceId}/tasks/{id}', {
    params: { path: { workspaceId, id: taskId } },
    body: { ...taskBody(parsed.data), version },
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Moves a task to another status and refreshes the page. A stale version, or a move its status
 * doesn't allow (a repeat included), is refused and changes nothing.
 * @param path The action's endpoint.
 * @param workspaceId The workspace.
 * @param taskId The task.
 * @param version The version it was read at.
 * @returns Success, or the translated refusal.
 */
const moveTask = async (
  path: StatusPath,
  workspaceId: number,
  taskId: number,
  version: number,
): Promise<ActionResult> => {
  const api = await authedBackend();
  const { error, response } = await api.POST(path, {
    params: { path: { workspaceId, id: taskId } },
    body: { version },
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
};

/**
 * Completes an open task (`POST .../tasks/{id}/complete`).
 * @param workspaceId The workspace.
 * @param taskId The task.
 * @param version The version it was read at.
 * @returns Success, or the translated refusal.
 */
export async function completeTask(
  workspaceId: number,
  taskId: number,
  version: number,
): Promise<ActionResult> {
  return await moveTask(
    '/api/v1/workspaces/{workspaceId}/tasks/{id}/complete',
    workspaceId,
    taskId,
    version,
  );
}

/**
 * Reopens a completed or cancelled task (`POST .../tasks/{id}/reopen`).
 * @param workspaceId The workspace.
 * @param taskId The task.
 * @param version The version it was read at.
 * @returns Success, or the translated refusal.
 */
export async function reopenTask(
  workspaceId: number,
  taskId: number,
  version: number,
): Promise<ActionResult> {
  return await moveTask(
    '/api/v1/workspaces/{workspaceId}/tasks/{id}/reopen',
    workspaceId,
    taskId,
    version,
  );
}

/**
 * Cancels an open task (`POST .../tasks/{id}/cancel`): tasks are never deleted.
 * @param workspaceId The workspace.
 * @param taskId The task.
 * @param version The version it was read at.
 * @returns Success, or the translated refusal.
 */
export async function cancelTask(
  workspaceId: number,
  taskId: number,
  version: number,
): Promise<ActionResult> {
  return await moveTask(
    '/api/v1/workspaces/{workspaceId}/tasks/{id}/cancel',
    workspaceId,
    taskId,
    version,
  );
}
