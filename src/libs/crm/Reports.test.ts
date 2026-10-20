import { describe, expect, it } from 'vitest';
import { hasPeriod, parseTab } from './Reports';

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
