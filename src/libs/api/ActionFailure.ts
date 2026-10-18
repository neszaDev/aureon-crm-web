import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { ActionResult } from './ApiError';
import { errorCode, isStaleVersion, toActionError } from './ApiError';
import { redirectIfUnauthorized } from './Session';

/**
 * Turns a failed backend response of a CRM action into a form result: a 401 ends the session, an
 * outdated `version` or a task whose status moved meanwhile is the reload message (both texts
 * say "Reload"), and anything else (403, 409 rules, 400) is the
 * translation of its code, with the backend's field errors.
 * @param response The backend response.
 * @param error Its parsed error body.
 * @returns The failed result (or never, for a 401).
 */
export const actionFailure = async (response: Response, error: unknown): Promise<ActionResult> => {
  await redirectIfUnauthorized(response.status);
  const result = toActionError(error, await getTranslations('ApiError'));

  // Both codes' texts say "Reload to see it": the result carries the button for it.
  return isStaleVersion(error) || errorCode(error) === 'TASK_STATUS_CONFLICT'
    ? { ...result, conflict: true }
    : result;
};
