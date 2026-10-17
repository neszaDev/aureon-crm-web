import * as z from 'zod';
import { NewPasswordValidation } from '@/validations/AuthValidation';
import { ProfileValidation } from '@/validations/ProfileValidation';
import { WORKSPACE_ROLES } from './MemberValidation';

// Mirrors the backend's CreateInvitationRequest, which also trims and lower-cases the email.
// Messages are `Validation` translation keys.
export const InvitationValidation = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('invalid_email').max(254, 'too_long')),
  role: z.enum(WORKSPACE_ROLES, 'required'),
});

export type InvitationValues = z.input<typeof InvitationValidation>;

/**
 * An invitation link's token: one path segment of URL-safe characters (the backend issues 43).
 * Anything else is an unknown link, never sent to the backend.
 */
export const InvitationTokenValidation = z.string().regex(/^[\w-]{1,256}$/u);

// Mirrors RegisterThroughInvitationRequest: the account's email is the invitation's, and an
// empty display name leaves it unset.
export const InvitationRegisterValidation = ProfileValidation.extend({
  password: NewPasswordValidation,
});

export type InvitationRegisterValues = z.input<typeof InvitationRegisterValidation>;
