import * as z from 'zod';

/** ISO 4217 codes this runtime knows, upper case (`USD`, `THB`, ...). */
export const CURRENCIES = Intl.supportedValuesOf('currency');

/**
 * IANA time zones this runtime knows, plus `UTC`: the list holds only region zones, while a
 * browser or server set to UTC reports that name.
 */
export const TIME_ZONES = [...Intl.supportedValuesOf('timeZone'), 'UTC'].toSorted();

const currencies = new Set(CURRENCIES);
const timeZones = new Set(TIME_ZONES);

// Mirrors the backend's CreateWorkspaceRequest. Messages are `Validation` translation keys.
export const WorkspaceValidation = z.object({
  name: z.string().trim().min(1, 'required').max(100, 'too_long'),
  defaultCurrency: z.string().refine((value) => currencies.has(value), 'invalid_currency'),
  timezone: z.string().refine((value) => timeZones.has(value), 'invalid_time_zone'),
});

export type WorkspaceValues = z.infer<typeof WorkspaceValidation>;
