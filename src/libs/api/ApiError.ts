import { logger } from '@/libs/Logger';

/**
 * Error body returned by every backend endpoint (`common/exception/ApiError` in the Spring
 * API). Written by hand: the backend's OpenAPI spec doesn't declare error responses.
 */
export type ApiError = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Narrows an unknown response body to the backend error shape.
 * @param body Parsed JSON body of a failed response.
 * @returns Whether the body is an `ApiError`.
 */
export const isApiError = (body?: unknown): body is ApiError =>
  typeof body === 'object' &&
  body !== null &&
  typeof (body as { status?: unknown }).status === 'number' &&
  typeof (body as { message?: unknown }).message === 'string';

/** Result of a server action that talks to the backend, ready for a form to render. */
export type ActionResult = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Someone else saved the record first (stale `version`): the form offers a reload. */
  conflict?: boolean;
};

// The backend's message for an outdated `version` (`Versions.check` and its optimistic-lock
// handler). Its other 409s (a duplicate name, a rule) carry their own messages.
const STALE_VERSION_MESSAGE = 'Changed by another request; reload and try again';

/**
 * Tells whether a failed update was refused because the record changed since it was read.
 * @param body Parsed JSON body of the failed response.
 * @returns Whether it is the backend's stale-version conflict.
 */
export const isStaleVersion = (body?: unknown) =>
  isApiError(body) && body.status === 409 && body.message === STALE_VERSION_MESSAGE;

/**
 * Hides the invitation token in a backend path before it is logged: tokens are secrets. The
 * backend already sends route patterns; this guards against a raw URI (in a path or any text).
 * @param path A backend request path, or text that may contain one.
 * @returns The path with `/api/v1/invitations/<token>` as `/api/v1/invitations/{token}`.
 */
export const redactPath = (path: string) =>
  path.replaceAll(/(\/api\/v1\/invitations\/)[^/?#]+/gu, '$1{token}');

/**
 * Converts a failed backend response into a form-friendly result.
 * @param body Parsed JSON body of the failed response (may be empty or not an `ApiError`).
 * @param fallback Message used when the backend didn't send an `ApiError`.
 * @returns A failed `ActionResult` with the backend's message and field errors.
 */
export const toActionError = (body: unknown, fallback: string): ActionResult => {
  if (!isApiError(body)) {
    logger.warn('Unexpected backend error response', { body: redactPath(String(body)) });
    return { ok: false, message: fallback };
  }
  if (body.status >= 500) {
    logger.error('Backend error', { status: body.status, path: redactPath(body.path) });
  }

  const fieldErrors =
    body.fieldErrors && Object.keys(body.fieldErrors).length > 0 ? body.fieldErrors : undefined;

  return { ok: false, message: body.message, fieldErrors };
};
