import { describe, expect, it } from 'vitest';
import type { CompanyValues } from './CompanyValidation';
import { CompanyValidation } from './CompanyValidation';

/**
 * A website of a given length.
 * @param length Its length.
 * @returns An https URL.
 */
const website = (length: number) => `https://${'a'.repeat(length - 'https://'.length)}`;

const VALID: CompanyValues = {
  name: 'Acme',
  industry: '',
  website: '',
  phone: '',
  address: '',
  employeeCount: '',
  ownerId: null,
  notes: '',
};

/**
 * Validates the company with one field changed.
 * @param field The field.
 * @param value Its value.
 * @returns That field's first message, or undefined when it is valid.
 */
const messageFor = <K extends keyof CompanyValues>(field: K, value: CompanyValues[K]) =>
  CompanyValidation.safeParse({ ...VALID, [field]: value }).error?.issues.find(
    (issue) => issue.path[0] === field,
  )?.message;

describe('company validation', () => {
  it('trims every text field', () => {
    expect(
      CompanyValidation.parse({ ...VALID, name: ' Acme ', website: ' https://acme.com ' }),
    ).toStrictEqual({ ...VALID, name: 'Acme', website: 'https://acme.com' });
  });

  it('requires a name of at most 200 characters', () => {
    expect(messageFor('name', '   ')).toBe('required');
    expect(messageFor('name', 'x'.repeat(200))).toBeUndefined();
    expect(messageFor('name', 'x'.repeat(201))).toBe('too_long');
  });

  it('caps the optional text fields as the backend does', () => {
    for (const [field, max] of [
      ['industry', 100],
      ['phone', 50],
      ['address', 500],
      ['notes', 5000],
    ] as const) {
      expect(messageFor(field, '')).toBeUndefined();
      expect(messageFor(field, 'x'.repeat(max))).toBeUndefined();
      expect(messageFor(field, 'x'.repeat(max + 1))).toBe('too_long');
    }
  });

  it('takes an http or https address without spaces, in any case', () => {
    for (const value of ['', 'https://acme.co.th', 'HTTP://ACME.COM/about', ' http://a.b ']) {
      expect(messageFor('website', value)).toBeUndefined();
    }
    for (const value of ['acme.com', 'ftp://acme.com', 'https://', 'https://acme .com']) {
      expect(messageFor('website', value)).toBe('website_format');
    }
  });

  it('takes a website of at most 255 characters', () => {
    expect(messageFor('website', website(255))).toBeUndefined();
    expect(messageFor('website', website(256))).toBe('too_long');
  });

  it('takes a whole number of employees from 0 to 10,000,000, or none', () => {
    for (const count of ['', '0', ' 12 ', '10000000']) {
      expect(messageFor('employeeCount', count)).toBeUndefined();
    }
    for (const count of ['10000001', '-1', '1.5', '1e3', '1,000', 'many']) {
      expect(messageFor('employeeCount', count)).toBe('employee_count_range');
    }
  });

  it('takes an owner or none', () => {
    expect(messageFor('ownerId', null)).toBeUndefined();
    expect(messageFor('ownerId', 5)).toBeUndefined();
  });
});
