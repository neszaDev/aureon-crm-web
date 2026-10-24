import * as z from 'zod';
import type { components } from '@/libs/api/schema';
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

/**
 * A saved task's fields as the actions send them, an absent field empty: what an assignee change
 * sends back unchanged. Linked to a contact or a deal, its company is left for the backend to
 * derive again, as the dialog does.
 * @param task The task.
 * @returns The values.
 */
export const taskValues = (task: components['schemas']['TaskResponse']): TaskValues => ({
  title: task.title,
  description: task.description ?? '',
  priority: task.priority,
  assigneeId: task.assignee?.userId ?? null,
  dueAt: task.dueAt ?? null,
  companyId: task.contact || task.deal ? null : (task.company?.id ?? null),
  contactId: task.contact?.id ?? null,
  leadId: task.lead?.id ?? null,
  dealId: task.deal?.id ?? null,
});
