import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { ActionResult } from './ApiError';
import { isStaleVersion, toActionError } from './ApiError';
import { redirectIfUnauthorized } from './Session';

/**
 * Turns a failed backend response of a CRM action into a form result: a 401 ends the session, an
 * outdated `version` is the reload message, and anything else (403, 409 rules, 400) keeps the
 * backend's message and field errors.
 * @param response The backend response.
 * @param error Its parsed error body.
 * @returns The failed result (or never, for a 401).
 */
export const actionFailure = async (response: Response, error: unknown): Promise<ActionResult> => {
  await redirectIfUnauthorized(response.status);
  const t = await getTranslations('ActionError');
  if (isStaleVersion(error)) {
    return { ok: false, conflict: true, message: t('conflict') };
  }

  return toActionError(error, t('generic'));
};
