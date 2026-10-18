import * as z from 'zod';

const optionalText = (max: number) => z.string().trim().max(max, 'too_long');

// Mirrors the backend's CompanyInput (Create/UpdateCompanyRequest). Messages are `Validation`
// translation keys. Fields hold what the inputs hold (text); an empty one is sent as absent.
export const CompanyValidation = z.object({
  name: z.string().trim().min(1, 'required').max(200, 'too_long'),
  industry: optionalText(100),
  // As CompanyInput.WEBSITE: an http(s) URL without spaces, in any case.
  website: optionalText(255).refine(
    (value) => value === '' || /^https?:\/\/\S+$/iu.test(value),
    'website_format',
  ),
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

// What a duplicate check sends: the name and website as typed so far, valid or not yet.
export const CompanyDuplicateValidation = z.object({
  name: z.string().trim().max(200),
  website: z.string().trim().max(255),
});

export type CompanyDuplicateValues = z.infer<typeof CompanyDuplicateValidation>;
