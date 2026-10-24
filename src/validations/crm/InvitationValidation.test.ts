import { describe, expect, it } from 'vitest';
import {
  InvitationRegisterValidation,
  InvitationTokenValidation,
  InvitationValidation,
} from './InvitationValidation';

const firstMessage = (values: Record<string, unknown>) =>
  InvitationValidation.safeParse({ email: 'ana@example.com', role: 'MANAGER', ...values }).error
    ?.issues[0]?.message;

describe('invitation validation', () => {
  it('trims and lower-cases the email, as the backend stores it', () => {
    expect(
      InvitationValidation.parse({ email: '  Ana@Example.COM ', role: 'SALES_REP' }).email,
    ).toBe('ana@example.com');
  });

  it('rejects an invalid or too long email', () => {
    expect(firstMessage({ email: 'ana' })).toBe('invalid_email');
    expect(firstMessage({ email: `${'a'.repeat(243)}@example.com` })).toBe('too_long');
  });

  it('requires a workspace role', () => {
    expect(firstMessage({ role: 'USER' })).toBe('required');
  });
});

describe('invitation registration validation', () => {
  const values = { displayName: 'Ana Lima', password: 'a-secure-password' };
  const registerMessage = (overrides: Record<string, unknown>) =>
    InvitationRegisterValidation.safeParse({ ...values, ...overrides }).error?.issues[0]?.message;

  it('trims the display name and allows it empty', () => {
    expect(InvitationRegisterValidation.parse({ ...values, displayName: ' Ana ' })).toStrictEqual({
      displayName: 'Ana',
      password: 'a-secure-password',
    });
    expect(InvitationRegisterValidation.parse({ ...values, displayName: '  ' }).displayName).toBe(
      '',
    );
  });

  it('rejects a display name over 100 characters', () => {
    expect(registerMessage({ displayName: 'x'.repeat(101) })).toBe('too_long');
  });

  it('applies the new password rules, UTF-8 bytes included', () => {
    expect(registerMessage({ password: '12345' })).toBe('password_too_short');
    expect(registerMessage({ password: 'x'.repeat(73) })).toBe('password_too_long');
    // 25 Thai characters are 75 UTF-8 bytes.
    expect(registerMessage({ password: 'ก'.repeat(25) })).toBe('password_too_many_bytes');
  });
});

describe('invitation token validation', () => {
  it('accepts a URL-safe token like the backend issues', () => {
    expect(
      InvitationTokenValidation.safeParse('Zx8_-q'.repeat(7).slice(0, 43)).success,
    ).toBeTruthy();
  });

  it.each(['', '..', 'a/b', 'a%2Fb', 'a.b', 'a b', 'x'.repeat(257)])(
    'rejects %j, which is not one path segment of URL-safe characters',
    (token) => {
      expect(InvitationTokenValidation.safeParse(token).success).toBeFalsy();
    },
  );
});
