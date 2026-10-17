import type { components } from '@/libs/api/schema';

type Workspace = components['schemas']['WorkspaceResponse'];

/** A workspace permission, as the backend names it (`MEMBERS_MANAGE`, `EXPORT`, ...). */
export type Permission = NonNullable<Workspace['permissions']>[number];

/**
 * Tells whether the signed-in member may take an action in a workspace. The list comes from
 * `GET /workspaces/{id}`; the UI hides what this denies, and the backend still checks.
 * @param workspace The workspace, with the caller's permissions.
 * @param permission The permission the action needs.
 * @returns Whether the caller has it.
 */
export const can = (workspace: Pick<Workspace, 'permissions'>, permission: Permission) =>
  workspace.permissions?.includes(permission) ?? false;
