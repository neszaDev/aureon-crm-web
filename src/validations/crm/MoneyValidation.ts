import * as z from 'zod';

export { CurrencyCode } from './WorkspaceValidation';

/**
 * A money amount as the backend takes it: a decimal string of up to 13 digits and 2 decimals,
 * without grouping, sign or exponent. It stays a string: no float on the way.
 */
export const MoneyAmount = z
  .string()
  .trim()
  .regex(/^\d{1,13}(?:\.\d{1,2})?$/u, 'money_format');
