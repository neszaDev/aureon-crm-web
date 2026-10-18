import { describe, expect, it } from 'vitest';
import type * as z from 'zod';
import {
  ConversionValidation,
  ConvertFormValidation,
  LeadStatusValidation,
  LeadValidation,
  UnqualifyValidation,
} from './LeadValidation';

const VALID = {
  firstName: 'Mia',
  lastName: '',
  companyName: '',
  email: '',
  phone: '',
  jobTitle: '',
  sourceId: null,
  ownerId: null,
  priority: 'MEDIUM',
  followUpDate: '',
  estimatedValue: '',
  currency: '',
  notes: '',
};

// Each issue as [path, message]: the field it shows on and its `Validation` key.
const issues = (schema: z.ZodType, input: unknown) => {
  const result = schema.safeParse(input);

  return result.success
    ? []
    : result.error.issues.map((item) => [item.path.join('.'), item.message]);
};

describe('lead validation', () => {
  it('rejects a currency without a value, on the value', () => {
    expect(issues(LeadValidation, { ...VALID, currency: 'EUR' })).toStrictEqual([
      ['estimatedValue', 'required'],
    ]);
  });

  it('allows a value without a currency: the workspace currency applies', () => {
    expect(issues(LeadValidation, { ...VALID, estimatedValue: '1250.50' })).toStrictEqual([]);
  });

  it('allows a value with its currency, and neither', () => {
    expect(
      issues(LeadValidation, { ...VALID, estimatedValue: '1250.50', currency: 'EUR' }),
    ).toStrictEqual([]);
    expect(issues(LeadValidation, VALID)).toStrictEqual([]);
  });

  it.each(['1,250.50', '1e3', '0.001', '-5', '12345678901234'])('rejects the value %s', (value) => {
    expect(issues(LeadValidation, { ...VALID, estimatedValue: value })).toStrictEqual([
      ['estimatedValue', 'money_format'],
    ]);
  });

  it('rejects a currency that is not three capitals', () => {
    expect(
      issues(LeadValidation, { ...VALID, estimatedValue: '5', currency: 'eur' }),
    ).toStrictEqual([['currency', 'invalid_currency']]);
  });

  it('takes a follow-up date that exists and refuses one that does not', () => {
    expect(issues(LeadValidation, { ...VALID, followUpDate: '2028-02-29' })).toStrictEqual([]);
    expect(issues(LeadValidation, { ...VALID, followUpDate: '2026-02-30' })).toStrictEqual([
      ['followUpDate', 'invalid_date'],
    ]);
    expect(issues(LeadValidation, { ...VALID, followUpDate: '18/10/2026' })).toStrictEqual([
      ['followUpDate', 'invalid_date'],
    ]);
  });

  it('takes LOW, MEDIUM and HIGH as the priority', () => {
    expect(issues(LeadValidation, { ...VALID, priority: 'HIGH' })).toStrictEqual([]);
    expect(issues(LeadValidation, { ...VALID, priority: 'URGENT' })).toHaveLength(1);
  });

  it('requires a first name and gives the email in lower case', () => {
    expect(issues(LeadValidation, { ...VALID, firstName: ' ' })).toStrictEqual([
      ['firstName', 'required'],
    ]);
    expect(LeadValidation.parse({ ...VALID, email: ' MIA@Acme.Test ' }).email).toBe(
      'mia@acme.test',
    );
  });
});

describe('unqualify validation', () => {
  it('requires a reason of at most 500 characters', () => {
    expect(issues(UnqualifyValidation, { reason: '  ' })).toStrictEqual([['reason', 'required']]);
    expect(issues(UnqualifyValidation, { reason: 'x'.repeat(500) })).toStrictEqual([]);
    expect(issues(UnqualifyValidation, { reason: 'x'.repeat(501) })).toStrictEqual([
      ['reason', 'too_long'],
    ]);
  });
});

describe('lead status validation', () => {
  it('needs a reason for UNQUALIFIED only, and never takes CONVERTED', () => {
    expect(issues(LeadStatusValidation, { status: 'UNQUALIFIED', reason: '' })).toStrictEqual([
      ['reason', 'required'],
    ]);
    expect(issues(LeadStatusValidation, { status: 'CONTACTED', reason: '' })).toStrictEqual([]);
    expect(issues(LeadStatusValidation, { status: 'CONVERTED', reason: '' })).toHaveLength(1);
  });
});

const CONVERT = {
  company: 'create',
  companyLink: null,
  contact: 'create',
  contactLink: null,
  deal: true,
  dealName: 'Acme — deal',
  dealAmount: '1250.00',
  dealCurrency: 'EUR',
  dealStageId: 11,
  dealCloseDate: '',
};

describe('convert form validation', () => {
  it('takes the defaults of a lead with a company', () => {
    expect(issues(ConvertFormValidation, CONVERT)).toStrictEqual([]);
  });

  it('asks for the record when linking a company or a contact', () => {
    expect(
      issues(ConvertFormValidation, { ...CONVERT, company: 'link', contact: 'link' }),
    ).toStrictEqual([
      ['companyLink', 'required'],
      ['contactLink', 'required'],
    ]);
  });

  it('checks the deal fields only while the deal is on', () => {
    const bad = { ...CONVERT, dealName: ' ', dealAmount: '1e3' };

    expect(issues(ConvertFormValidation, bad)).toStrictEqual([
      ['dealName', 'required'],
      ['dealAmount', 'money_format'],
    ]);
    expect(issues(ConvertFormValidation, { ...bad, deal: false })).toStrictEqual([]);
  });
});

describe('conversion validation', () => {
  it('takes a conversion without a deal and refuses a deal amount that is not money', () => {
    const base = { companyId: null, createCompany: false, contactId: null };

    expect(issues(ConversionValidation, { ...base, deal: null })).toStrictEqual([]);
    expect(
      issues(ConversionValidation, {
        ...base,
        deal: {
          name: 'Deal',
          amount: '0.001',
          currency: 'EUR',
          stageId: null,
          expectedCloseDate: null,
        },
      }),
    ).toStrictEqual([['deal.amount', 'money_format']]);
  });
});
