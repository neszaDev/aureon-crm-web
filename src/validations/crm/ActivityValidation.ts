import * as z from 'zod';
import { Instant, LocalDateTime } from './DateTimeValidation';

/** The kinds of activity, in the order the composer offers them. */
export const ACTIVITY_TYPES = ['CALL', 'EMAIL', 'MEETING', 'NOTE'] as const;

const optionalId = z.number().int().positive().nullable();

// Mirrors the backend's ActivityInput. Messages are `Validation` translation keys.
const fields = {
  type: z.enum(ACTIVITY_TYPES),
  subject: z.string().trim().min(1, 'required').max(200, 'too_long'),
  body: z.string().trim().max(5000, 'too_long'),
};

/** The composer's fields; "When" as typed, in the workspace's time zone. */
export const ActivityFormValidation = z.object({ ...fields, occurredAt: LocalDateTime });

export type ActivityFormValues = z.infer<typeof ActivityFormValidation>;

/**
 * What the actions send: when it happened as an instant (null: now on a new activity, unchanged
 * on an edit), and the records it is on, at least one (the backend's `fieldErrors.links`).
 */
export const ActivityValidation = z
  .object({
    ...fields,
    occurredAt: Instant,
    companyId: optionalId,
    contactId: optionalId,
    leadId: optionalId,
    dealId: optionalId,
  })
  .refine(
    (values) => [values.companyId, values.contactId, values.leadId, values.dealId].some(Boolean),
    { message: 'required', path: ['links'] },
  );

export type ActivityValues = z.infer<typeof ActivityValidation>;

/** The one record a timeline lists the activities of: what `loadActivities` takes. */
export const ActivityLinkValidation = z.union([
  z.strictObject({ companyId: z.number().int().positive() }),
  z.strictObject({ contactId: z.number().int().positive() }),
  z.strictObject({ leadId: z.number().int().positive() }),
  z.strictObject({ dealId: z.number().int().positive() }),
]);

export type ActivityLink = z.infer<typeof ActivityLinkValidation>;
