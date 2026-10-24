import { isDate } from './ListQuery';

/** A period as its URL holds it: `YYYY-MM-DD` days, both inclusive; one left out is the API's default. */
export type PeriodQuery = { from?: string; to?: string };

type SearchParams = Record<string, string | string[] | undefined>;

const DAY = 24 * 60 * 60 * 1000;
// The API refuses a period of more than 366 days, both ends included (`Period.MAX_DAYS`).
const MAX_DAYS = 366;

const time = (day: string) => Date.parse(`${day}T00:00:00Z`);
const shift = (day: string, days: number) =>
  new Date(time(day) + days * DAY).toISOString().slice(0, 10);

// A real calendar day the API takes: its years run from 1.
const readDay = (value: string | string[] | undefined) => {
  const day = Array.isArray(value) ? value[0] : value;

  return day !== undefined && isDate(day) && day >= '0001-01-01' ? day : undefined;
};

/**
 * Reads a period from the URL, as the API would take it. A value that is not a real day is
 * dropped; so are both when `from` is after `to` or the span is over 366 days, since the API
 * answers 400 to them. The page then shows the default period (the last 30 days), never an error.
 * @param searchParams The page's search params.
 * @param today Today in the workspace's time zone: with it, a `from` alone is checked against
 *   today, which the API takes as its `to`.
 * @returns The valid `from` and `to`.
 */
export const parsePeriod = (searchParams: SearchParams, today?: string): PeriodQuery => {
  const from = readDay(searchParams.from);
  const to = readDay(searchParams.to);
  const end = to ?? today;
  if (from && end && (from > end || (time(end) - time(from)) / DAY >= MAX_DAYS)) {
    return {};
  }

  return { ...(from && { from }), ...(to && { to }) };
};

/**
 * A link to the same page with another period. The other params stay; without a period, the
 * link leaves `from` and `to` out, which is the default period.
 * @param pathname The page's path.
 * @param params The page's other params (a period in them is replaced).
 * @param period The period to show.
 * @returns The path with its query string.
 */
export const periodHref = (
  pathname: string,
  params: Record<string, string | string[]>,
  period?: PeriodQuery,
) => {
  const search = new URLSearchParams();
  const others = Object.entries(params).filter(([key]) => key !== 'from' && key !== 'to');
  for (const [key, value] of [...others, ...Object.entries(period ?? {})]) {
    for (const item of [value].flat()) {
      search.append(key, item);
    }
  }
  const text = search.toString();

  return text ? `${pathname}?${text}` : pathname;
};

/**
 * The periods the picker offers, counted in the workspace's time zone.
 * @param today Today there, `YYYY-MM-DD`.
 * @returns Each preset's key and its days, in the order the picker lists them. "This month" runs
 *   to today; "Last month" over its whole length.
 */
export const periodPresets = (today: string) => {
  const monthStart = `${today.slice(0, 8)}01`;
  const lastMonthEnd = shift(monthStart, -1);

  return [
    { key: 'last7', period: { from: shift(today, -6), to: today } },
    { key: 'last30', period: { from: shift(today, -29), to: today } },
    { key: 'last90', period: { from: shift(today, -89), to: today } },
    { key: 'thisMonth', period: { from: monthStart, to: today } },
    { key: 'lastMonth', period: { from: `${lastMonthEnd.slice(0, 8)}01`, to: lastMonthEnd } },
  ] as const;
};
