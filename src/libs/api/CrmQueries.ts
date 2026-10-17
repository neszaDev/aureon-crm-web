import 'server-only';
import { cache } from 'react';
import { toWorkspaceId } from '@/libs/crm/WorkspaceId';
import { authedBackend, backend } from './Backend';

// Read-side CRM calls for server components, like `Queries.ts`. Each returns the data plus
// `unauthorized` (401: the session is gone), `forbidden` (403) and `notFound` (404: unknown,
// or not a member: the backend answers both alike). Anything else leaves the data undefined.

const NOT_FOUND = { unauthorized: false, forbidden: false, notFound: true } as const;

/**
 * Reads the outcome flags of a backend response.
 * @param status HTTP status.
 * @returns The flags.
 */
const flags = (status: number) => ({
  unauthorized: status === 401,
  forbidden: status === 403,
  notFound: status === 404,
});

/**
 * Loads the signed-in user's workspaces (`GET /workspaces`), by name.
 * @returns The workspaces (id, name, role) and the outcome flags.
 */
export const getMyWorkspaces = async () => {
  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces');

  return { workspaces: data, ...flags(response.status) };
};

/**
 * Loads one workspace with the caller's role and permissions (`GET /workspaces/{id}`). Cached
 * for the request, so the shell and the page share one call.
 * @param segment The `[workspaceId]` route segment.
 * @returns The workspace and the outcome flags.
 */
export const getWorkspace = cache(async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { workspace: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}', {
    params: { path: { workspaceId } },
  });

  return { workspace: data, ...flags(response.status) };
});

/**
 * Loads the members of a workspace (`GET /workspaces/{id}/members`). Cached for the request, so
 * a page and its metadata share one call.
 * @param segment The `[workspaceId]` route segment.
 * @returns The members and the outcome flags.
 */
export const getMembers = cache(async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { members: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/members', {
    params: { path: { workspaceId } },
  });

  return { members: data, ...flags(response.status) };
});

/**
 * Loads the pending invitations, newest first (`GET /workspaces/{id}/invitations`, needs
 * `MEMBERS_MANAGE`).
 * @param segment The `[workspaceId]` route segment.
 * @returns The invitations and the outcome flags.
 */
export const getInvitations = async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { invitations: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/invitations', {
    params: { path: { workspaceId } },
  });

  return { invitations: data, ...flags(response.status) };
};

/**
 * Loads the pipeline stages by position: the open ones, then Won and Lost
 * (`GET /workspaces/{id}/pipeline-stages`). Cached for the request.
 * @param segment The `[workspaceId]` route segment.
 * @returns The stages and the outcome flags.
 */
export const getStages = cache(async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { stages: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/pipeline-stages', {
    params: { path: { workspaceId } },
  });

  return { stages: data, ...flags(response.status) };
});

/**
 * Loads every lead source, archived ones included (`GET /workspaces/{id}/lead-sources`). Cached
 * for the request.
 * @param segment The `[workspaceId]` route segment.
 * @returns The sources and the outcome flags.
 */
export const getLeadSources = cache(async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { sources: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/lead-sources', {
    params: { path: { workspaceId }, query: { includeArchived: true } },
  });

  return { sources: data, ...flags(response.status) };
});

/**
 * Previews an invitation link (`GET /invitations/{token}`, public, so without the session: a
 * rejected access token must not hide the invitation).
 * @param token The link's token, already checked with `InvitationTokenValidation`. A secret:
 *   never log it.
 * @returns The invitation (workspace, email, role, status) and `notFound` (unknown token).
 */
export const getInvitationPreview = async (token: string) => {
  const { data, response } = await backend.GET('/api/v1/invitations/{token}', {
    params: { path: { token } },
  });

  return { invitation: data, notFound: response.status === 404 };
};
