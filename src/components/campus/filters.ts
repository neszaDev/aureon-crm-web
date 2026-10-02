import { endOfWeek, format, startOfWeek, subDays, subWeeks } from 'date-fns';
import type { OrgUnit } from '@/libs/api/CampusPlaceholders';

/** One choice of a filter select: the label in the current language and the unit id. */
export type FilterOption = { label: string; value: string };

/**
 * Turns organisation units into select options labelled in the current language
 * (Vue `optionsMixin.buildOptions`): the title in `locale`, else English, else "-".
 * @param list Units with one title per language.
 * @param locale Current locale.
 * @returns The options, in the order received.
 */
export const buildOptions = (list: OrgUnit[], locale: string): FilterOption[] =>
  list.map((unit) => {
    const title = (key: string) =>
      unit.title.find((entry) => entry.key === key && entry.value !== '')?.value;

    return { label: title(locale) ?? title('en') ?? '-', value: unit._id };
  });

/** Quick date ranges of the organisation filter, in button order. */
export const QUICK_RANGES = ['today', 'yesterday', 'this_week', 'last_week'] as const;

export type QuickRange = (typeof QUICK_RANGES)[number];

const day = (date: Date) => format(date, 'yyyy-MM-dd');

/**
 * Computes the inclusive start and end days of a quick range. Weeks start on Monday.
 * @param range Which range.
 * @param now The current time.
 * @returns Both days as `yyyy-MM-dd`, ready for `<input type="date">`.
 */
export const quickRange = (range: QuickRange, now: Date) => {
  const lastWeek = subWeeks(now, 1);
  const ranges: Record<QuickRange, [Date, Date]> = {
    today: [now, now],
    yesterday: [subDays(now, 1), subDays(now, 1)],
    this_week: [startOfWeek(now, { weekStartsOn: 1 }), now],
    last_week: [
      startOfWeek(lastWeek, { weekStartsOn: 1 }),
      endOfWeek(lastWeek, { weekStartsOn: 1 }),
    ],
  };
  const [start, end] = ranges[range];

  return { start: day(start), end: day(end) };
};

/**
 * The Thai academic year (Buddhist Era) of a date: the Gregorian year + 543.
 * @param date The date.
 * @returns The B.E. year.
 */
export const buddhistYear = (date: Date) => date.getFullYear() + 543;
