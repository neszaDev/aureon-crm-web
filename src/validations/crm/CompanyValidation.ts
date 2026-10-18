import * as z from 'zod';

const optionalText = (max: number) => z.string().trim().max(max, 'too_long');

// A leading scheme, even mistyped (`http:/`, `https:x`, `http//`), which stays for the format
// check to refuse; a colon before a digit is a port (`acme.com:8080`), not a scheme.
const SCHEME_ATTEMPT = /^[a-z][a-z\d+.-]*(?::\/*(?!\d)|\/\/)/iu;

/**
 * A website as typed, with `https://` in front when it has no scheme (`acme.com`). Idempotent.
 * @param value The trimmed website.
 * @returns The website to check and send.
 */
const withScheme = (value: string) =>
  value && !SCHEME_ATTEMPT.test(value) ? `https://${value}` : value;

// Mirrors the backend's CompanyInput (Create/UpdateCompanyRequest). Messages are `Validation`
// translation keys. Fields hold what the inputs hold (text); an empty one is sent as absent.
export const CompanyValidation = z.object({
  name: z.string().trim().min(1, 'required').max(200, 'too_long'),
  industry: optionalText(100),
  // Then as CompanyInput.WEBSITE: an http(s) URL without spaces, in any case.
  website: z
    .string()
    .trim()
    .overwrite(withScheme)
    .max(255, 'too_long')
    .refine((value) => value === '' || /^https?:\/\/\S+$/iu.test(value), 'website_format'),
  phone: optionalText(50),
  address: optionalText(500),
  employeeCount: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (/^\d{1,8}$/u.test(value) && Number(value) <= 10_000_000),
      'employee_count_range',
    ),
  // Null: unassigned when editing, the caller when creating (as the backend reads it).
  ownerId: z.number().int().positive().nullable(),
  notes: optionalText(5000),
});

export type CompanyValues = z.infer<typeof CompanyValidation>;

// What a duplicate check sends: the name and website as typed so far, valid or not yet, the
// website with the scheme the save would add.
export const CompanyDuplicateValidation = z.object({
  name: z.string().trim().max(200),
  website: z.string().trim().overwrite(withScheme).max(255),
});

export type CompanyDuplicateValues = z.infer<typeof CompanyDuplicateValidation>;
