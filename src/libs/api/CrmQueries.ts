import 'server-only';
import { cache } from 'react';
import type { ListQuery, ListSpec } from '@/libs/crm/ListQuery';
import { PAGE_SIZES } from '@/libs/crm/ListQuery';
import { toRecordId, toWorkspaceId } from '@/libs/crm/WorkspaceId';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';
import { authedBackend, backend } from './Backend';
import type { operations } from './schema';

/** What the task list takes (api.md, Tasks and reminders): the backend's own query params. */
export type TaskQuery = NonNullable<operations['list']['parameters']['query']>;

// Read-side CRM calls for server components, like `Queries.ts`. Each returns the data plus
// `unauthorized` (401: the session is gone), `forbidden` (403), `notFound` (404: unknown,
// or not a member: the backend answers both alike) and `invalid` (400: a list's query it
// refuses). Anything else leaves the data undefined.

const NOT_FOUND = {
  unauthorized: false,
  forbidden: false,
  notFound: true,
  invalid: false,
} as const;

/**
 * Reads the outcome flags of a backend response.
 * @param status HTTP status.
 * @returns The flags.
 */
const flags = (status: number) => ({
  unauthorized: status === 401,
  forbidden: status === 403,
  notFound: status === 404,
  invalid: status === 400,
});

/**
 * A list query as its endpoint's params: the filters are already named as the backend names them.
 * @param query The list query.
 * @returns The query params.
 */
const listParams = <S extends ListSpec>(query: ListQuery<S>) => ({
  ...query.filters,
  q: query.q,
  archived: query.archived,
  unassigned: query.unassigned,
  page: query.page,
  size: query.size,
  sort: query.sort,
  direction: query.direction,
});

/** The company list's sorts and filters (api.md, Companies). */
export const COMPANY_LIST = {
  sorts: ['NAME', 'CREATED_AT', 'UPDATED_AT'],
  defaultSort: 'NAME',
  filters: { ownerId: 'id', industry: 'text' },
} as const satisfies ListSpec;

/** The contact list's sorts and filters (api.md, Contacts). */
export const CONTACT_LIST = {
  sorts: ['NAME', 'COMPANY', 'CREATED_AT', 'UPDATED_AT'],
  defaultSort: 'NAME',
  filters: { companyId: 'id', ownerId: 'id', sourceId: 'id', tag: 'text' },
} as const satisfies ListSpec;

/** The Tasks page's views, its tabs: each a set of the task list's filters and a sort. */
export const TASK_VIEWS = ['mine', 'overdue', 'upcoming', 'completed', 'all'] as const;

/**
 * The Tasks page's URL state: its view, the assignee filter (`unassigned` too) and the paging.
 * The view sets the backend's filters and sort (`getTasks` takes them as the backend names them).
 */
export const TASK_LIST = {
  sorts: ['DUE_AT'],
  defaultSort: 'DUE_AT',
  filters: { view: { enum: TASK_VIEWS }, assigneeId: 'id' },
} as const satisfies ListSpec;

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
 * Loads a page of the workspace's companies (`GET /workspaces/{id}/companies`).
 * @param segment The `[workspaceId]` route segment.
 * @param query The list query, read with `COMPANY_LIST`.
 * @returns The page and the outcome flags (`invalid`: the backend refused the query).
 */
export const getCompanies = async (segment: string, query: ListQuery<typeof COMPANY_LIST>) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { companies: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/companies', {
    params: { path: { workspaceId }, query: listParams(query) },
  });

  return { companies: data, ...flags(response.status) };
};

/**
 * Loads one company (`GET /workspaces/{id}/companies/{id}`). Cached for the request, so the page
 * and its metadata share one call.
 * @param segment The `[workspaceId]` route segment.
 * @param id The `[id]` route segment.
 * @returns The company and the outcome flags (`notFound` for a malformed id too).
 */
export const getCompany = cache(async (segment: string, id: string) => {
  const workspaceId = toWorkspaceId(segment);
  const companyId = toRecordId(id);
  if (workspaceId === undefined || companyId === undefined) {
    return { company: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/companies/{id}', {
    params: { path: { workspaceId, id: companyId } },
  });

  return { company: data, ...flags(response.status) };
});

/**
 * Loads a page of the workspace's contacts (`GET /workspaces/{id}/contacts`).
 * @param segment The `[workspaceId]` route segment.
 * @param query The list query, read with `CONTACT_LIST`.
 * @returns The page and the outcome flags (`invalid`: the backend refused the query).
 */
