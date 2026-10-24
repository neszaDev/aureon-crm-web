import * as z from 'zod';

// Messages are translation keys in the `Validation` namespace. Limits mirror the backend's
// RegisterRequest / LoginRequest so users get the same answer before the round trip.

/**
 * A new password: 6-72 characters and at most 72 UTF-8 bytes, BCrypt's limit (the backend's
 * rule for registration, invitation sign-up and password change).
 */
export const NewPasswordValidation = z
  .string()
  .min(6, 'password_too_short')
  .max(72, 'password_too_long')
  .refine((value) => new TextEncoder().encode(value).length <= 72, 'password_too_many_bytes');

export const SignInValidation = z.object({
  email: z.email('invalid_email'),
  password: z.string().min(1, 'required'),
});

export const SignUpValidation = z.object({
  email: z.email('invalid_email').max(254, 'too_long'),
  password: NewPasswordValidation,
});

export type AuthValues = z.infer<typeof SignUpValidation>;
