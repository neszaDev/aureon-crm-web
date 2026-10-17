import { describe, expect, it } from 'vitest';
import { InvitationValidation } from './InvitationValidation';

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