export const getContacts = async (segment: string, query: ListQuery<typeof CONTACT_LIST>) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { contacts: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/contacts', {
    params: { path: { workspaceId }, query: listParams(query) },
  });

  return { contacts: data, ...flags(response.status) };
};

/**
 * Loads one contact (`GET /workspaces/{id}/contacts/{id}`). Cached for the request, so the page
 * and its metadata share one call.
 * @param segment The `[workspaceId]` route segment.
 * @param id The `[id]` route segment.
 * @returns The contact and the outcome flags (`notFound` for a malformed id too).
 */
export const getContact = cache(async (segment: string, id: string) => {
  const workspaceId = toWorkspaceId(segment);
  const contactId = toRecordId(id);
  if (workspaceId === undefined || contactId === undefined) {
    return { contact: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/contacts/{id}', {
    params: { path: { workspaceId, id: contactId } },
  });

  return { contact: data, ...flags(response.status) };
});

/**
 * Loads the tags of the workspace's active contacts, each once, sorted
 * (`GET /workspaces/{id}/contacts/tags`): the tag filter's options and the tag suggestions.
 * @param segment The `[workspaceId]` route segment.
 * @returns The tags and the outcome flags.
 */
export const getContactTags = async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { tags: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/contacts/tags', {
    params: { path: { workspaceId } },
  });

  return { tags: data, ...flags(response.status) };
};

/**
 * Loads a page of the activities on one record, newest first (`GET /workspaces/{id}/activities`).
 * A company's include those on its contacts and deals.
 * @param segment The `[workspaceId]` route segment.
 * @param link The record, such as `{ companyId: 7 }`.
 * @param page The page, from 0; each holds the default page size.
 * @returns The page and the outcome flags.
 */
export const getActivities = async (segment: string, link: ActivityLink, page: number) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { activities: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/activities', {
    params: { path: { workspaceId }, query: { ...link, page, size: PAGE_SIZES[0] } },
  });

  return { activities: data, ...flags(response.status) };
};

/**
 * Loads a page of tasks (`GET /workspaces/{id}/tasks`).
 * @param segment The `[workspaceId]` route segment.
 * @param query The filters, sort and paging, as the backend names them.
 * @returns The page and the outcome flags (`invalid`: the backend refused the query).
 */
export const getTasks = async (segment: string, query: TaskQuery) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { tasks: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/tasks', {
    params: { path: { workspaceId }, query },
  });

  return { tasks: data, ...flags(response.status) };
};

/**
 * Loads one task (`GET /workspaces/{id}/tasks/{id}`). Cached for the request, so the page and
 * its metadata share one call.
 * @param segment The `[workspaceId]` route segment.
 * @param id The `[id]` route segment.
 * @returns The task and the outcome flags (`notFound` for a malformed id too).
 */
export const getTask = cache(async (segment: string, id: string) => {
  const workspaceId = toWorkspaceId(segment);
  const taskId = toRecordId(id);
  if (workspaceId === undefined || taskId === undefined) {
    return { task: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/tasks/{id}', {
    params: { path: { workspaceId, id: taskId } },
  });

  return { task: data, ...flags(response.status) };
});

/**
 * Loads what a record page shows under its details: its open tasks by due time (the first 50),
 * its completed and cancelled ones, latest first (the first 20), the first page of its activity,
 * and the members (the task dialog's assignees).
 * @param segment The `[workspaceId]` route segment.
 * @param link The record, such as `{ companyId: 7 }`.
 * @returns The pages, the members, when they were read, and `unauthorized` (any of them 401).
 */
export const getRecordWork = async (segment: string, link: ActivityLink) => {
  const [open, closed, activities, members] = await Promise.all([
    getTasks(segment, { ...link, status: ['OPEN'], sort: 'DUE_AT', size: 50 }),
    getTasks(segment, {
      ...link,
      status: ['COMPLETED', 'CANCELLED'],
      sort: 'UPDATED_AT',
      direction: 'DESC',
      size: PAGE_SIZES[0],
    }),
    getActivities(segment, link, 0),
    getMembers(segment),
  ]);

  return {
    open: open.tasks,
    closed: closed.tasks,
    activities: activities.activities,
    members: members.members,
    readAt: new Date().toISOString(),
    unauthorized: [open, closed, activities, members].some((result) => result.unauthorized),
  };
};

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
