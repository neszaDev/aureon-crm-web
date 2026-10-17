import * as z from 'zod';

// Mirrors the backend's CreateStageRequest / UpdateStageRequest. Messages are `Validation`
// translation keys.
export const StageValidation = z.object({
  name: z.string().trim().min(1, 'required').max(60, 'too_long'),
  probability: z
    .number('invalid_number')
    .int('probability_range')
    .min(0, 'probability_range')
    .max(100, 'probability_range'),
});

export type StageValues = z.infer<typeof StageValidation>;
