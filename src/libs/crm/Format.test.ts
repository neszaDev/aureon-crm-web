import { describe, expect, it } from 'vitest';
import {
  daysSince,
  formatAmount,
  formatDate,
  formatInstant,
  formatMoney,
  formatMonth,
  formatPeriod,
  fullName,
  recordNumber,
} from './Format';

const HOUR = 60 * 60 * 1000;

describe(formatMoney, () => {
  it('formats an amount in its currency and the locale', () => {
    expect(formatMoney('1250.5', 'USD', 'en')).toBe('$1,250.50');
  });

  it('keeps every digit of the largest amount', () => {
    expect(formatMoney('9999999999999.99', 'THB', 'th')).toContain('9,999,999,999,999.99');
  });

  it('keeps the cents of an amount past the precision of a float', () => {
    // As a Number this would round to 12,345,678,901,234,568.00.
    expect(formatMoney('12345678901234567.89', 'USD', 'en')).toBe('$12,345,678,901,234,567.89');
  });

  it('leaves the cents off a whole amount when asked to be short, and only then', () => {
    expect(formatMoney('47000.00', 'USD', 'en', { short: true })).toBe('$47,000');
    expect(formatMoney('1250.50', 'EUR', 'en', { short: true })).toBe('€1,250.50');
    expect(formatMoney('47000.00', 'USD', 'en')).toBe('$47,000.00');
  });
});

describe(formatAmount, () => {
  it('groups the digits and keeps the cents, without a currency it does not know', () => {
    expect(formatAmount('1250.5', 'en')).toBe('1,250.50');
    expect(formatAmount('47000', 'fr')).toMatch(/^47\s000,00$/u);
  });

  it('keeps every digit of the largest amount', () => {
    expect(formatAmount('9999999999999.99', 'en')).toBe('9,999,999,999,999.99');
  });
});

describe(formatDate, () => {
  it('shows a date-only value as that day, whatever the time zone of the process', () => {
    // Also run with TZ=America/Los_Angeles: midnight UTC is the day before there.
    expect(formatDate('2026-10-01', 'en')).toBe('Oct 1, 2026');
  });
});

describe(formatPeriod, () => {
  it('writes the year once when both days are in it', () => {
    expect(formatPeriod({ from: '2026-09-19', to: '2026-10-18' }, 'en')).toBe(
      'Sep 19 – Oct 18, 2026',
    );
    expect(formatPeriod({ from: '2026-10-01', to: '2026-10-01' }, 'fr')).toBe(
      '1 oct. – 1 oct. 2026',
    );
  });

  it('writes both years across a new year', () => {
    expect(formatPeriod({ from: '2025-12-20', to: '2026-01-18' }, 'en')).toBe(
      'Dec 20, 2025 – Jan 18, 2026',
    );
  });
});

describe(formatMonth, () => {
  it('names a report month in the page language, as the same month in every time zone', () => {
    expect(formatMonth('2026-09', 'en')).toBe('Sep 2026');
    expect(formatMonth('2026-01', 'fr')).toBe('janv. 2026');
    // Thai counts years from the Buddhist era, as the other dates do.
    expect(formatMonth('2026-10', 'th')).toContain('2569');
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

describe(fullName, () => {
  it('joins the first and last name, and takes a first name alone', () => {
    expect(fullName({ firstName: 'Mia', lastName: 'Chan' })).toBe('Mia Chan');
    expect(fullName({ firstName: 'Mia' })).toBe('Mia');
  });
});
