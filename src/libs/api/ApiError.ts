import type { useTranslations } from 'next-intl';
import { logger } from '@/libs/Logger';
import type { components } from './schema';

/** Error body of every backend endpoint (`components.schemas.ApiError` in its spec). */
export type ApiError = components['schemas']['ApiError'];

/** A stable error code, which clients translate (`LAST_OWNER`, `VERSION_CONFLICT`, ...). */
type ApiErrorCode = NonNullable<ApiError['code']>;

/**
 * Narrows an unknown response body to a JSON error: the backend's `ApiError`, or a proxy's
 * (`{ status, message }`), so only those two fields are sure to be there.
 * @param body Parsed JSON body of a failed response.
 * @returns Whether the body is a JSON error.
 */
export const isApiError = (
  body?: unknown,
): body is Partial<ApiError> & Pick<ApiError, 'status' | 'message'> =>
  typeof body === 'object' &&
  body !== null &&
  typeof (body as { status?: unknown }).status === 'number' &&
  typeof (body as { message?: unknown }).message === 'string';

/**
 * Reads the code of a failed response. A newer backend may send one this build doesn't know.
 * @param body Parsed JSON body of the failed response.
 * @returns The code, or `undefined` for an error without one (401, 413, 5xx, ...).
 */
export const errorCode = (body?: unknown): ApiErrorCode | undefined =>
  isApiError(body) ? body.code : undefined;

/** Result of a server action that talks to the backend, ready for a form to render. */
export type ActionResult = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Someone else saved the record first (stale `version`): the form offers a reload. */
  conflict?: boolean;
};

/**
 * Tells whether a failed update was refused because the record changed since it was read.
 * @param body Parsed JSON body of the failed response.
 * @returns Whether it is the backend's stale-version conflict.
 */
export const isStaleVersion = (body?: unknown) => errorCode(body) === 'VERSION_CONFLICT';

// The statuses an error without a code is shown by; any other says it went wrong.
const STATUSES = [400, 403, 404, 409, 413, 429] as const;

/**
 * Hides the invitation token in a backend path before it is logged: tokens are secrets. The
 * backend already sends route patterns; this guards against a raw URI (in a path or any text).
 * @param path A backend request path, or text that may contain one.
 * @returns The path with `/api/v1/invitations/<token>` as `/api/v1/invitations/{token}`.
 */
export const redactPath = (path: string) =>
  path.replaceAll(/(\/api\/v1\/invitations\/)[^/?#]+/gu, '$1{token}');

/**
 * Converts a failed backend response into a form-friendly result, translated by its code. Field
 * errors stay as the backend wrote them (English).
 * @param body Parsed JSON body of the failed response (may be empty or not an `ApiError`).
 * @param t The `ApiError` translations.
 * @returns A failed `ActionResult` with the message and field errors.
 */
export const toActionError = (
  body: unknown,
  t: ReturnType<typeof useTranslations<'ApiError'>>,
): ActionResult => {
  if (!isApiError(body)) {
    logger.warn('Unexpected backend error response', { body: redactPath(String(body)) });
    return { ok: false, message: t('generic') };
  }
  if (body.status >= 500) {
    logger.error('Backend error', {
      status: body.status,
      path: body.path && redactPath(body.path),
    });
  }

  // Only the backend's own errors always have the map; a proxy's JSON error may not.
  const fieldErrors = Object.keys(body.fieldErrors ?? {}).length > 0 ? body.fieldErrors : undefined;
  let message: string;
  if (body.code === 'VALIDATION_FAILED' && !fieldErrors) {
    // Its translation points at highlighted fields: there are none to point at.
    message = t('status_400');
  } else if (body.code) {
    // A code newer than this build has no translation: its English message beats nothing.
    message = t.has(`code_${body.code}`) ? t(`code_${body.code}`) : body.message;
  } else {
    const status = STATUSES.find((known) => known === body.status);
    message = status ? t(`status_${status}`) : t('generic');
  }

  return { ok: false, message, fieldErrors };
};
