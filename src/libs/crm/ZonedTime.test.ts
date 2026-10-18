import { describe, expect, it } from 'vitest';
import { toInstant, toLocalInput } from './ZonedTime';

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
      expect(toLocalInput(toInstant(local, zone), zone)).toBe(local);
    }
  });
});
