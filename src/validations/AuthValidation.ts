import * as z from 'zod';

// Messages are translation keys in the `Validation` namespace. Limits mirror the backend's
// RegisterRequest / LoginRequest so users get the same answer before the round trip.

export const SignInValidation = z.object({
  email: z.email('invalid_email'),
  password: z.string().min(1, 'required'),
});

export const SignUpValidation = z.object({
  email: z.email('invalid_email').max(254, 'too_long'),
  password: z.string().min(6, 'password_too_short').max(72, 'password_too_long'),
});

export type AuthValues = z.infer<typeof SignUpValidation>;
