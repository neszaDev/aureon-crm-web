import * as z from 'zod';

/** ISO 4217 codes this runtime knows, upper case (`USD`, `THB`, ...). */
export const CURRENCIES = Intl.supportedValuesOf('currency');

/**
 * IANA time zones this runtime knows, plus `UTC`: the options of the time-zone field. The list
 * holds only region zones, while a browser or server set to UTC reports that name.
 */
export const TIME_ZONES = [...Intl.supportedValuesOf('timeZone'), 'UTC'].toSorted();

const currencies = new Set(CURRENCIES);

/**
 * Tells whether the runtime knows a time zone under this name. Engines list renamed zones under
 * different spellings (V8 `Asia/Calcutta`, Firefox and Safari `Asia/Kolkata`) but accept both,
 * so this checks acceptance rather than a list; the backend stays the authority.
 * @param value The zone name.
 * @returns Whether it is a time zone.
 */
const isTimeZone = (value: string) => {
  try {
    // Throws a RangeError for a zone it doesn't know.
    return new Intl.DateTimeFormat('en', { timeZone: value }).resolvedOptions().timeZone !== '';
  } catch {
    return false;
  }
};

// Mirrors the backend's CreateWorkspaceRequest. Messages are `Validation` translation keys.
export const WorkspaceValidation = z.object({
  name: z.string().trim().min(1, 'required').max(100, 'too_long'),
  defaultCurrency: z.string().refine((value) => currencies.has(value), 'invalid_currency'),
  timezone: z.string().refine(isTimeZone, 'invalid_time_zone'),
});

export type WorkspaceValues = z.infer<typeof WorkspaceValidation>;
