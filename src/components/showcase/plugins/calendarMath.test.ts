import { describe, expect, it } from 'vitest';
import { layoutWeek, moveEventTo, shiftPeriod, weeksOfPeriod } from './calendarMath';
import type { CalendarEvent } from './data';
import { buildSampleEvents } from './data';

const event = (id: string, start: Date, end: Date): CalendarEvent => ({
  id,
  title: id,
  start,
  end,
  tone: 'muted',
});

// Sunday 4 October 2026 to Saturday 10 October 2026.
const weekStart = new Date(2026, 9, 4);

describe(weeksOfPeriod, () => {
  it('returns the week rows that cover a month', () => {
    const weeks = weeksOfPeriod(new Date(2026, 9, 15), 'month', 0);

    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toStrictEqual(new Date(2026, 8, 27));
  });

  it('starts weeks on Monday when asked', () => {
    expect(weeksOfPeriod(new Date(2026, 9, 15), 'week', 1)).toStrictEqual([new Date(2026, 9, 12)]);
  });

  it('covers every week of the year', () => {
    expect(weeksOfPeriod(new Date(2026, 5, 1), 'year', 0)).toHaveLength(53);
  });
});

describe(shiftPeriod, () => {
  it('moves by the period shown', () => {
    const date = new Date(2026, 0, 31);

    expect(shiftPeriod(date, 'month', 1)).toStrictEqual(new Date(2026, 1, 28));
    expect(shiftPeriod(date, 'week', -1)).toStrictEqual(new Date(2026, 0, 24));
    expect(shiftPeriod(date, 'year', 1)).toStrictEqual(new Date(2027, 0, 31));
  });
});

describe(layoutWeek, () => {
  it('stacks overlapping events in separate lanes and reuses free lanes', () => {
    const { segments, laneCount } = layoutWeek(weekStart, [
      event('long', new Date(2026, 9, 5), new Date(2026, 9, 8)),
      event('inside', new Date(2026, 9, 6, 10), new Date(2026, 9, 6, 11)),
      event('later', new Date(2026, 9, 9), new Date(2026, 9, 9)),
    ]);
    const lane = (id: string) => segments.find((segment) => segment.event.id === id);

    expect(laneCount).toBe(2);
    expect(lane('long')).toMatchObject({ column: 1, span: 4, lane: 0 });
    expect(lane('inside')).toMatchObject({ column: 2, span: 1, lane: 1 });
    expect(lane('later')).toMatchObject({ column: 5, span: 1, lane: 0 });
  });

  it('clips events that run past the week and marks where they continue', () => {
    const { segments } = layoutWeek(weekStart, [
      event('across', new Date(2026, 9, 2), new Date(2026, 9, 12)),
    ]);

    expect(segments[0]).toMatchObject({
      column: 0,
      span: 7,
      continuesBefore: true,
      continuesAfter: true,
    });
  });

  it('leaves out events of other weeks', () => {
    expect(
      layoutWeek(weekStart, [event('next', new Date(2026, 9, 11), new Date(2026, 9, 11))]).segments,
    ).toHaveLength(0);
  });
});

describe(moveEventTo, () => {
  it('moves the start to the new day and keeps times and length', () => {
    const moved = moveEventTo(
      event('late', new Date(2026, 9, 17, 19, 30), new Date(2026, 9, 18, 2)),
      new Date(2026, 9, 3),
    );

    expect(moved.start).toStrictEqual(new Date(2026, 9, 3, 19, 30));
    expect(moved.end).toStrictEqual(new Date(2026, 9, 4, 2));
  });
});

describe(buildSampleEvents, () => {
  it('places the sample events in the month of today, the same way every time', () => {
    const events = buildSampleEvents(new Date(2026, 9, 2));

    expect(events.find((item) => item.id === 'conference')?.start).toStrictEqual(
      new Date(2026, 9, 11),
    );
    expect(events.find((item) => item.id === 'all-day')?.start).toStrictEqual(
      new Date(2026, 8, 30),
    );
    expect(buildSampleEvents(new Date(2026, 9, 20))).toStrictEqual(events);
  });
});
