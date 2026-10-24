'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { refresh } from 'next/cache';
import { actionFailure } from '@/libs/api/ActionFailure';
import type { ActionResult } from '@/libs/api/ApiError';
import { errorCode, toActionError } from '@/libs/api/ApiError';
import { authedBackend, backend } from '@/libs/api/Backend';
import { rateLimited } from '@/libs/api/RateLimit';
import { forwardedFor, redirectIfUnauthorized, startSession } from '@/libs/api/Session';
import { redirect } from '@/libs/I18nNavigation';
import type { InvitationRegisterValues } from '@/validations/crm/InvitationValidation';
import {
  InvitationRegisterValidation,
  InvitationTokenValidation,
} from '@/validations/crm/InvitationValidation';

// Invitation tokens are secrets: nothing here logs them, and `toActionError` redacts them.

/**
 * Joins the workspace as the signed-in user (`POST /invitations/{token}/accept`), then opens it.
 * @param token The link's token.
 * @returns Only on failure. A 403 (another account) or 409 (no longer pending) also refreshes
 *   the page, which then shows the invitation as it is now; a 401 ends the session and signs in
 *   back to this link.
 */
export async function acceptInvitation(token: string): Promise<ActionResult> {
  if (!InvitationTokenValidation.safeParse(token).success) {
    const t = await getTranslations('ApiError');
    return { ok: false, message: t('generic') };
  }

  const api = await authedBackend();
  const { data, error, response } = await api.POST('/api/v1/invitations/{token}/accept', {
    params: { path: { token } },
  });
  if (!data) {
    // A 401 signs in again and comes back to this link.
    await redirectIfUnauthorized(response.status, `/invite/${token}`);
    refresh();
    return await actionFailure(response, error);
  }

  return redirect({ href: `/app/${data.workspaceId}`, locale: await getLocale() });
}

/**
 * Creates the invited email's account and its membership (`POST /invitations/{token}/register`),
 * signs in like sign-up and opens the workspace.
 * @param token The link's token.
 * @param values Password and optional display name.
 * @returns Field or form errors; on success it redirects instead of returning.
 */
export async function registerThroughInvitation(
  token: string,
  values: InvitationRegisterValues,
): Promise<ActionResult> {
  const t = await getTranslations('AuthForm');
  const parsed = InvitationRegisterValidation.safeParse(values);
  if (!parsed.success || !InvitationTokenValidation.safeParse(token).success) {
    return { ok: false, message: t('error_invalid_input') };
  }

  const { data, error, response } = await backend.POST('/api/v1/invitations/{token}/register', {
    params: { path: { token } },
    body: parsed.data,
    headers: await forwardedFor(),
  });
  if (!data) {
    if (response.status === 429) {
      return await rateLimited(response);
    }
    const code = errorCode(error);
    if (code === 'EMAIL_TAKEN') {
      const tInvite = await getTranslations('InvitationCard');
      return { ok: false, message: tInvite('error_email_taken') };
    }
    if (code === 'INVITATION_NOT_PENDING') {
      // Used or revoked meanwhile: the refreshed page shows that instead of this form.
      refresh();
    }
    return toActionError(error, await getTranslations('ApiError'));
  }

  const preview = await backend.GET('/api/v1/invitations/{token}', {
    params: { path: { token } },
  });
  const workspaceId = preview.data?.workspaceId;

  return await startSession(data, workspaceId === undefined ? '/app' : `/app/${workspaceId}`);
}
