import { describe, expect, it } from 'vitest';
import { daysSince, formatDate, formatInstant, formatMoney, recordNumber } from './Format';

const HOUR = 60 * 60 * 1000;

describe(formatMoney, () => {
  it('formats an amount in its currency and the locale', () => {
    expect(formatMoney('1250.5', 'USD', 'en')).toBe('$1,250.50');
  });

  it('keeps every digit of the largest amount', () => {
    expect(formatMoney('9999999999999.99', 'THB', 'th')).toContain('9,999,999,999,999.99');
  });
});

describe(formatDate, () => {
  it('shows a date-only value as that day, whatever the time zone of the process', () => {
    // Also run with TZ=America/Los_Angeles: midnight UTC is the day before there.
    expect(formatDate('2026-10-01', 'en')).toBe('Oct 1, 2026');
  });
});

describe(formatInstant, () => {
  it('shows an instant in the given time zone', () => {
    const instant = '2026-10-18T17:30:00Z';

    expect(formatInstant(instant, { locale: 'en', timeZone: 'Asia/Bangkok' })).toBe('Oct 19, 2026');
    expect(formatInstant(instant, { locale: 'en', timeZone: 'UTC', withTime: true })).toMatch(
      /^Oct 18, 2026, 5:30\sPM$/u,
    );
  });
});

describe(daysSince, () => {
  it('counts whole days, rounded down', () => {
    const now = new Date('2026-10-18T12:00:00Z');

    expect(daysSince(new Date(now.getTime() - 36 * HOUR).toISOString(), now)).toBe(1);
    expect(daysSince(now.toISOString(), now)).toBe(0);
  });

  it('never counts below zero for a time ahead of now', () => {
    const now = new Date('2026-10-18T12:00:00Z');

    expect(daysSince('2026-10-19T12:00:00Z', now)).toBe(0);
  });
});

describe(recordNumber, () => {
  it('prefixes the kind and pads the id to four digits', () => {
    expect(recordNumber('deal', 42)).toBe('D-0042');
    expect(recordNumber('contact', 7)).toBe('P-0007');
    expect(recordNumber('lead', 1)).toBe('L-0001');
    expect(recordNumber('task', 9999)).toBe('T-9999');
  });

  it('keeps a longer id whole', () => {
    expect(recordNumber('company', 123_456)).toBe('C-123456');
  });
});
