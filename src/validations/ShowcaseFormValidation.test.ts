import { describe, expect, it } from 'vitest';
import { ShowcaseSignUpValidation } from './ShowcaseFormValidation';

const valid = {
  firstName: 'Ada',
  lastName: 'Li',
  userName: 'adali',
  email: 'ada@example.com',
  password: 'Report1card',
  confirmPassword: 'Report1card',
  accept: true,
};

const messagesFor = (values: Record<string, unknown>, field: string) =>
  ShowcaseSignUpValidation.safeParse(values).error?.issues.find((issue) => issue.path[0] === field)
    ?.message;

describe('Showcase sign-up rules', () => {
  it('accepts a form that meets every rule', () => {
    expect(ShowcaseSignUpValidation.safeParse(valid).success).toBeTruthy();
  });

  describe('length rules', () => {
    it('reports an empty field as required before its minimum length', () => {
      expect(messagesFor({ ...valid, firstName: '' }, 'firstName')).toBe('required');
      expect(messagesFor({ ...valid, firstName: 'Al' }, 'firstName')).toBe('min_3_characters');
      expect(messagesFor({ ...valid, lastName: 'L' }, 'lastName')).toBe('min_2_characters');
      expect(messagesFor({ ...valid, userName: 'ada' }, 'userName')).toBe('min_5_characters');
    });
  });

  describe('email rule', () => {
    it('rejects an address without a domain', () => {
      expect(messagesFor({ ...valid, email: 'ada@' }, 'email')).toBe('invalid_email');
      expect(messagesFor({ ...valid, email: '' }, 'email')).toBe('required');
    });
  });

  describe('password rules', () => {
    it('asks for 8 characters, then for a digit and both letter cases', () => {
      expect(messagesFor({ ...valid, password: 'Ab1' }, 'password')).toBe('min_8_characters');
      expect(messagesFor({ ...valid, password: 'reportcard1' }, 'password')).toBe(
        'strong_password',
      );
    });

    it('requires the confirmation to match the password', () => {
      expect(messagesFor({ ...valid, confirmPassword: 'Report1cards' }, 'confirmPassword')).toBe(
        'passwords_must_match',
      );
      expect(messagesFor({ ...valid, confirmPassword: '' }, 'confirmPassword')).toBe('required');
    });
  });

  describe('terms', () => {
    it('rejects a form whose terms are not accepted', () => {
      expect(messagesFor({ ...valid, accept: false }, 'accept')).toBe('accept_terms');
    });
  });
});
