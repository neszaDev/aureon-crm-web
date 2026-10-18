import { describe, expect, it } from 'vitest';
import type * as z from 'zod';
import { DealValidation, MoveFormValidation, MoveValidation } from './DealValidation';

const VALID = {
  name: 'Acme renewal',
  amount: '1250.50',
  currency: '',
  stageId: null,
  probability: '',
  expectedCloseDate: '',
  ownerId: null,
  companyId: null,
  contactId: null,
  sourceId: null,
  notes: '',
};

// Each issue as [path, message]: the field it shows on and its `Validation` key.
const issues = (schema: z.ZodType, input: unknown) => {
  const result = schema.safeParse(input);

  return result.success
    ? []
    : result.error.issues.map((item) => [item.path.join('.'), item.message]);
};

describe('deal validation', () => {
  it('accepts the least a deal needs: a name and an amount', () => {
    expect(issues(DealValidation, VALID)).toStrictEqual([]);
  });

  it('requires a name of at most 200 characters, trimmed', () => {
    expect(issues(DealValidation, { ...VALID, name: '   ' })).toStrictEqual([['name', 'required']]);
    expect(issues(DealValidation, { ...VALID, name: 'a'.repeat(200) })).toStrictEqual([]);
    expect(issues(DealValidation, { ...VALID, name: 'a'.repeat(201) })).toStrictEqual([
      ['name', 'too_long'],
    ]);
  });

  it.each(['1,250.50', '1e3', '0.001', '-5', '10000000000000', '', ' ', '12.'])(
    'refuses the amount %j',
    (amount) => {
      expect(issues(DealValidation, { ...VALID, amount })).toStrictEqual([
        ['amount', 'money_format'],
      ]);
    },
  );

  it.each(['0', '1250', '1250.5', '9999999999999.99'])('accepts the amount %j', (amount) => {
    expect(issues(DealValidation, { ...VALID, amount })).toStrictEqual([]);
  });

  it('takes a currency code or none, which means the workspace currency', () => {
    expect(issues(DealValidation, { ...VALID, currency: 'USD' })).toStrictEqual([]);
    expect(issues(DealValidation, { ...VALID, currency: 'usd' })).toStrictEqual([
      ['currency', 'invalid_currency'],
    ]);
  });

  it.each(['', '0', '60', '100'])('accepts the probability %j', (probability) => {
    expect(issues(DealValidation, { ...VALID, probability })).toStrictEqual([]);
  });

  it.each(['101', '-1', '12.5', '1e1', 'abc', '007x'])(
    'refuses the probability %j',
    (probability) => {
      expect(issues(DealValidation, { ...VALID, probability })).toStrictEqual([
        ['probability', 'probability_range'],
      ]);
    },
  );

  it('takes an expected close date that exists, or none', () => {
    expect(issues(DealValidation, { ...VALID, expectedCloseDate: '2026-12-31' })).toStrictEqual([]);
    expect(issues(DealValidation, { ...VALID, expectedCloseDate: '2026-02-30' })).toStrictEqual([
      ['expectedCloseDate', 'invalid_date'],
    ]);
  });

  it('limits the notes to 5000 characters', () => {
    expect(issues(DealValidation, { ...VALID, notes: 'a'.repeat(5000) })).toStrictEqual([]);
    expect(issues(DealValidation, { ...VALID, notes: 'a'.repeat(5001) })).toStrictEqual([
      ['notes', 'too_long'],
    ]);
  });

  it('takes links as record ids or none', () => {
    expect(
      issues(DealValidation, { ...VALID, companyId: 7, contactId: 9, sourceId: 2, ownerId: 3 }),
    ).toStrictEqual([]);
    expect(issues(DealValidation, { ...VALID, companyId: 0 })).not.toStrictEqual([]);
  });
});

describe('move validation', () => {
  it('needs a reason to close a deal as lost, on the reason', () => {
    expect(issues(MoveFormValidation, { stageId: 5, lost: true, lostReason: '  ' })).toStrictEqual([
      ['lostReason', 'required'],
    ]);
    expect(
      issues(MoveFormValidation, { stageId: 5, lost: true, lostReason: 'Went with a rival' }),
    ).toStrictEqual([]);
  });

  it('asks for no reason when the stage is not Lost', () => {
    expect(issues(MoveFormValidation, { stageId: 2, lost: false, lostReason: '' })).toStrictEqual(
      [],
    );
  });

  it('limits the reason to 500 characters', () => {
    expect(
      issues(MoveFormValidation, { stageId: 5, lost: true, lostReason: 'a'.repeat(501) }),
    ).toStrictEqual([['lostReason', 'too_long']]);
  });

  it('takes the move the action sends: a stage, the version and an optional reason', () => {
    expect(issues(MoveValidation, { stageId: 2, version: 4 })).toStrictEqual([]);
    expect(issues(MoveValidation, { stageId: 2, version: 4, lostReason: 'x' })).toStrictEqual([]);
    expect(issues(MoveValidation, { stageId: 0, version: 4 })).not.toStrictEqual([]);
    expect(issues(MoveValidation, { stageId: 2, version: -1 })).not.toStrictEqual([]);
  });
});
