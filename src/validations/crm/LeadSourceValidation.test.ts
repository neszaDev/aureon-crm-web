import { describe, expect, it } from 'vitest';
import { LeadSourceValidation } from './LeadSourceValidation';

const firstMessage = (name: string) =>
  LeadSourceValidation.safeParse({ name }).error?.issues[0]?.message;

describe('lead source validation', () => {
  it('trims the name', () => {
    expect(LeadSourceValidation.parse({ name: ' Referral ' }).name).toBe('Referral');
  });

  it('requires a name of at most 60 characters', () => {
    expect(firstMessage('  ')).toBe('required');
    expect(firstMessage('x'.repeat(60))).toBeUndefined();
    expect(firstMessage('x'.repeat(61))).toBe('too_long');
  });
});
