import { describe, expect, it } from 'vitest';
import { isApiError, toActionError } from './ApiError';

const apiError = {
  timestamp: '2026-09-30T00:00:00Z',
  status: 400,
  error: 'Bad Request',
  message: 'Validation failed',
  path: '/api/v1/test-results',
  fieldErrors: { score: 'must be less than or equal to 100.00' },
};

describe('ApiError', () => {
  describe(isApiError, () => {
    it('recognizes the backend error body', () => {
      expect(isApiError(apiError)).toBeTruthy();
    });

    it('rejects other values', () => {
      expect(isApiError()).toBeFalsy();
      expect(isApiError('Bad gateway')).toBeFalsy();
      expect(isApiError({ status: '500' })).toBeFalsy();
    });
  });

  describe(toActionError, () => {
    it('keeps the backend message and field errors', () => {
      expect(toActionError(apiError, 'fallback')).toStrictEqual({
        ok: false,
        message: 'Validation failed',
        fieldErrors: { score: 'must be less than or equal to 100.00' },
      });
    });

    it('drops an empty field error map', () => {
      expect(
        toActionError({ ...apiError, fieldErrors: {} }, 'fallback').fieldErrors,
      ).toBeUndefined();
    });

    it('uses the fallback when the body is not an ApiError', () => {
      expect(toActionError(undefined, 'fallback')).toStrictEqual({
        ok: false,
        message: 'fallback',
      });
    });
  });
});
