const DAY = 24 * 60 * 60 * 1000;

// The letter before a record's number (`D-0042`); CSV references and the API docs use the same.
const RECORD_PREFIXES = { company: 'C', contact: 'P', lead: 'L', deal: 'D', task: 'T' };

/**
 * Shows an amount in its currency. The amount stays a decimal string: no float rounding.
 * @param amount The amount as the backend sends it (`1250.50`).
 * @param currency Its ISO 4217 code.
 * @param locale The page's locale.
 * @param opts Options.
 * @param opts.short Leaves off the cents of a whole amount (`$1,250`), for a tight place; any
 *   other amount keeps its cents, so no digit is lost.
 * @returns The amount, e.g. `$1,250.50`.
 */
export const formatMoney = (
  amount: string,
  currency: string,
  locale: string,
  opts?: { short?: boolean },
) => {
  const format = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    trailingZeroDisplay: opts?.short ? 'stripIfInteger' : 'auto',
  });

  // Intl reads a decimal string exactly, every digit kept; its type only names `${number}`.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see above
  return format.format(amount as `${number}`);
};

/**
 * Shows an amount whose currency is not known, such as a change in the history: grouped, with the
 * cents. The amount stays a decimal string: no float rounding.
 * @param amount The amount as the backend sends it (`1250.50`).
 * @param locale The page's locale.
 * @returns The amount, e.g. `1,250.50`.
 */
export const formatAmount = (amount: string, locale: string) =>
  new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(
    // Intl reads a decimal string exactly, every digit kept; its type only names `${number}`.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see above
    amount as `${number}`,
  );

/**
 * Shows an instant (a date and time) in the workspace's time zone.
 * @param instant An ISO 8601 instant.
 * @param opts Options.
 * @param opts.locale The page's locale.
 * @param opts.timeZone The workspace's time zone.
 * @param opts.withTime Whether to show the time too.
 * @returns The date, and the time when asked.
 */
export const formatInstant = (
  instant: string,
  opts: { locale: string; timeZone: string; withTime?: boolean },
) =>
  new Intl.DateTimeFormat(opts.locale, {
    dateStyle: 'medium',
    timeStyle: opts.withTime ? 'short' : undefined,
    timeZone: opts.timeZone,
  }).format(new Date(instant));

/**
 * Shows a date-only value as that same day in every time zone.
 * @param date A `YYYY-MM-DD` date.
 * @param locale The page's locale.
 * @returns The date.
 */
export const formatDate = (date: string, locale: string) =>
  formatInstant(`${date}T00:00:00Z`, { locale, timeZone: 'UTC' });

/**
 * Shows a period the API answered with, as "Sep 19 – Oct 18, 2026": the year once when both days
 * are in it.
 * @param period The response's `period`: its first and last day, `YYYY-MM-DD`, both included.
 * @param locale The page's locale.
 * @returns The two days.
 */
export const formatPeriod = (period: { from: string; to: string }, locale: string) => {
  const shortDay = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  const start =
    period.from.slice(0, 4) === period.to.slice(0, 4)
      ? shortDay.format(new Date(`${period.from}T00:00:00Z`))
      : formatDate(period.from, locale);

  return `${start} – ${formatDate(period.to, locale)}`;
};

/**
 * Counts the whole days since an instant, e.g. how long a deal has been in its stage.
 * @param instant An ISO 8601 instant.
 * @param now The current time.
 * @returns Whole days, rounded down; 0 for an instant ahead of `now`.
 */
export const daysSince = (instant: string, now: Date) =>
  Math.max(0, Math.floor((now.getTime() - Date.parse(instant)) / DAY));

/**
 * A record's number, shown in mono next to its name.
 * @param kind The kind of record.
 * @param id Its id.
 * @returns The number, e.g. `D-0042` (ids over 9999 keep all their digits).
 */
export const recordNumber = (kind: keyof typeof RECORD_PREFIXES, id: number) =>
  `${RECORD_PREFIXES[kind]}-${String(id).padStart(4, '0')}`;

/**
 * A person's full name, as the API's `fullName` writes it: the first name, then the last if any.
 * @param person Their first and last name.
 * @param person.firstName The first name.
 * @param person.lastName The last name, if any.
 * @returns The name.
 */
export const fullName = (person: { firstName: string; lastName?: string }) =>
  [person.firstName, person.lastName].filter(Boolean).join(' ');
