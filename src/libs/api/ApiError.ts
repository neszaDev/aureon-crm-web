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
};

/**
 * Converts a failed backend response into a form-friendly result.
 * @param body Parsed JSON body of the failed response (may be empty or not an `ApiError`).
 * @param fallback Message used when the backend didn't send an `ApiError`.
 * @returns A failed `ActionResult` with the backend's message and field errors.
 */
export const toActionError = (body: unknown, fallback: string): ActionResult => {
  if (!isApiError(body)) {
    logger.warn('Unexpected backend error response', { body: String(body) });
    return { ok: false, message: fallback };
  }
  if (body.status >= 500) {
    logger.error('Backend error', { status: body.status, path: body.path });
  }

  const fieldErrors =
    body.fieldErrors && Object.keys(body.fieldErrors).length > 0 ? body.fieldErrors : undefined;

  return { ok: false, message: body.message, fieldErrors };
};
