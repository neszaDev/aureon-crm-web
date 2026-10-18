import * as z from 'zod';
import { Instant, LocalDateTime } from './DateTimeValidation';

/** A task's priorities, lowest first. */
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

const optionalId = z.number().int().positive().nullable();
// A record a picker linked: its id, and its name for the field to show.
const picked = z.object({ id: z.number().int().positive(), label: z.string() }).nullable();

// Mirrors the backend's TaskInput. Messages are `Validation` translation keys.
const fields = {
  title: z.string().trim().min(1, 'required').max(200, 'too_long'),
  description: z.string().trim().max(5000, 'too_long'),
  priority: z.enum(TASK_PRIORITIES),
  // Null: unassigned when editing, the caller when creating (as the backend reads it).
  assigneeId: optionalId,
};

/** The task dialog's fields: the due time as typed (empty for none), the linked records picked. */
export const TaskFormValidation = z.object({
  ...fields,
  dueAt: LocalDateTime,
  company: picked,
  contact: picked,
  lead: picked,
  deal: picked,
});

export type TaskFormValues = z.infer<typeof TaskFormValidation>;

/** What the actions send: the due time as an instant (a past one too) or null, links by id. */
export const TaskValidation = z.object({
  ...fields,
  dueAt: Instant,
  companyId: optionalId,
  contactId: optionalId,
  leadId: optionalId,
  dealId: optionalId,
});

export type TaskValues = z.infer<typeof TaskValidation>;
