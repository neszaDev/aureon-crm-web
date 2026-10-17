import * as z from 'zod';
import { WORKSPACE_ROLES } from './MemberValidation';

// Mirrors the backend's CreateInvitationRequest, which also trims and lower-cases the email.
// Messages are `Validation` translation keys.
export const InvitationValidation = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('invalid_email').max(254, 'too_long')),
  role: z.enum(WORKSPACE_ROLES, 'required'),
});

export type InvitationValues = z.input<typeof InvitationValidation>;
