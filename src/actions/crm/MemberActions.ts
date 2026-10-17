'use server';

import { getLocale } from 'next-intl/server';
import { refresh } from 'next/cache';
import { actionFailure } from '@/libs/api/ActionFailure';
import type { ActionResult } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import { getCurrentUser } from '@/libs/api/Queries';
import { redirect } from '@/libs/I18nNavigation';
import type { WorkspaceRole } from '@/validations/crm/MemberValidation';
import { MemberRoleValidation } from '@/validations/crm/MemberValidation';

/**
 * Gives a member another role (`PUT /workspaces/{id}/members/{userId}`). The backend applies the
 * owner rules: only owners manage owners (403) and the last owner stays (409).
 * @param workspaceId The workspace.
 * @param userId The member.
 * @param role The new role.
 * @returns Success, or the backend's message.
 */
export async function changeMemberRole(
  workspaceId: number,
  userId: number,
  role: WorkspaceRole,
): Promise<ActionResult> {
  const parsed = MemberRoleValidation.safeParse({ role });
  if (!parsed.success) {
    return { ok: false };
  }

  const api = await authedBackend();
  const { error, response } = await api.PUT('/api/v1/workspaces/{workspaceId}/members/{userId}', {
    params: { path: { workspaceId, userId } },
    body: parsed.data,
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}

/**
 * Removes a member, or the caller themselves, which is leaving: then it opens the workspace
 * list, since this workspace is gone for them (`DELETE /workspaces/{id}/members/{userId}`).
 * @param workspaceId The workspace.
 * @param userId The member.
 * @returns Success, or the backend's message (the last owner can't go: 409).
 */
export async function removeMember(workspaceId: number, userId: number): Promise<ActionResult> {
  const api = await authedBackend();
  const [{ user }, { error, response }] = await Promise.all([
    getCurrentUser(),
    api.DELETE('/api/v1/workspaces/{workspaceId}/members/{userId}', {
      params: { path: { workspaceId, userId } },
    }),
  ]);
  if (!response.ok) {
    return await actionFailure(response, error);
  }
  if (user?.id === userId) {
    return redirect({ href: '/app', locale: await getLocale() });
  }

  refresh();
  return { ok: true };
}
