import * as z from 'zod';

/** Number of characters in a two-factor code (letters and digits). */
export const TWO_FACTOR_CODE_LENGTH = 6;

// The Vue 2FA step accepted a-z, A-Z and 0-9 only. The message is a `Validation` key.
export const TwoFactorValidation = z.object({
  code: z
    .string()
    .trim()
    .regex(new RegExp(`^[a-zA-Z0-9]{${TWO_FACTOR_CODE_LENGTH}}$`, 'u'), 'two_factor_code'),
});

export type TwoFactorValues = z.infer<typeof TwoFactorValidation>;

/** Why a two-factor step failed, and the code the error dialog prints (`#1-<code>`). */
export const TWO_FACTOR_FAILURES = { invalid_code: '42200', unavailable: '50100' } as const;

export type TwoFactorFailureReason = keyof typeof TWO_FACTOR_FAILURES;

/**
 * Decides how a verify request ends. The Spring API has no 2FA endpoint yet, so a well-formed
 * code is reported as "unavailable", never as verified.
 * @param values The submitted values.
 * @returns The failure reason.
 */
export const twoFactorOutcome = (values: unknown): TwoFactorFailureReason =>
  TwoFactorValidation.safeParse(values).success ? 'unavailable' : 'invalid_code';
