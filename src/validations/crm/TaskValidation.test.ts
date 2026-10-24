import { describe, expect, it } from 'vitest';
import type { TaskFormValues, TaskValues } from './TaskValidation';
import { TaskFormValidation, TaskValidation } from './TaskValidation';

const VALID: TaskValues = {
  title: 'Send the proposal',
  description: '',
  dueAt: null,
  priority: 'MEDIUM',
  assigneeId: null,
  companyId: null,
  contactId: null,
  leadId: null,
  dealId: null,
};

/**
 * Validates the task with some fields changed.
 * @param changes The changed fields.
 * @returns The issues, as `path: message`.
 */
const issues = (changes: Partial<Record<keyof TaskValues, unknown>>) =>
  TaskValidation.safeParse({ ...VALID, ...changes }).error?.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`,
  ) ?? [];

describe('task validation', () => {
  it('takes a title of 1 to 200 characters, trimmed', () => {
    expect(issues({ title: '  ' })).toStrictEqual(['title: required']);
    expect(issues({ title: 'x'.repeat(200) })).toStrictEqual([]);
    expect(issues({ title: 'x'.repeat(201) })).toStrictEqual(['title: too_long']);
  });

  it('takes a description of at most 5000 characters', () => {
    expect(issues({ description: 'x'.repeat(5000) })).toStrictEqual([]);
    expect(issues({ description: 'x'.repeat(5001) })).toStrictEqual(['description: too_long']);
  });

  it('allows a due time in the past, or none', () => {
    expect(issues({ dueAt: '2020-01-01T00:00:00.000Z' })).toStrictEqual([]);
    expect(issues({ dueAt: null })).toStrictEqual([]);
    expect(issues({ dueAt: 'tomorrow' })).not.toStrictEqual([]);
  });

  it('takes the three priorities and record ids', () => {
    expect(issues({ priority: 'URGENT' })).not.toStrictEqual([]);
    expect(issues({ assigneeId: 4, contactId: 9 })).toStrictEqual([]);
    expect(issues({ dealId: 1.5 })).not.toStrictEqual([]);
  });
});

describe('task form validation', () => {
  const form: TaskFormValues = {
    title: 'Call back',
    description: '',
    dueAt: '',
    priority: 'HIGH',
    assigneeId: 3,
    company: { id: 7, label: 'Acme' },
    contact: null,
    lead: null,
    deal: null,
  };

  it('reads the due time as a local date and time to the minute, or none', () => {
    expect(TaskFormValidation.safeParse(form).success).toBeTruthy();
    expect(
      TaskFormValidation.safeParse({ ...form, dueAt: '2026-10-18T09:00' }).success,
    ).toBeTruthy();
    for (const dueAt of ['+012345-10-18T09:00', '2026-10-18T09:00:30', '2026-02-30T09:00']) {
      expect(TaskFormValidation.safeParse({ ...form, dueAt }).error?.issues[0]?.message).toBe(
        'invalid_date_time',
      );
    }
  });
});
