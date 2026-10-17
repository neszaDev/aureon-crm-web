import 'server-only';
import { cache } from 'react';
import { authedBackend } from './Backend';

// Read-side CRM calls for server components, like `Queries.ts`. Each returns the data plus
// `unauthorized` (401: the session is gone), `forbidden` (403) and `notFound` (404: unknown,
// or not a member: the backend answers both alike). Anything else leaves the data undefined.

/**
 * Turns a route segment into a workspace id, so a malformed URL is "not found" without asking
 * the backend (15 digits always fit a JavaScript number).
 * @param segment The `[workspaceId]` route segment.
 * @returns The id, or undefined.
 */
const toWorkspaceId = (segment: string) =>
  /^\d{1,15}$/u.test(segment) ? Number(segment) : undefined;

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
 * Loads the members of a workspace (`GET /workspaces/{id}/members`).
 * @param segment The `[workspaceId]` route segment.
 * @returns The members and the outcome flags.
 */
export const getMembers = async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { members: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/members', {
    params: { path: { workspaceId } },
  });

  return { members: data, ...flags(response.status) };
};
