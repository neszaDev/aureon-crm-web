import { describe, expect, it } from 'vitest';
import { hasPeriod, parseOwner, parseTab, reportParams } from './Reports';

describe(parseTab, () => {
  it('reads each report by its name', () => {
    expect(parseTab({ tab: 'won-lost' })).toBe('won-lost');
    expect(parseTab({ tab: 'follow-ups' })).toBe('follow-ups');
  });

  it('shows the pipeline without a tab, with a value that is no report, or an empty one', () => {
    expect(parseTab({})).toBe('pipeline');
    expect(parseTab({ tab: 'Funnel' })).toBe('pipeline');
    expect(parseTab({ tab: '' })).toBe('pipeline');
    expect(parseTab({ tab: 'constructor' })).toBe('pipeline');
  });

  it('takes the first of a repeated tab', () => {
    expect(parseTab({ tab: ['funnel', 'activities'] })).toBe('funnel');
    expect(parseTab({ tab: ['nope', 'funnel'] })).toBe('pipeline');
  });
});

describe(hasPeriod, () => {
  it('is true for the three reports of a period only', () => {
    expect(
      (['pipeline', 'won-lost', 'funnel', 'activities', 'follow-ups'] as const).map(hasPeriod),
    ).toStrictEqual([false, true, true, true, false]);
  });
});

describe(parseOwner, () => {
  it('reads the id of the member the reports count', () => {
    expect(parseOwner({ ownerId: '12' })).toBe(12);
    expect(parseOwner({ ownerId: '999999999999999' })).toBe(999_999_999_999_999);
  });

  it('takes the first of a repeated owner', () => {
    expect(parseOwner({ ownerId: ['12', '13'] })).toBe(12);
    expect(parseOwner({ ownerId: ['me', '13'] })).toBeUndefined();
  });

  it('counts the whole workspace without an owner, or with a value that is no id', () => {
    expect(parseOwner({})).toBeUndefined();
    for (const value of [
      '',
      '0',
      '-3',
      '012',
      '1.5',
      '1e3',
      ' 12',
      'unassigned',
      '1234567890123456',
    ]) {
      expect(parseOwner({ ownerId: value })).toBeUndefined();
    }
  });
});

describe(reportParams, () => {
  it('keeps the tab, and the owner while there is one', () => {
    expect(reportParams('funnel')).toStrictEqual({ tab: 'funnel' });
    expect(reportParams('follow-ups', 12)).toStrictEqual({ tab: 'follow-ups', ownerId: '12' });
  });
});
