import * as z from 'zod';

// Mirrors the backend's CreateLeadSourceRequest / UpdateLeadSourceRequest. Messages are
// `Validation` translation keys.
export const LeadSourceValidation = z.object({
  name: z.string().trim().min(1, 'required').max(60, 'too_long'),
});

export type LeadSourceValues = z.infer<typeof LeadSourceValidation>;

// Mirrors UpdateLeadSourceRequest: the name and whether it is archived (offered no more).
export const LeadSourceUpdateValidation = LeadSourceValidation.extend({ archived: z.boolean() });

export type LeadSourceUpdateValues = z.infer<typeof LeadSourceUpdateValidation>;
