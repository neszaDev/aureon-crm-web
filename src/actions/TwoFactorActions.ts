'use server';

import { getTranslations } from 'next-intl/server';
import type { TwoFactorFailureReason, TwoFactorValues } from '@/validations/TwoFactorValidation';
import { TWO_FACTOR_FAILURES, twoFactorOutcome } from '@/validations/TwoFactorValidation';

/**
 * Result of a two-factor step. Failures carry a translated message and the code the error
 * dialog prints (`#1-<code>`, like the Vue app's dialog codes).
 */
export type TwoFactorResult =
  | { ok: true }
  | { ok: false; reason: TwoFactorFailureReason; message: string; code: string };

// The Spring API has no 2FA endpoints yet (planned: POST /api/v1/auth/2fa/send and
// /api/v1/auth/2fa/verify, see docs/plans/0003-vue-ui-port.md). Until then both actions say so
// instead of pretending to send or verify anything.

/**
 * Builds a failed result with its translated message.
 * @param reason Why the step failed.
 * @returns The failed result.
 */
const failure = async (reason: TwoFactorFailureReason): Promise<TwoFactorResult> => {
  const t = await getTranslations('TwoFactorActions');
  const tValidation = await getTranslations('Validation');
  const message =
    reason === 'invalid_code' ? tValidation('two_factor_code') : t('error_unavailable');

  return { ok: false, reason, message, code: TWO_FACTOR_FAILURES[reason] };
};

/**
 * Asks the backend to send a new two-factor code to the signed-in user's email.
 * @returns Always "not available yet" until the backend serves the endpoint.
 */
export async function sendTwoFactorCode(): Promise<TwoFactorResult> {
  return await failure('unavailable');
}

/**
 * Checks a two-factor code: validates its shape, then would verify it on the backend.
 * @param values The code typed by the user.
 * @returns An invalid-code failure, or "not available yet" for a well-formed code.
 */
export async function verifyTwoFactorCode(values: TwoFactorValues): Promise<TwoFactorResult> {
  return await failure(twoFactorOutcome(values));
}
