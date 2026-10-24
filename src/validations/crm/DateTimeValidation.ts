import * as z from 'zod';
import { toInstant } from '@/libs/crm/ZonedTime';

/**
 * A date and time as `DateTimeField` holds it: `YYYY-MM-DDTHH:mm` in the workspace's time zone,
 * a real one (`toInstant` reads it), or empty for none. Turned into an instant on submit.
 */
export const LocalDateTime = z
  .string()
  .refine((value) => value === '' || toInstant(value, 'UTC') !== undefined, 'invalid_date_time');

/** An instant as the backend sends and takes it, or null for none. */
export const Instant = z.iso.datetime().nullable();
