import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { ActionResult } from './ApiError';
import { errorCode, isStaleVersion, toActionError } from './ApiError';
import { redirectIfUnauthorized } from './Session';

// Refusals that mean the record's status moved since the page was read, besides a stale version.
const RELOAD_CODES = new Set<string | undefined>([
  'TASK_STATUS_CONFLICT',
  'LEAD_CONVERTED',
  'LEAD_NOT_QUALIFIED',
]);

/**
 * Turns a failed backend response of a CRM action into a form result: a 401 ends the session, an
 * outdated `version`, a task whose status moved meanwhile or a lead whose status moved meanwhile
 * (converted, or not qualified) is the reload message (all the texts say "Reload"), and anything
 * else (403, 409 rules, 400) is the translation of its code, with the backend's field errors.
 * @param response The backend response.
 * @param error Its parsed error body.
 * @returns The failed result (or never, for a 401).
 */
export const actionFailure = async (response: Response, error: unknown): Promise<ActionResult> => {
  await redirectIfUnauthorized(response.status);
  const result = toActionError(error, await getTranslations('ApiError'));

  // These texts say "Reload to see it": the result carries the button for it.
  return isStaleVersion(error) || RELOAD_CODES.has(errorCode(error))
    ? { ...result, conflict: true }
    : result;
};
