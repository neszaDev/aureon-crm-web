import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  eachWeekOfInterval,
  endOfMonth,
  endOfYear,
  max,
  min,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import type { Day } from 'date-fns';
import type { CalendarEvent } from './data';

/** How much time the calendar shows at once. */
export type CalendarPeriod = 'week' | 'month' | 'year';

export const CALENDAR_PERIODS: readonly CalendarPeriod[] = ['year', 'month', 'week'];

/**
 * The first day of each week row the calendar shows for a period.
 * @param date Any day in the period.
 * @param period The period shown.
 * @param weekStartsOn First day of the week (0 is Sunday).
 * @returns The week starts, in order.
 */
export const weeksOfPeriod = (date: Date, period: CalendarPeriod, weekStartsOn: Day) => {
  const options = { weekStartsOn };
  if (period === 'week') {
    return [startOfWeek(date, options)];
  }
  const start = period === 'month' ? startOfMonth(date) : startOfYear(date);
  const end = period === 'month' ? endOfMonth(date) : endOfYear(date);
  return eachWeekOfInterval({ start, end }, options);
};

/**
 * Moves the shown date by whole periods.
 * @param date The shown date.
 * @param period The period shown.
 * @param amount Periods to move, negative to go back.
 * @returns The new shown date.
 */
export const shiftPeriod = (date: Date, period: CalendarPeriod, amount: number) => {
  if (period === 'week') {
    return addWeeks(date, amount);
  }
  return period === 'month' ? addMonths(date, amount) : addYears(date, amount);
};

/** One event's bar inside a week row. Columns count from 0. */
export type WeekSegment = {
  event: CalendarEvent;
  column: number;
  span: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

/**
 * Places the events that touch a week as bars: each bar spans its days in the week and takes
 * the first lane that is free on all of them.
 * @param weekStart First day of the week.
 * @param events All events.
 * @returns The bars, and how many lanes they need.
 */
export const layoutWeek = (weekStart: Date, events: readonly CalendarEvent[]) => {
  const first = startOfDay(weekStart);
  const last = addDays(first, 6);
  const touching = events
    .filter((event) => startOfDay(event.start) <= last && startOfDay(event.end) >= first)
    .toSorted(
      (a, b) =>
        a.start.getTime() - b.start.getTime() ||
        differenceInCalendarDays(b.end, b.start) - differenceInCalendarDays(a.end, a.start),
    );

  // lanes[lane][column] is true when that day of that lane is taken.
  const lanes: boolean[][] = [];
  const segments: WeekSegment[] = touching.map((event) => {
    const from = max([startOfDay(event.start), first]);
    const to = min([startOfDay(event.end), last]);
    const column = differenceInCalendarDays(from, first);
    const span = differenceInCalendarDays(to, from) + 1;
    const days = Array.from({ length: span }, (_, index) => column + index);
    let lane = lanes.findIndex((row) => days.every((day) => !row[day]));
    let taken = lanes[lane];
    if (!taken) {
      taken = Array.from({ length: 7 }, () => false);
      lane = lanes.length;
      lanes.push(taken);
    }
    for (const day of days) {
      taken[day] = true;
    }
    return {
      event,
      column,
      span,
      lane,
      continuesBefore: startOfDay(event.start) < first,
      continuesAfter: startOfDay(event.end) > last,
    };
  });

  return { segments, laneCount: lanes.length };
};

/**
 * Moves an event so it starts on another day, keeping its times and length.
 * @param event The event.
 * @param day The day it now starts on.
 * @returns The moved event.
 */
export const moveEventTo = (event: CalendarEvent, day: Date): CalendarEvent => {
  const delta = differenceInCalendarDays(day, event.start);
  return { ...event, start: addDays(event.start, delta), end: addDays(event.end, delta) };
};
