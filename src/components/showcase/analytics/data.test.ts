import { describe, expect, it } from 'vitest';
import { PERIODS, trafficCsv, trafficSeries, usageTone } from './data';

describe(trafficSeries, () => {
  it('returns one point per hour, day of the four weeks or month', () => {
    expect(trafficSeries('day')).toHaveLength(24);
    expect(trafficSeries('month')).toHaveLength(28);
    expect(trafficSeries('year')).toHaveLength(12);
  });

  it('returns the same series on every call', () => {
    for (const period of PERIODS) {
      expect(trafficSeries(period)).toStrictEqual(trafficSeries(period));
    }
  });

  it('keeps visits and unique visitors within the demo ranges', () => {
    const points = PERIODS.flatMap((period) => trafficSeries(period));

    for (const point of points) {
      expect(point.visits).toBeGreaterThanOrEqual(50);
      expect(point.visits).toBeLessThanOrEqual(200);
      expect(point.unique).toBeGreaterThanOrEqual(80);
      expect(point.unique).toBeLessThanOrEqual(100);
    }
  });

  it('draws a different series for each period', () => {
    expect(trafficSeries('day').slice(0, 12)).not.toStrictEqual(trafficSeries('year'));
  });
});

describe(trafficCsv, () => {
  it('writes a header row and one line per point', () => {
    expect(
      trafficCsv(
        ['Month', 'Visits', 'Unique', 'Target'],
        [
          ['January 2026', 120, 90, 65],
          ['February 2026', 80, 85, 65],
        ],
      ),
    ).toBe('Month,Visits,Unique,Target\r\nJanuary 2026,120,90,65\r\nFebruary 2026,80,85,65');
  });

  it('quotes fields that hold commas or quotes', () => {
    expect(trafficCsv(['Day', 'A', 'B', 'C'], [['Monday, 31 "Aug"', 1, 2, 3]])).toBe(
      'Day,A,B,C\r\n"Monday, 31 ""Aug""",1,2,3',
    );
  });
});

describe(usageTone, () => {
  it('picks a tone per quarter of usage', () => {
    expect([0, 25, 26, 50, 75, 76, 100].map((value) => usageTone(value))).toStrictEqual([
      'ink',
      'ink',
      'pass',
      'pass',
      'slate',
      'pencil',
      'pencil',
    ]);
  });
});
