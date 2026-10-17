import { describe, expect, it } from 'vitest';
import { PasswordChangeValidation, ProfileValidation } from './ProfileValidation';

const password = {
  currentPassword: 'old-secret',
  newPassword: 'new-secret',
  confirmPassword: 'new-secret',
};

const passwordMessage = (values: Record<string, unknown>) =>
  PasswordChangeValidation.safeParse({ ...password, ...values }).error?.issues[0]?.message;

describe('profile validation', () => {
  it('trims the display name and allows it empty (clears it)', () => {
    expect(ProfileValidation.parse({ displayName: '  Ana Lima ' }).displayName).toBe('Ana Lima');
    expect(ProfileValidation.parse({ displayName: '   ' }).displayName).toBe('');
  });

  it('allows a display name of 100 characters and rejects 101', () => {
    expect(ProfileValidation.safeParse({ displayName: 'x'.repeat(100) }).success).toBeTruthy();
    expect(
      ProfileValidation.safeParse({ displayName: 'x'.repeat(101) }).error?.issues[0]?.message,
    ).toBe('too_long');
  });
});

describe('password change validation', () => {
  it('accepts a valid change', () => {
    expect(PasswordChangeValidation.safeParse(password).success).toBeTruthy();
  });

  it('requires the current password', () => {
    expect(passwordMessage({ currentPassword: '' })).toBe('required');
  });

  it('applies the registration rules to the new password', () => {
    expect(passwordMessage({ newPassword: '12345', confirmPassword: '12345' })).toBe(
      'password_too_short',
    );
    const long = 'x'.repeat(73);
    expect(passwordMessage({ newPassword: long, confirmPassword: long })).toBe('password_too_long');
    // 25 Thai characters are 75 UTF-8 bytes: within 72 characters, over BCrypt's 72 bytes.
    const thai = 'ก'.repeat(25);
    expect(passwordMessage({ newPassword: thai, confirmPassword: thai })).toBe(
      'password_too_many_bytes',
    );
  });

  it('requires the confirmation to match, on the confirmation field', () => {
    const issue = PasswordChangeValidation.safeParse({ ...password, confirmPassword: 'other' })
      .error?.issues[0];
    expect(issue?.message).toBe('passwords_must_match');
    expect(issue?.path).toStrictEqual(['confirmPassword']);
  });
});
