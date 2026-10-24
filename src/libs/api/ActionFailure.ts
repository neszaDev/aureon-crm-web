import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { ActionResult } from './ApiError';
import { errorCode, isStaleVersion, toActionError } from './ApiError';
import { redirectIfUnauthorized } from './Session';

// Refusals that mean the record's status moved since the page was read, besides a stale version,
// or that it clashes with data saved meanwhile (CONFLICT: a stage or source it named was deleted).
const RELOAD_CODES = new Set<string | undefined>([
  'TASK_STATUS_CONFLICT',
  'LEAD_CONVERTED',
  'LEAD_NOT_QUALIFIED',
  'CONFLICT',
]);

/**
 * Turns a failed backend response of a CRM action into a form result: a 401 ends the session, an
 * outdated `version`, a task whose status moved meanwhile, a lead whose status moved meanwhile
 * (converted, or not qualified) or a clash with data saved meanwhile (`CONFLICT`) is the reload
 * message (all the texts say "Reload"), and anything else (403, 409 rules, 400) is the
 * translation of its code, with the backend's field errors.
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
