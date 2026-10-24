import { describe, expect, it } from 'vitest';
import { parsePeriod, periodHref, periodPresets } from './PeriodQuery';

describe(parsePeriod, () => {
  it('keeps real dates, in order', () => {
    expect(parsePeriod({ from: '2026-09-01', to: '2026-09-30' })).toStrictEqual({
      from: '2026-09-01',
      to: '2026-09-30',
    });
  });

  it('falls back to the defaults for hand-edited values, never an error', () => {
    // The Review Focus value, and the other ways a date is not one.
    expect(parsePeriod({ from: '2026-13-01', to: 'x' })).toStrictEqual({});
    expect(parsePeriod({ from: '2026-02-30', to: '2026-03-10' })).toStrictEqual({
      to: '2026-03-10',
    });
    for (const bad of ['', ' ', '17/10/2026', '2026-1-1', '2026-10-18T00:00', '0000-01-01']) {
      expect(parsePeriod({ from: bad, to: bad })).toStrictEqual({});
    }
  });

  it('drops both when from is after to', () => {
    expect(parsePeriod({ from: '2026-10-18', to: '2026-10-17' })).toStrictEqual({});
  });

  it('keeps from equal to to: one day', () => {
    expect(parsePeriod({ from: '2026-10-17', to: '2026-10-17' })).toStrictEqual({
      from: '2026-10-17',
      to: '2026-10-17',
    });
  });

  it('keeps 366 days, both ends included, and drops 367 (the API refuses them)', () => {
    expect(parsePeriod({ from: '2025-10-18', to: '2026-10-18' })).toStrictEqual({
      from: '2025-10-18',
      to: '2026-10-18',
    });
    expect(parsePeriod({ from: '2025-10-17', to: '2026-10-18' })).toStrictEqual({});
    // A leap year is 366 days.
    expect(parsePeriod({ from: '2024-01-01', to: '2024-12-31' })).toStrictEqual({
      from: '2024-01-01',
      to: '2024-12-31',
    });
  });

  it('keeps a date alone, which the API completes with today or 29 days before', () => {
    expect(parsePeriod({ to: '2026-09-30' })).toStrictEqual({ to: '2026-09-30' });
    expect(parsePeriod({ from: '2026-09-01' }, '2026-10-18')).toStrictEqual({ from: '2026-09-01' });
  });

  it('drops a from alone that today makes empty or too long', () => {
    expect(parsePeriod({ from: '2026-10-19' }, '2026-10-18')).toStrictEqual({});
    expect(parsePeriod({ from: '2025-10-17' }, '2026-10-18')).toStrictEqual({});
    // Without today there is nothing to compare with.
    expect(parsePeriod({ from: '2099-01-01' })).toStrictEqual({ from: '2099-01-01' });
  });

  it('reads the first of a repeated param', () => {
    expect(parsePeriod({ from: ['2026-09-01', 'x'], to: ['2026-09-30'] })).toStrictEqual({
      from: '2026-09-01',
      to: '2026-09-30',
    });
  });
});

describe(periodHref, () => {
  const PATH = '/app/1/reports';

  it('sets the period and keeps the other params', () => {
    expect(periodHref(PATH, { tab: 'funnel' }, { from: '2026-09-01', to: '2026-09-30' })).toBe(
      '/app/1/reports?tab=funnel&from=2026-09-01&to=2026-09-30',
    );
  });

  it('replaces the period the params carry', () => {
    expect(
      periodHref(
        PATH,
        { from: '2026-01-01', to: '2026-01-31', tab: 'funnel' },
        { from: '2026-09-01', to: '2026-09-30' },
      ),
    ).toBe('/app/1/reports?tab=funnel&from=2026-09-01&to=2026-09-30');
  });

  it('leaves the period out for the defaults', () => {
    expect(periodHref(PATH, { from: '2026-01-01', to: '2026-01-31', tab: 'funnel' })).toBe(
      '/app/1/reports?tab=funnel',
    );
    expect(periodHref('/app/1', {})).toBe('/app/1');
  });

  it('keeps a repeated param repeated', () => {
    expect(periodHref(PATH, { owner: ['1', '2'] })).toBe('/app/1/reports?owner=1&owner=2');
  });
});

const presets = (today: string) =>
  Object.fromEntries(periodPresets(today).map((preset) => [preset.key, preset.period]));

describe(periodPresets, () => {
  // Sunday 18 October 2026.
  it('counts the days back from today, today included', () => {
    expect(presets('2026-10-18')).toMatchObject({
      last7: { from: '2026-10-12', to: '2026-10-18' },
      last30: { from: '2026-09-19', to: '2026-10-18' },
      last90: { from: '2026-07-21', to: '2026-10-18' },
    });
  });

  it('runs this month from its first day to today, last month over its whole length', () => {
    expect(presets('2026-10-18')).toMatchObject({
      thisMonth: { from: '2026-10-01', to: '2026-10-18' },
      lastMonth: { from: '2026-09-01', to: '2026-09-30' },
    });
  });

  it('takes last month across a new year and in a leap February', () => {
    expect(presets('2027-01-05').lastMonth).toStrictEqual({ from: '2026-12-01', to: '2026-12-31' });
    expect(presets('2024-03-10').lastMonth).toStrictEqual({ from: '2024-02-01', to: '2024-02-29' });
  });

  it('lists the presets in the order the picker shows them', () => {
    expect(periodPresets('2026-10-18').map((preset) => preset.key)).toStrictEqual([
      'last7',
      'last30',
      'last90',
      'thisMonth',
      'lastMonth',
    ]);
  });

  it('gives periods the parser keeps', () => {
    for (const preset of periodPresets('2026-10-18')) {
      expect(parsePeriod(preset.period, '2026-10-18')).toStrictEqual(preset.period);
    }
  });
});
