import { createTranslator } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { logger } from '@/libs/Logger';
import messages from '@/locales/en.json';
import { errorCode, isApiError, isStaleVersion, redactPath, toActionError } from './ApiError';

const t = createTranslator({ locale: 'en', messages, namespace: 'ApiError' });

const apiError = {
  timestamp: '2026-09-30T00:00:00Z',
  status: 400,
  error: 'Bad Request',
  code: 'VALIDATION_FAILED',
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

  describe(errorCode, () => {
    it('reads the code of a backend error', () => {
      expect(errorCode({ ...apiError, status: 409, code: 'LAST_OWNER' })).toBe('LAST_OWNER');
    });

    it('has none for an error without a code or another value', () => {
      expect(errorCode({ ...apiError, code: undefined })).toBeUndefined();
      expect(errorCode('<html>Bad gateway</html>')).toBeUndefined();
    });
  });

  describe(toActionError, () => {
    it('translates the code and keeps the field errors as the backend sent them', () => {
      expect(toActionError(apiError, t)).toStrictEqual({
        ok: false,
        message: 'Check the highlighted fields and try again.',
        fieldErrors: { score: 'must be less than or equal to 100.00' },
      });
    });

    it('shows the translation of a rule, not the English message', () => {
      const body = {
        ...apiError,
        status: 409,
        code: 'LAST_OWNER',
        message: 'A workspace needs an owner; make someone else an owner first',
        fieldErrors: {},
      };

      expect(toActionError(body, t).message).toBe(
        'A workspace needs an owner. Make someone else an owner first.',
      );
    });

    it("keeps the backend message of a code it doesn't know yet", () => {
      const body = { ...apiError, status: 409, code: 'NEW_THING', message: 'Something new' };

      expect(toActionError(body, t).message).toBe('Something new');
    });

    it('shows an error without a code by its status', () => {
      const body = { ...apiError, status: 413, code: undefined, message: 'Payload too large' };

      expect(toActionError(body, t).message).toBe('This is too large to send.');
    });

    it('says it went wrong for another status without a code', () => {
      const error = vi.spyOn(logger, 'error').mockImplementation(() => {});

      expect(toActionError({ ...apiError, status: 500, code: undefined }, t).message).toBe(
        "That didn't work. Try again.",
      );
      expect(error).toHaveBeenCalledOnce();
      error.mockRestore();
    });

    it('drops an empty field error map', () => {
      expect(toActionError({ ...apiError, fieldErrors: {} }, t).fieldErrors).toBeUndefined();
    });

    it('says it went wrong when the body is not an ApiError', () => {
      const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      expect(toActionError(undefined, t)).toStrictEqual({
        ok: false,
        message: "That didn't work. Try again.",
      });
      warn.mockRestore();
    });

    it('never logs an invitation token', () => {
      const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
      const error = vi.spyOn(logger, 'error').mockImplementation(() => {});

      toActionError('<p>No route for /api/v1/invitations/secret-token/accept</p>', t);
      toActionError({ ...apiError, status: 502, path: '/api/v1/invitations/secret-token' }, t);

      expect(JSON.stringify([warn.mock.calls, error.mock.calls])).not.toContain('secret-token');
      expect(warn).toHaveBeenCalledOnce();
      expect(error).toHaveBeenCalledOnce();
      warn.mockRestore();
      error.mockRestore();
    });
  });

  describe(redactPath, () => {
    it('hides an invitation token in a path', () => {
      expect(redactPath('/api/v1/invitations/abc-DEF_123/register')).toBe(
        '/api/v1/invitations/{token}/register',
      );
      expect(redactPath('/api/v1/invitations/abc')).toBe('/api/v1/invitations/{token}');
    });

    it('leaves other paths alone', () => {
      expect(redactPath('/api/v1/workspaces/7/invitations/12')).toBe(
        '/api/v1/workspaces/7/invitations/12',
      );
      expect(redactPath('/api/v1/workspaces/7/invitations')).toBe(
        '/api/v1/workspaces/7/invitations',
      );
    });
  });

  describe(isStaleVersion, () => {
    it('recognizes an outdated version by its code, whatever the message', () => {
      expect(
        isStaleVersion({ ...apiError, status: 409, code: 'VERSION_CONFLICT', message: 'Reworded' }),
      ).toBeTruthy();
    });

    it('does not mistake another conflict for it', () => {
      expect(
        isStaleVersion({
          ...apiError,
          status: 409,
          code: 'DUPLICATE_NAME',
          message: 'Changed by another request; reload and try again',
        }),
      ).toBeFalsy();
      expect(isStaleVersion({ ...apiError, status: 409, code: undefined })).toBeFalsy();
      expect(isStaleVersion()).toBeFalsy();
    });
  });
});
