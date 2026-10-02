import * as z from 'zod';

/** Roles the backend knows (`user/Role`). */
export const USER_ROLES = ['USER', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];

// Mirrors the backend's UpdateUserRequest. Messages are `Validation` translation keys.
export const UpdateUserValidation = z.object({
  email: z.email('invalid_email').max(254, 'too_long'),
  role: z.enum(USER_ROLES, 'required'),
});

export type UpdateUserValues = z.infer<typeof UpdateUserValidation>;
