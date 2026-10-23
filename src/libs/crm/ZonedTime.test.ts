import { afterEach, describe, expect, it, vi } from 'vitest';
import { toInstant, toLocalInput, todayIn, partOfDay } from './ZonedTime';

describe(toInstant, () => {
  it('reads a local time in the given time zone', () => {
    expect(toInstant('2026-10-18T09:00', 'Asia/Bangkok')).toBe('2026-10-18T02:00:00.000Z');
    expect(toInstant('2026-10-18T09:00', 'UTC')).toBe('2026-10-18T09:00:00.000Z');
  });

  it('moves a time the clocks skip forward by the gap', () => {
    // Paris skips 02:00-03:00 on 29 March 2026: 02:30 is 03:30 summer time.
    expect(toInstant('2026-03-29T02:30', 'Europe/Paris')).toBe('2026-03-29T01:30:00.000Z');
  });

  it('takes the earlier of a time the clocks repeat', () => {
    // Paris repeats 02:00-03:00 on 25 October 2026: the first 02:30 is still summer time.
    expect(toInstant('2026-10-25T02:30', 'Europe/Paris')).toBe('2026-10-25T00:30:00.000Z');
  });

  it('reads nothing but a real local date and time to the minute', () => {
    for (const local of [
      '12345-10-18T09:00',
      '+012345-10-18T09:00',
      '2026-10-18T09:00:30',
      '2026-10-18',
      '2026-10-18T',
      '2026-02-30T09:00',
      '2026-10-18T24:00',
      '2026-10-18T9:00',
      '',
    ]) {
      expect(toInstant(local, 'Asia/Bangkok')).toBeUndefined();
    }
  });
});

describe(toLocalInput, () => {
  it('shows an instant as a local time in the given time zone', () => {
    expect(toLocalInput('2026-10-18T02:00:00.000Z', 'Asia/Bangkok')).toBe('2026-10-18T09:00');
    expect(toLocalInput('2026-10-25T01:30:00.000Z', 'Europe/Paris')).toBe('2026-10-25T02:30');
  });

  it('gives back the local time it was given', () => {
    for (const [local, zone] of [
      ['2026-10-18T09:00', 'Asia/Bangkok'],
      ['2026-07-01T23:45', 'America/Los_Angeles'],
      ['2026-01-15T00:05', 'Europe/Paris'],
    ] as const) {
      expect(toLocalInput(toInstant(local, zone) ?? '', zone)).toBe(local);
    }
  });
});

describe(todayIn, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is the date in the zone, which is another day than UTC's for part of every day", () => {
    vi.useFakeTimers();
    // 20:00 UTC on 18 October: already the 19th in Bangkok, still the 18th in New York.
    vi.setSystemTime(new Date('2026-10-18T20:00:00Z'));

    expect(todayIn('Asia/Bangkok')).toBe('2026-10-19');
    expect(todayIn('America/New_York')).toBe('2026-10-18');
  });
});

// A time in Bangkok (UTC+7), by its UTC instant.
const inBangkok = (utc: string) => partOfDay('Asia/Bangkok', new Date(utc));

describe(partOfDay, () => {
  it("names the part of the day by the zone's own clock", () => {
    // 04:59 and 05:00, 11:59 and 12:00 in Bangkok.
    expect(inBangkok('2026-10-18T21:59:00Z')).toBe('evening');
    expect(inBangkok('2026-10-18T22:00:00Z')).toBe('morning');
    expect(inBangkok('2026-10-19T04:59:00Z')).toBe('morning');
    expect(inBangkok('2026-10-19T05:00:00Z')).toBe('afternoon');
  });

  it('turns to evening at 6 PM', () => {
    expect(inBangkok('2026-10-19T10:59:00Z')).toBe('afternoon');
    expect(inBangkok('2026-10-19T11:00:00Z')).toBe('evening');
  });
});
