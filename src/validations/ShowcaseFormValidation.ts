import * as z from 'zod';

// At least one digit, one lowercase and one uppercase letter, and 8 characters.
const STRONG_PASSWORD = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/u;

// The sign-up form of the validation forms demo (the Vue page's vuelidate rules). It is a
// showcase, not a backend request. Messages are `Validation` translation keys.
export const ShowcaseSignUpValidation = z
  .object({
    firstName: z.string().min(1, 'required').min(3, 'min_3_characters'),
    lastName: z.string().min(1, 'required').min(2, 'min_2_characters'),
    userName: z.string().min(1, 'required').min(5, 'min_5_characters'),
    email: z.string().min(1, 'required').pipe(z.email('invalid_email')),
    password: z
      .string()
      .min(1, 'required')
      .min(8, 'min_8_characters')
      .regex(STRONG_PASSWORD, 'strong_password'),
    confirmPassword: z.string().min(1, 'required'),
    accept: z.boolean().refine((accepted) => accepted, 'accept_terms'),
  })
  .refine((values) => values.confirmPassword === values.password, {
    path: ['confirmPassword'],
    message: 'passwords_must_match',
  });

export type ShowcaseSignUpValues = z.infer<typeof ShowcaseSignUpValidation>;
