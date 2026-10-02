import type { useFormatter } from 'next-intl';

type Formatter = ReturnType<typeof useFormatter>;

/**
 * Month names from January on, in the active locale (the "months" labels of the CoreUI charts).
 * @param format The next-intl formatter.
 * @param count How many months; past December the names repeat.
 * @param width `long` (January) or `short` (Jan).
 * @returns One name per data point.
 */
export const monthNames = (format: Formatter, count: number, width: 'long' | 'short' = 'long') =>
  Array.from({ length: count }, (_, index) =>
    format.dateTime(new Date(Date.UTC(2026, index % 12, 1)), {
      month: width,
      timeZone: 'UTC',
    }),
  );
