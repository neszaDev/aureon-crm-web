import * as z from 'zod';

/** Workspace roles, from most to least rights (the backend's `WorkspaceRole`). */
export const WORKSPACE_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'SALES_REP'] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

// Mirrors the backend's UpdateMemberRequest. Messages are `Validation` translation keys.
export const MemberRoleValidation = z.object({
  role: z.enum(WORKSPACE_ROLES, 'required'),
});

/**
 * The roles someone may give: only owners give (or manage) the owner role.
 * @param callerRole Their role.
 * @returns The roles.
 */
export const assignableRoles = (callerRole: WorkspaceRole) =>
  callerRole === 'OWNER' ? WORKSPACE_ROLES : WORKSPACE_ROLES.filter((role) => role !== 'OWNER');
