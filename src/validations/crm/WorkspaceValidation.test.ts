import { describe, expect, it } from 'vitest';
import { WorkspaceValidation } from './WorkspaceValidation';

const valid = { name: 'Northwind Supply', defaultCurrency: 'USD', timezone: 'Asia/Bangkok' };

const firstMessage = (values: Record<string, unknown>) =>
  WorkspaceValidation.safeParse({ ...valid, ...values }).error?.issues[0]?.message;

describe('workspace validation', () => {
  it('accepts a workspace the backend accepts and trims its name', () => {
    expect(WorkspaceValidation.parse({ ...valid, name: '  Northwind  ' }).name).toBe('Northwind');
  });

  describe('name', () => {
    it('requires a name that is not only spaces', () => {
      expect(firstMessage({ name: '' })).toBe('required');
      expect(firstMessage({ name: '   ' })).toBe('required');
    });

    it('allows 100 characters and rejects 101', () => {
      expect(firstMessage({ name: 'x'.repeat(100) })).toBeUndefined();
      expect(firstMessage({ name: 'x'.repeat(101) })).toBe('too_long');
    });
  });

  describe('currency', () => {
    it('accepts an ISO 4217 code', () => {
      expect(firstMessage({ defaultCurrency: 'THB' })).toBeUndefined();
    });

    it('rejects lower case, the wrong length and unknown codes', () => {
      expect(firstMessage({ defaultCurrency: 'usd' })).toBe('invalid_currency');
      expect(firstMessage({ defaultCurrency: 'US' })).toBe('invalid_currency');
      expect(firstMessage({ defaultCurrency: 'ABC' })).toBe('invalid_currency');
    });
  });

  describe('time zone', () => {
    it('accepts an IANA zone and UTC', () => {
      expect(firstMessage({ timezone: 'Europe/Paris' })).toBeUndefined();
      expect(firstMessage({ timezone: 'UTC' })).toBeUndefined();
    });

    it('accepts the current and the legacy spelling of a renamed zone', () => {
      expect(firstMessage({ timezone: 'Asia/Kolkata' })).toBeUndefined();
      expect(firstMessage({ timezone: 'Asia/Calcutta' })).toBeUndefined();
      expect(firstMessage({ timezone: 'Europe/Kyiv' })).toBeUndefined();
      expect(firstMessage({ timezone: 'Europe/Kiev' })).toBeUndefined();
    });

    it('rejects an unknown zone', () => {
      expect(firstMessage({ timezone: 'Mars/Base' })).toBe('invalid_time_zone');
      expect(firstMessage({ timezone: '' })).toBe('invalid_time_zone');
    });
  });
});
