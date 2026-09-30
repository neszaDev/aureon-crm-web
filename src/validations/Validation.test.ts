import { describe, expect, it } from 'vitest';
import { SignInValidation, SignUpValidation } from './AuthValidation';
import { TestResultValidation } from './TestResultValidation';

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('Validation', () => {
  describe('sign-up rules', () => {
    it('accepts the limits the backend accepts', () => {
      expect(
        SignUpValidation.safeParse({ email: 'a@example.com', password: '123456' }).success,
      ).toBeTruthy();
    });

    it('rejects passwords outside 6-72 characters with translation keys', () => {
      expect(
        firstMessage(SignUpValidation.safeParse({ email: 'a@example.com', password: '12345' })),
      ).toBe('password_too_short');
      expect(
        firstMessage(
          SignUpValidation.safeParse({ email: 'a@example.com', password: 'x'.repeat(73) }),
        ),
      ).toBe('password_too_long');
    });
  });

  describe('sign-in rules', () => {
    it('requires a valid email and any non-empty password', () => {
      expect(firstMessage(SignInValidation.safeParse({ email: 'nope', password: 'x' }))).toBe(
        'invalid_email',
      );
      expect(
        firstMessage(SignInValidation.safeParse({ email: 'a@example.com', password: '' })),
      ).toBe('required');
    });
  });

  describe('test result rules', () => {
    const valid = {
      testName: 'Blood pressure',
      status: 'PASSED',
      score: 92.5,
      testedAt: '2026-08-25T10:30:00.000Z',
    };

    it('accepts a valid result', () => {
      expect(TestResultValidation.safeParse(valid).success).toBeTruthy();
    });

    it('rejects scores outside 0-100', () => {
      expect(firstMessage(TestResultValidation.safeParse({ ...valid, score: 100.01 }))).toBe(
        'score_range',
      );
      expect(firstMessage(TestResultValidation.safeParse({ ...valid, score: -1 }))).toBe(
        'score_range',
      );
    });

    it('rejects unknown statuses and non-ISO dates', () => {
      expect(TestResultValidation.safeParse({ ...valid, status: 'DONE' }).success).toBeFalsy();
      expect(
        firstMessage(TestResultValidation.safeParse({ ...valid, testedAt: '25/08/2026' })),
      ).toBe('invalid_date');
    });
  });
});
