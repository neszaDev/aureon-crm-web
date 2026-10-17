import * as z from 'zod';
import { NewPasswordValidation } from './AuthValidation';

// Mirror the backend's UpdateProfileRequest and ChangePasswordRequest. Messages are
// `Validation` translation keys.

/** An empty display name clears it. */
export const ProfileValidation = z.object({
  displayName: z.string().trim().max(100, 'too_long'),
});

export type ProfileValues = z.infer<typeof ProfileValidation>;

// The confirmation stays in the browser; it guards against a typo locking the user out.
export const PasswordChangeValidation = z
  .object({
    currentPassword: z.string().min(1, 'required'),
    newPassword: NewPasswordValidation,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'passwords_must_match',
    path: ['confirmPassword'],
  });

export type PasswordChangeValues = z.infer<typeof PasswordChangeValidation>;
