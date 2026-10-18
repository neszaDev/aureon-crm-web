import type { Permission } from './Permissions';
import { can } from './Permissions';

type WithPermissions = { permissions: Permission[] };

/**
 * Tells whether the caller may edit, archive or restore a record: with `RECORDS_EDIT_ANY`, or
 * when they own it. An unassigned record needs `RECORDS_EDIT_ANY`. The backend still checks.
 * @param workspace The workspace, with the caller's permissions.
 * @param me The caller's user id.
 * @param ownerId The record's owner, if any.
 * @returns Whether the edit controls show.
 */
export const canEditRecord = (workspace: WithPermissions, me: number, ownerId?: number) =>
  can(workspace, 'RECORDS_EDIT_ANY') || ownerId === me;

/**
 * Tells whether the caller may give a record to someone else, or unassign it
 * (`RECORDS_ASSIGN`); without it the owner field is read-only.
 * @param workspace The workspace, with the caller's permissions.
 * @returns Whether the owner field is editable.
 */
export const canAssign = (workspace: WithPermissions) => can(workspace, 'RECORDS_ASSIGN');
