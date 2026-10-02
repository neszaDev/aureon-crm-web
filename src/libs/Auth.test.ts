import { describe, expect, it } from 'vitest';
import {
  ACCESS_TOKEN_COOKIE,
  isSecureAppUrl,
  REFRESH_TOKEN_COOKIE,
  sessionCookies,
  toSessionTokens,
} from './Auth';

const tokens = {
  accessToken: 'access',
  expiresIn: 900,
  refreshToken: 'refresh',
  refreshExpiresIn: 2_592_000,
};

describe('Auth', () => {
  describe(sessionCookies, () => {
    it('expires the access cookie 30 seconds before the token', () => {
      const [access] = sessionCookies(tokens, false);

      expect(access).toMatchObject({ name: ACCESS_TOKEN_COOKIE, value: 'access', maxAge: 870 });
    });

    it('expires the refresh cookie with the refresh token', () => {
      const [, refresh] = sessionCookies(tokens, false);

      expect(refresh).toMatchObject({ name: REFRESH_TOKEN_COOKIE, maxAge: 2_592_000 });
    });

    it('marks both cookies httpOnly, lax and site-wide', () => {
      for (const cookie of sessionCookies(tokens, true)) {
        expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', secure: true });
      }
    });

    it('never produces a non-positive access maxAge for very short tokens', () => {
      const [access] = sessionCookies({ ...tokens, expiresIn: 10 }, false);

      expect(access?.maxAge).toBe(1);
    });
  });

  describe(toSessionTokens, () => {
    it('returns tokens when every field is present', () => {
      expect(toSessionTokens({ ...tokens, tokenType: 'Bearer' })).toStrictEqual(tokens);
    });

    it('returns undefined when a field is missing', () => {
      expect(toSessionTokens({ ...tokens, refreshToken: undefined })).toBeUndefined();
      expect(toSessionTokens()).toBeUndefined();
    });
  });

  describe(isSecureAppUrl, () => {
    it('requires Secure cookies only over https', () => {
      expect(isSecureAppUrl('https://app.example.com')).toBeTruthy();
      expect(isSecureAppUrl('http://localhost:3000')).toBeFalsy();
    });
  });
});
