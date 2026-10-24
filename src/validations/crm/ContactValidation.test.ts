import { describe, expect, it } from 'vitest';
import type { ContactValues } from './ContactValidation';
import { ContactDuplicateValidation, ContactValidation } from './ContactValidation';

const VALID: ContactValues = {
  firstName: 'Mia',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  companyId: null,
  ownerId: null,
  sourceId: null,
  tags: [],
  notes: '',
};

/**
 * Validates the contact with one field changed.
 * @param field The field.
 * @param value Its value.
 * @returns That field's first message, or undefined when it is valid.
 */
const messageFor = <K extends keyof ContactValues>(field: K, value: ContactValues[K]) =>
  ContactValidation.safeParse({ ...VALID, [field]: value }).error?.issues.find(
    (issue) => issue.path[0] === field,
  )?.message;

const tags = (count: number) => Array.from({ length: count }, (_, index) => `tag-${index}`);

describe('contact validation', () => {
  it('requires a first name of at most 100 characters', () => {
    expect(messageFor('firstName', '  ')).toBe('required');
    expect(messageFor('firstName', 'x')).toBeUndefined();
    expect(messageFor('firstName', 'x'.repeat(100))).toBeUndefined();
    expect(messageFor('firstName', 'x'.repeat(101))).toBe('too_long');
  });

  it('caps the optional text fields as the backend does', () => {
    for (const [field, max] of [
      ['lastName', 100],
      ['phone', 50],
      ['jobTitle', 100],
      ['notes', 5000],
    ] as const) {
      expect(messageFor(field, '')).toBeUndefined();
      expect(messageFor(field, 'x'.repeat(max))).toBeUndefined();
      expect(messageFor(field, 'x'.repeat(max + 1))).toBe('too_long');
    }
  });

  it('takes an email with a dotted domain, of at most 254 characters, in lower case', () => {
    const local = 'a'.repeat(254 - '@acme.co'.length);

    for (const email of ['', 'mia@acme.co', ' Mia@Acme.Co.TH ', `${local}@acme.co`]) {
      expect(messageFor('email', email)).toBeUndefined();
    }
    expect(messageFor('email', `${local}a@acme.co`)).toBe('too_long');
    for (const email of ['mia', 'mia@acme', 'mia @acme.co', 'mia@acme..co', '@acme.co']) {
      expect(messageFor('email', email)).toBe('invalid_email');
    }
    expect(ContactValidation.parse({ ...VALID, email: ' Mia@Acme.Co ' }).email).toBe('mia@acme.co');
  });

  it('takes up to 20 tags, trimmed, in lower case and each once', () => {
    expect(messageFor('tags', tags(20))).toBeUndefined();
    expect(messageFor('tags', tags(21))).toBe('too_many_tags');
    // 21 typed, 20 once the same tag in another case is counted once.
    expect(messageFor('tags', [...tags(20), 'TAG-0'])).toBeUndefined();
    expect(ContactValidation.parse({ ...VALID, tags: [' VIP ', 'b2b', 'vip'] }).tags).toStrictEqual(
      ['b2b', 'vip'],
    );
  });

  it('takes tags of 1 to 40 characters', () => {
    expect(messageFor('tags', ['x'.repeat(40)])).toBeUndefined();
    expect(messageFor('tags', ['x'.repeat(41)])).toBe('tag_length');
    expect(messageFor('tags', ['  '])).toBe('tag_length');
  });

  it('takes a company, an owner and a source, or none', () => {
    for (const field of ['companyId', 'ownerId', 'sourceId'] as const) {
      expect(messageFor(field, null)).toBeUndefined();
      expect(messageFor(field, 5)).toBeUndefined();
    }
  });

  it('sends the duplicate check the email and phone trimmed', () => {
    expect(
      ContactDuplicateValidation.parse({ email: ' Mia@Acme.co ', phone: ' 081 234 5678 ' }),
    ).toStrictEqual({ email: 'Mia@Acme.co', phone: '081 234 5678' });
  });
});
