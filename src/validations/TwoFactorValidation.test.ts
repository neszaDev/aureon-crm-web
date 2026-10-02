import { describe, expect, it } from 'vitest';
import { TwoFactorValidation, twoFactorOutcome } from './TwoFactorValidation';

describe('two-factor code rules', () => {
  it('accepts six letters and digits', () => {
    expect(TwoFactorValidation.safeParse({ code: 'aB3dE9' }).success).toBeTruthy();
  });

  it('trims the code before checking it', () => {
    expect(TwoFactorValidation.parse({ code: ' 123456 ' }).code).toBe('123456');
  });

  it('rejects codes of the wrong length or with symbols with a translation key', () => {
    for (const code of ['12345', '1234567', '12345!', 'ก12345']) {
      expect(TwoFactorValidation.safeParse({ code }).error?.issues[0]?.message).toBe(
        'two_factor_code',
      );
    }
  });

  describe(twoFactorOutcome, () => {
    it('rejects a malformed code before any backend call', () => {
      expect(twoFactorOutcome({ code: '12-45' })).toBe('invalid_code');
      expect(twoFactorOutcome({})).toBe('invalid_code');
    });

    it('reports a well-formed code as not verifiable yet instead of accepting it', () => {
      expect(twoFactorOutcome({ code: 'A1b2C3' })).toBe('unavailable');
    });
  });
});
