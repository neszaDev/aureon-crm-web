import * as z from 'zod';

/** Statuses accepted by the backend (`testresult/TestStatus`). */
export const TEST_STATUSES = ['PENDING', 'PASSED', 'FAILED'] as const;

export type TestStatus = (typeof TEST_STATUSES)[number];

// Mirrors the backend's CreateTestResultRequest. Messages are `Validation` translation keys.
export const TestResultValidation = z.object({
  testName: z.string().trim().min(1, 'required').max(100, 'too_long'),
  status: z.enum(TEST_STATUSES, 'required'),
  score: z.number('invalid_number').min(0, 'score_range').max(100, 'score_range'),
  testedAt: z.iso.datetime({ offset: true, message: 'invalid_date' }),
  notes: z.string().max(1000, 'too_long').optional(),
});

export type TestResultValues = z.infer<typeof TestResultValidation>;

/** Form variant: `<input type="datetime-local">` yields local time without an offset. */
export const TestResultFormValidation = TestResultValidation.extend({
  testedAt: z.string().min(1, 'required'),
});

export type TestResultFormValues = z.infer<typeof TestResultFormValidation>;
