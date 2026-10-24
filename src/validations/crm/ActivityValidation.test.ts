import { describe, expect, it } from 'vitest';
import type { ActivityValues } from './ActivityValidation';
import {
  ActivityFormValidation,
  ActivityLinkValidation,
  ActivityValidation,
} from './ActivityValidation';

const VALID: ActivityValues = {
  type: 'CALL',
  subject: 'Discovery call',
  body: '',
  occurredAt: null,
  companyId: 7,
  contactId: null,
  leadId: null,
  dealId: null,
};

/**
 * Validates the activity with some fields changed.
 * @param changes The changed fields.
 * @returns The issues, as `path: message`.
 */
const issues = (changes: Partial<Record<keyof ActivityValues, unknown>>) =>
  ActivityValidation.safeParse({ ...VALID, ...changes }).error?.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`,
  ) ?? [];

describe('activity validation', () => {
  it('takes a subject of 1 to 200 characters, trimmed', () => {
    expect(issues({ subject: '   ' })).toStrictEqual(['subject: required']);
    expect(issues({ subject: 'x'.repeat(200) })).toStrictEqual([]);
    expect(issues({ subject: 'x'.repeat(201) })).toStrictEqual(['subject: too_long']);
    expect(ActivityValidation.parse({ ...VALID, subject: ' Call ' }).subject).toBe('Call');
  });

  it('takes a body of at most 5000 characters', () => {
    expect(issues({ body: 'x'.repeat(5000) })).toStrictEqual([]);
    expect(issues({ body: 'x'.repeat(5001) })).toStrictEqual(['body: too_long']);
  });

  it('needs at least one linked record, as the backend does', () => {
    expect(issues({ companyId: null })).toStrictEqual(['links: required']);
    expect(issues({ companyId: null, dealId: 3 })).toStrictEqual([]);
    expect(issues({ companyId: 0 })).not.toStrictEqual([]);
  });

  it('takes one of the four types, and an instant or none for when it happened', () => {
    expect(issues({ type: 'VISIT' })).not.toStrictEqual([]);
    expect(issues({ occurredAt: '2026-10-18T02:00:00.000Z' })).toStrictEqual([]);
    expect(issues({ occurredAt: '2026-10-18T09:00' })).not.toStrictEqual([]);
  });
});

describe('activity form validation', () => {
  const form = { type: 'NOTE', subject: 'Note', body: '', occurredAt: '2026-10-18T09:00' };

  it('reads "When" as a local date and time to the minute', () => {
    expect(ActivityFormValidation.safeParse(form).success).toBeTruthy();
    for (const occurredAt of ['12345-10-18T09:00', '2026-10-18T09:00:30', '2026-10-18T']) {
      expect(
        ActivityFormValidation.safeParse({ ...form, occurredAt }).error?.issues[0]?.message,
      ).toBe('invalid_date_time');
    }
  });
});

describe('activity link validation', () => {
  it('takes one record to list the activities of', () => {
    for (const link of [{ companyId: 7 }, { contactId: 7 }, { leadId: 7 }, { dealId: 7 }]) {
      expect(ActivityLinkValidation.safeParse(link).success).toBeTruthy();
    }
  });

  it('refuses none, two, another filter or a bad id, as a crafted call could send', () => {
    for (const link of [{}, { companyId: 7, contactId: 8 }, { authorId: 7 }, { companyId: -1 }]) {
      expect(ActivityLinkValidation.safeParse(link).success).toBeFalsy();
    }
  });
});
