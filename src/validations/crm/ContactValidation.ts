import * as z from 'zod';

const optionalText = (max: number) => z.string().trim().max(max, 'too_long');
const optionalId = z.number().int().positive().nullable();

// As ContactInput.EMAIL (a lead's too): an address with a dotted domain and no spaces.
export const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/u;

// Mirrors the backend's ContactInput (Create/UpdateContactRequest). Messages are `Validation`
// translation keys. Text fields hold what the inputs hold; an empty one is sent as absent. Values
// come out as the backend stores them (email in lower case, tags each once and sorted), so a
// saved form shows what was saved.
export const ContactValidation = z.object({
  firstName: z.string().trim().min(1, 'required').max(100, 'too_long'),
  lastName: optionalText(100),
  email: z
    .string()
    .trim()
    .max(254, 'too_long')
    .refine((value) => value === '' || EMAIL.test(value), 'invalid_email')
    .toLowerCase(),
  phone: optionalText(50),
  jobTitle: optionalText(100),
  companyId: optionalId,
  // Null: unassigned when editing, the caller when creating (as the backend reads it).
  ownerId: optionalId,
  sourceId: optionalId,
  // Counted once trimmed, lower-cased and deduplicated, as the backend counts them.
  tags: z
    .array(z.string().trim().toLowerCase())
    .overwrite((tags) => [...new Set(tags)].toSorted())
    .max(20, 'too_many_tags')
    .refine((tags) => tags.every((tag) => tag.length > 0 && tag.length <= 40), 'tag_length'),
  notes: optionalText(5000),
});

export type ContactValues = z.infer<typeof ContactValidation>;

// What a duplicate check sends: the email and phone as typed so far, valid or not yet.
export const ContactDuplicateValidation = z.object({
  email: z.string().trim().max(254),
  phone: z.string().trim().max(50),
});

export type ContactDuplicateValues = z.infer<typeof ContactDuplicateValidation>;
