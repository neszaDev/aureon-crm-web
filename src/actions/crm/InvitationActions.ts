'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { refresh } from 'next/cache';
import { actionFailure } from '@/libs/api/ActionFailure';
import type { ActionResult } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import { Env } from '@/libs/Env';
import { getPathname } from '@/libs/I18nNavigation';
import type { InvitationValues } from '@/validations/crm/InvitationValidation';
import { InvitationValidation } from '@/validations/crm/InvitationValidation';
import type { WorkspaceRole } from '@/validations/crm/MemberValidation';

/** A new invitation with its link, which exists only in this answer (the server keeps a hash). */
export type CreatedInvitation = {
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  link: string;
};

/**
 * Invites someone by email (`POST /workspaces/{id}/invitations`, needs `MEMBERS_MANAGE`; only
 * owners invite owners). The link is in the inviter's language. The token is never logged.
 * @param workspaceId The workspace.
 * @param values Email and role.
 * @returns The invitation and its link, or field and form errors (409: already a member or
 *   already invited).
 */
export async function createInvitation(
  workspaceId: number,
  values: InvitationValues,
): Promise<ActionResult & { invitation?: CreatedInvitation }> {
  const t = await getTranslations('InviteDialog');
  const parsed = InvitationValidation.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const api = await authedBackend();
  const { data, error, response } = await api.POST('/api/v1/workspaces/{workspaceId}/invitations', {
    params: { path: { workspaceId } },
    body: parsed.data,
  });
  if (!response.ok) {
    return await actionFailure(response, error);
  }
  if (!data) {
    return { ok: false, message: t('error_generic') };
  }

  const path = getPathname({ href: `/invite/${data.token}`, locale: await getLocale() });
  refresh();
  return {
    ok: true,
    invitation: {
      email: data.email,
      role: data.role,
      expiresAt: data.expiresAt,
      link: new URL(path, Env.APP_URL).href,
    },
  };
}

/**
 * Revokes a pending (or expired) invitation (`DELETE /workspaces/{id}/invitations/{id}`).
 * @param workspaceId The workspace.
 * @param invitationId The invitation.
 * @returns Success, or the translated refusal (409 once accepted or revoked).
 */
export async function revokeInvitation(
  workspaceId: number,
  invitationId: number,
): Promise<ActionResult> {
  const api = await authedBackend();
  const { error, response } = await api.DELETE(
    '/api/v1/workspaces/{workspaceId}/invitations/{id}',
    { params: { path: { workspaceId, id: invitationId } } },
  );
  if (!response.ok) {
    return await actionFailure(response, error);
  }

  refresh();
  return { ok: true };
}
